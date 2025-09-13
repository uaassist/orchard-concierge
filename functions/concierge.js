const { GoogleGenerativeAI } = require("@google/generative-ai"); // Assuming you are back on Google, change if needed

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
  
  // This part is for Google Gemini. If you are using OpenAI, you will need the OpenAI version.
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

  const { messages } = JSON.parse(event.body);

  // The first message should just be the system prompt, not the whole history for the initial prompt.
  const history = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
  
  // The user's latest message is what we'll send.
  const lastMessage = history.pop(); 

  try {
    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.2, // Lower temperature for more predictable, instruction-following behavior
      },
    });

    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = result.response;
    const aiText = response.text();
    const aiMessage = { role: 'model', content: aiText };

    return {
      statusCode: 200,
      body: JSON.stringify({ message: aiMessage }),
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI service is currently unavailable." }),
    };
  }
};
