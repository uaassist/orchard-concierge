document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const inputRow = document.getElementById('input-row');

    let conversationHistory = [];
    // IMPORTANT: Replace with your actual Google Place ID.
    const placeId = 'Your_Google_Place_ID_Here'; 
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    let selectedKeywords = [];

    // Add a message to the chat UI
    function addMessage(sender, text, isHtml = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        if (isHtml) {
            bubble.innerHTML = text;
        } else {
            bubble.innerText = text;
        }
        wrapper.appendChild(bubble);
        chatBody.prepend(wrapper);
    }

    // Send message to the AI backend
    async function sendMessage(content, isSilent = false) {
        if (!isSilent) {
            addMessage('user', content);
        }
        conversationHistory.push({ role: 'user', content });
        clearQuickReplies();
        showTypingIndicator();

        try {
            const response = await fetch('/api/concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: conversationHistory }),
            });
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            const aiMessage = data.message;
            
            conversationHistory.push(aiMessage);
            processAIResponse(aiMessage.content);
        } catch (error) {
            console.error("Fetch Error:", error);
            processAIResponse('Sorry, I seem to be having trouble connecting. Please try again later.');
        }
    }
    
    // Show a "typing..." indicator
    function showTypingIndicator() {
        if (document.querySelector('.typing-indicator')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper concierge typing-indicator';
        wrapper.innerHTML = `<div class="bubble">...</div>`;
        chatBody.prepend(wrapper);
    }

    function removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }

    // Process the AI's response to show buttons or special actions
    function processAIResponse(text, isInitialGreeting = false) {
        removeTypingIndicator();
        if (isInitialGreeting) {
            addMessage('concierge', text);
            createQuickReplies(["🙂 It was great!", "😐 It was okay.", "🙁 It wasn't good."]);
            return;
        }
        
        const quoteRegex = /"(.*?)"/;
        const matches = text.match(quoteRegex);
        
        if (text.includes("Tap all that apply")) {
            addMessage('concierge', text);
            createMultiSelectButtons(["✨ Friendly Staff", "🦷 Gentle Hygienist", "👍 Dr. Evans' Care", "🏢 Clean Office", "🕒 On-Time Appointment", "💬 Clear Explanations", "Other"]);
        } else if (text.includes("draft a 5-star review")) {
             addMessage('concierge', text);
             createQuickReplies(["✨ Yes, draft it for me!", "No, thanks"]);
        } else if (matches && matches[1].length > 10) {
            const reviewText = matches[1];
            addMessage('concierge', "Here's a draft based on your feedback:");
            createEditableDraft(reviewText);
        }
         else {
            addMessage('concierge', text);
        }
    }
    
    // Creates the editable textarea
    function createEditableDraft(reviewText) {
        clearQuickReplies();
        const oldDraft = document.getElementById('review-draft-wrapper');
        if(oldDraft) oldDraft.remove();
        const wrapper = document.createElement('div');
        wrapper.id = 'revi
