const fetch = require('node-fetch');

const systemPrompt = `You are Alex, an AI assistant. You follow instructions with perfect precision. Your responses MUST BE ONLY the text specified.

**Flow 1: First Message**
- Your response MUST BE ONLY: "Hi! I'm Alex, your digital concierge. How was your visit today?"

**Flow 2: User says "It was great!"**
- Your response MUST BE ONLY: "That's wonderful to hear! What made your visit great today? (Tap all that apply)"

**Flow 3: User sends keywords**
- Your response MUST BE a SINGLE question based on one keyword. Example: "Got it, thanks! To make your review more personal, what was great about the Friendly Staff?"

**Flow 4: User sends a personal detail**
- Your response MUST BE ONLY: "Thank you for sharing that! Would you like me to draft a 5-star review for you based on your feedback?"

**Flow 5: User says "Yes, draft it for me!"**
- Your response MUST follow this exact format: It must start with "Here's a draft:" and the review must be in double quotes.
- **CRITICAL EXAMPLE:** `Here's a draft: "The staff was so welcoming and the office was very clean. A great experience!"`
- **YOU MUST ALWAYS INCLUDE THE DOUBLE QUOTES AROUND THE REVIEW TEXT.**

**Flow 6: User says "It wasn't good."**
- Your response MUST BE ONLY: "Oh no, I'm very sorry to hear that. Your feedback is important. Could you please tell me a bit about what happened?"`;

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
        temperature: 0.1, // Set to a very low temperature for strict instruction following
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
