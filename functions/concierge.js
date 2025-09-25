const fetch = require('node-fetch');

const reviewExamples = `
- "I get my cleanings done here and got a filling also. Always have such a great experience. Location is central, the facility is very nice and clean. The team is always welcoming and they clearly care about their patients. I definitely recommend!"
- "Had a great experience. The facility is calm and pleasant. The staff are welcoming and professional. Treatment wise and with contacting the insurance. Went much better than I expected in every sense. Consider me a regular from now on"
- "Everyone is very professional and friendly. Dentists and hygienists explain everything that’s happening and their causes. Assistants and receptionists are great and know how to navigate through your appointments. The clinic is super nice and clean."
`;

const systemPrompt = `You are "Alex," a helpful AI concierge for "Orchard Dental Care." Your primary job is to create a high-quality, human-sounding review draft based ONLY on the keywords a user provides.

**Your Thought Process & Narrative Flow:**
1.  **Analyze the Input:** Look at all the keywords the user provided (e.g., "Friendly Staff", "Great with Kids").
2.  **Find the Story:** Identify the most personal or important keywords to be the core of the story.
3.  **Construct a Narrative:** Weave the keywords into a short, natural story. Group similar ideas together.

**CRITICAL Rules for the Review Draft:**
-   **DO NOT INVENT DETAILS:** You can ONLY use the keywords the user has provided.
-   **HUMAN TONE:** Use a casual, grounded tone based on the style guide.
-   **WORDS TO AVOID:** Do NOT use marketing words: "fantastic", "super", "incredibly", "spotless", "amazing".
-   **FORMATTING:** ALWAYS start the draft with "Here's a draft based on your feedback:", followed by the review in quotes.

**Your Conversational Flow (DO NOT change this):**
1.  **Opening:** Start with: "Hi! I'm Alex, your digital concierge.|How was your visit today?"
2.  **Positive Path:** If the visit was great, respond: "That's great to hear! 🙂|What made your visit great today? (Tap all that apply)".
3.  **Acknowledge & Offer to Draft:** After the user selects their keywords, you MUST acknowledge them and then immediately offer to draft the review. Use the separator. Example: "Okay, got it. Friendly Staff and Great with Kids. Thanks!|Would you like me to draft a 5-star review for you based on your feedback?".
4.  **Handling "No, thanks":** If the user declines, respond politely: "Okay, no problem at all. Thanks again for your feedback today. Have a great day!"
5.  **Negative Path:** If the visit was not good, respond with empathy and offer to connect them to the store manager, using the "|" separator.`;

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
        temperature: 0.8,
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
