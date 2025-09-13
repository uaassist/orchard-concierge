document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const inputRow = document.getElementById('input-row');

    let conversationHistory = [];
    // IMPORTANT: Replace with your actual Google Place ID.
    const placeId = 'ChIJ_XvUSvXN1EARf1iO9YzU0SY'; 
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    let selectedKeywords = []; // NEW: Array to hold multiple selections

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
    function showTypingIndicator() { /* ... same as before ... */ }
    function removeTypingIndicator() { /* ... same as before ... */ }

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
        
        // UPDATED: Now calls createMultiSelectButtons
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
    function createEditableDraft(reviewText) { /* ... same as before ... */ }

    // Creates single-tap buttons
    function createQuickReplies(replies) {
        clearQuickReplies();
        inputRow.style.display = 'none';
        replies.forEach(replyText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.innerText = replyText;
            button.onclick = () => { sendMessage(replyText); };
            quickRepliesContainer.appendChild(button);
        });
    }
    
    // NEW: Creates multi-select buttons
    function createMultiSelectButtons(options) {
        clearQuickReplies();
        inputRow.style.display = 'none';
        selectedKeywords = []; // Reset selections

        options.forEach(optionText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.innerText = optionText;
            button.onclick = () => {
                button.classList.toggle('selected'); // Toggle a 'selected' style
                if (selectedKeywords.includes(optionText)) {
                    selectedKeywords = selectedKeywords.filter(k => k !== optionText);
                } else {
                    selectedKeywords.push(optionText);
                }
            };
            quickRepliesContainer.appendChild(button);
        });
        
        const continueButton = document.createElement('button');
        continueButton.className = 'quick-reply-btn continue-btn';
        continueButton.innerText = 'Continue';
        continueButton.onclick = () => {
            const combinedMessage = selectedKeywords.join(', ');
            sendMessage(combinedMessage);
        };
        quickRepliesContainer.appendChild(continueButton);
    }

    // Creates the final post buttons
    function createPostButtons() { /* ... same as before ... */ }

    // Clears the buttons
    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
        inputRow.style.display = 'flex';
    }

    // Event listeners for sending message
    sendButton.addEventListener('click', () => { /* ... same as before ... */ });
    chatInput.addEventListener('keypress', (e) => { /* ... same as before ... */ });
    
    // Initial greeting
    const initialGreeting = "Hi! I'm Alex, your digital concierge. How was your visit today?";
    setTimeout(() => {
        processAIResponse(initialGreeting, true); 
    }, 1000);
    showTypingIndicator();
});
