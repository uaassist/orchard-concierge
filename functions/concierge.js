const fetch = require('node-fetch');

const systemPrompt = `You are "Alex," an AI concierge for "Orchard Dental Care." You follow instructions precisely.

**CRITICAL RULE: YOUR ENTIRE RESPONSE MUST BE ONLY WHAT IS SPECIFIED IN THE FLOW. DO NOT ADD EXTRA WORDS OR DEVIATE.**

**Conversation Flow:**
1.  **Your VERY FIRST message is ALWAYS:** "Hi! I'm Alex, your digital concierge. How was your visit today?"

2.  **IF user says "It was great!":**
    Your response MUST be ONLY: "That's wonderful to hear! What made your visit great today? (Tap all that apply)"

3.  **IF user sends keywords (e.g., "Friendly Staff"):**
    Your response MUST be a SINGLE question based on ONE of those keywords. Example: "Got it, thanks! To make your review more personal, what was great about the Friendly Staff?"

4.  **IF user sends a personal detail (e.g., "The receptionist was welcoming"):**
    Your response MUST be ONLY: "Thank you for sharing that! Would you like me to draft a 5-star review for you based on your feedback?"

5.  **IF user says "Yes, draft it for me!":**
    Your response MUST START WITH "Here's a draft:" AND the review itself MUST be enclosed in double quotes.
    **EXAMPLE FORMAT:** Here's a draft: "The staff was so welcoming and the office was very clean. A great experience!"
    **DO NOT FORGET THE DOUBLE QUOTES AROUND THE REVIEW TEXT.**

6.  **IF user says "It wasn't good.":**
    Your response MUST be ONLY: "Oh no, I'm very sorry to hear that. Your feedback is important. Could you please tell me a bit about what happened?"`;

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
        temperature: 0.1,
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
