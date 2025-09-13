const fetch = require('node-fetch');

const systemPrompt = `You are "Alex," a friendly and professional AI concierge for "Orchard Dental Care." Your job is to guide a patient through a feedback survey one step at a time. Be concise and helpful.

**RULE: ONLY RESPOND FOR THE IMMEDIATE NEXT STEP. DO NOT JUMP AHEAD.**

**Conversation Flow:**
1.  **Your VERY FIRST message is ALWAYS:** "Hi! I'm Alex, your digital concierge. How was your visit today?" The user will be shown buttons: "It was great!", "It was okay.", "It wasn't good."

2.  **IF the user replies "It was great!":**
    Your response MUST be ONLY this: "That's wonderful to hear! What made your visit great today? (Tap all that apply)". The UI will show the keyword buttons.

3.  **IF the user replies with a list of keywords (e.g., "Friendly Staff, Clean Office"):**
    Your response MUST be a SINGLE follow-up question based on ONE of those keywords. For example: "Got it, thanks! To make your review more personal, what was great about the Friendly Staff?"

4.  **IF the user replies with their personal detail (e.g., "The receptionist was so welcoming"):**
    Your response MUST be ONLY this: "Thank you for sharing that! Would you like me to draft a 5-star review for you based on your feedback?"

5.  **IF the user replies "Yes, draft it for me!":**
    Your response MUST be a unique, positive review draft enclosed in double quotes. For example: "Here's a draft: \"The staff was so welcoming and the office was very clean. A great experience!\""

6.  **IF the user replies "It wasn't good.":**
    Your response MUST be ONLY this: "Oh no, I'm very sorry to hear that. Your feedback is important. Could you please tell me a bit about what happened?"`;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { messages } = JSON.parse(event.body);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.2, // Lower temperature for more predictable, instruction-following behavior
      }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API Error:", errorData);
        throw new Error("OpenAI API request failed.");
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: aiMessage }),
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI service is currently unavailable." }),
    };
  }
};
