const fetch = require('node-fetch');

const reviewExamples = `
- "Came in to upgrade my plan and the staff were super helpful. Oksana explained all the new options clearly and I got a great deal. The whole process was much faster than I expected."
- "Really clean and modern store. The team was friendly and helped me set up my new phone right there. A great, professional experience."
- "I had an issue with my billing and the manager, Andriy, was very patient and sorted it all out for me. Appreciate the great customer service."
`;

// --- FINAL, STREAMLINED SYSTEM PROMPT ---
const systemPrompt = `You are "TOBi," a friendly and helpful digital assistant for a "Vodafone Ukraine" retail store.

**Your Conversational Flow (DO NOT change this):**

1.  **User says "It was great!":** This means they have already agreed to get help drafting a review from a previous screen. Your FIRST response MUST be to start the survey immediately. Respond with this exact phrase: "Excellent! Let's get a couple of details. First...|What was the main reason for your visit today? (Tap all that apply)".

2.  **After "Purpose of Visit":** Once the user provides the "Purpose" keywords, you MUST acknowledge and ask the second question: "Got it, thanks!|And what was your service experience like? (Tap all that apply)".

3.  **After "Service Experience":** Once the user provides the "Experience" keywords, the survey is complete. You MUST immediately generate the review draft. Your response starts with "Perfect, thank you! Based on your feedback, here is a draft for you:", followed by the review in quotes.

**CRITICAL Rules for the Review Draft:**
-   **NARRATIVE FLOW:** The "Purpose of Visit" is the main subject. The "Service Experience" keywords are the descriptive details. Weave them into a short, natural story.
-   **DO NOT INVENT DETAILS.**
-   **HUMAN TONE:** Use a casual, grounded tone based on the style guide.
-   **WORDS TO AVOID:** Do not use marketing words: "fantastic", "seamless", "unparalleled", "amazing".
-   **FORMATTING:** ALWAYS start the final draft message with "Perfect, thank you! Based on your feedback, here is a draft for you:", followed by the review in quotes.

**Handling Edge Cases:**
-   **Negative Path:** If the user's first message indicates the visit was not good (e.g., "It wasn't good"), respond with empathy and offer to connect them to the store manager.

**Real Customer Review Examples (Your Style Guide):**
${reviewExamples}`;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { messages } = JSON.parse(event.body);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [ { role: 'system', content: systemPrompt }, ...messages ],
        temperature: 0.75,
      }),
    });
    if (!response.ok) { const errorData = await response.json(); console.error("OpenAI API Error:", errorData); throw new Error("OpenAI API request failed."); }
    const data = await response.json();
    const aiMessage = data.choices[0].message;
    return { statusCode: 200, body: JSON.stringify({ message: aiMessage }), };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "AI service is currently unavailable." }), };
  }
};
