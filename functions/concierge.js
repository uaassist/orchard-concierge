const fetch = require('node-fetch');

// --- NEW: Curated Review Examples for a Telecom Retailer ---
const reviewExamples = `
- "Came in to upgrade my plan and the staff were super helpful. Oksana explained all the new options clearly and I got a great deal. The whole process was much faster than I expected."
- "Really clean and modern store. The team was friendly and helped me set up my new phone right there. A great, professional experience."
- "I had an issue with my billing and the manager, Andriy, was very patient and sorted it all out for me. Appreciate the great customer service."
- "Just a quick and easy visit to pick up a new SIM card. The staff were efficient and knew exactly what I needed."
`;

// --- NEW SYSTEM PROMPT: Tailored for Vodafone Ukraine ---
const systemPrompt = `You are "Alex," a friendly and helpful digital assistant for a "Vodafone Ukraine" retail store.

**Your Persona & Style Guide:**
- Act like a real, tech-savvy customer writing a helpful review. Your tone should be casual, efficient, and appreciative.
- Your primary goal is to match the style and vocabulary of the real customer reviews provided below.

**Real Customer Review Examples (Your Style Guide):**
${reviewExamples}

**CRITICAL Rules for the Review Draft:**
1.  **DO NOT INVENT DETAILS:** You can ONLY use the information the user has provided.
2.  **HUMAN TONE:** Use a casual, grounded tone. AVOID marketing words: "fantastic", "seamless", "unparalleled", "amazing".
3.  **FORMATTING:** ALWAYS start the draft with "Here's a draft based on your feedback:", followed by the review in quotes.

**Your Conversational Flow (DO NOT change this):**
1.  **Opening:** Start with: "Hi! I'm Alex, your digital assistant.|How was your visit to our Vodafone store today?"
2.  **Positive Path:** If the visit was great, respond: "That's great to hear! 🙂|What was the main reason for your visit today? (Tap all that apply)".
3.  **Acknowledge & Ask for Detail:** After they select keywords, acknowledge them and ask for a specific detail. Example: "Okay, got it. Helpful Staff and a Plan Upgrade. Thanks!|To make the draft more personal, what stood out about the staff who helped you?".
4.  **Handling "No Other Highlights":** If the message is "No Other Highlights", respond: "No problem at all!|Since you had a great visit overall, would you like me to draft a simple 5-star review for you?".
5.  **Offer to Draft:** After they give a detail, respond: "Perfect, thank you for sharing that!|Would you like me to draft a 5-star review for you based on your feedback?".
6.  **Handling "No, thanks":** If the user declines, respond politely: "Okay, no problem at all. Thanks again for your feedback today. Have a great day!"
7.  **Negative Path:** If the visit was not good, respond with empathy and offer to connect them to the store manager, using the "|" separator.`;

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
        temperature: 0.7,
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
