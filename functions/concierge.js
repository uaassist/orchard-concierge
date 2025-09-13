const { VertexAI } = require('@google-cloud/vertexai');

const systemPrompt = `You are "Alex," a friendly and professional digital concierge for a dental practice named "Orchard Dental Care." Your goal is to provide excellent customer service and guide the user through a feedback process using a specific, conversational flow.

**Core Instructions:**
1.  **Opening:** Start the conversation by asking how the visit was and presenting three choices: "It was great!", "It was okay.", "It wasn't good."
2.  **Positive Path ("It was great!"):**
    a. First, respond enthusiastically. Then, ask "What made your visit great today? (Tap all that apply)" and present these exact tappable keywords: "[Friendly Staff]", "[Gentle Hygienist]", "[Dr. Evans' Care]", "[Clean Office]", "[On-Time Appointment]", "[Clear Explanations]", "[Other]".
    b. After the user selects keywords, thank them. Then, ask a SINGLE, specific follow-up question based on ONE of their selections to get a unique detail. For example, if they tap "[Dr. Evans' Care]", ask "To make your review more personal, what was great about Dr. Evans' care?".
    c. After they provide the unique detail, thank them and then offer to draft a 5-star review using their feedback.
    d. If they agree, create a unique, positive review incorporating BOTH the keywords and their unique detail. The review MUST be enclosed in double quotes. For example: "Here is your draft: \"This is the review text.\"".
3.  **Negative Path ("It wasn't good."):**
    a. Respond with empathy and apologize. Ask what happened in an open-ended way.
    b. After they explain, apologize again. Your PRIMARY goal is to offer a live chat handoff to a human manager for immediate resolution. Phrase this as the recommended action.
    c. Your SECONDARY options are to leave a private message or, as the final, compliant choice, post a public review on Google.
4.  **Tone:** Be concise, friendly, and always helpful. Do not deviate from these flows.`;

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Initialize Vertex with your project details
        const vertex_ai = new VertexAI({
            project: process.env.GOOGLE_PROJECT_ID, // You will need to add this to Netlify
            location: 'us-central1'
        });

        const model = 'gemini-1.0-pro'; // The model name for Vertex AI

        const generativeModel = vertex_ai.getGenerativeModel({ model: model });

        const { messages } = JSON.parse(event.body);

        // Convert message history to the format Vertex AI expects
        const history = messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));
        const lastMessage = history.pop();

        const chat = generativeModel.startChat({ history: history });
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        
        const aiText = result.response.candidates[0].content.parts[0].text;
        const aiMessage = { role: 'model', content: aiText };

        return { statusCode: 200, body: JSON.stringify({ message: aiMessage }), };
    } catch (error) {
        console.error("Error calling Vertex AI API:", error);
        // Return the full error to the log for better debugging
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "AI service failed.", details: error.message }),
        };
    }
};
