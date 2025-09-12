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
            // This is the error message the user sees
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
            return; // Stop here for the initial greeting
        }
        
        // This part handles all subsequent messages from the AI
        const quoteRegex = /"(.*?)"/;
        const matches = text.match(quoteRegex);

        if (text.includes("Tap all that apply")) {
            addMessage('concierge', text);
            createQuickReplies(["✨ Friendly Staff", "🦷 Gentle Hygienist", "👍 Dr. Evans' Care", "🏢 Clean Office", "🕒 On-Time Appointment", "💬 Clear Explanations", "Other"]);
        } else if (text.includes("draft a 5-star review")) {
             addMessage('concierge', text);
             createQuickReplies(["✨ Yes, draft it for me!", "No, thanks"]);
        } else if (matches && matches[1].length > 10) { // Found a review draft
            const reviewText = matches[1];
            const htmlText = `Here's a draft based on your feedback:<br><br><i>"${reviewText}"</i><br><br>Feel free to edit it. When you're ready, just tap below.`;
            addMessage('concierge', htmlText, true);
            createPostButtons(reviewText);
        }
         else {
            addMessage('concierge', text);
        }
    }

    // Create tappable buttons in the UI
    function createQuickReplies(replies) {
        quickRepliesContainer.innerHTML = '';
        inputRow.style.display = 'none'; // Hide text input when buttons are shown
        replies.forEach(replyText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.innerText = replyText;
            button.onclick = () => {
                sendMessage(replyText);
            };
            quickRepliesContainer.appendChild(button);
        });
    }
    
     function createPostButtons(reviewText) {
        quickRepliesContainer.innerHTML = '';
        inputRow.style.display = 'none';
        
        const postButton = document.createElement('button');
        postButton.className = 'quick-reply-btn';
        postButton.innerText = '✅ Post to Google';
        postButton.onclick = () => {
            navigator.clipboard.writeText(reviewText).then(() => {
                window.open(googleReviewUrl, '_blank');
                addMessage('concierge', 'Great! I\'ve copied the text and opened the Google review page for you. Just paste the text and click post!');
            });
        };

        const regenerateButton = document.createElement('button');
        regenerateButton.className = 'quick-reply-btn';
        regenerateButton.innerText = '🔄 Try another version';
        regenerateButton.onclick = () => {
             sendMessage("That wasn't quite right, please try another version.", true);
        };

        quickRepliesContainer.appendChild(regenerateButton);
        quickRepliesContainer.appendChild(postButton);
    }

    // Clear all quick reply buttons
    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
        inputRow.style.display = 'flex';
    }

    // Event listeners for sending message
    sendButton.addEventListener('click', () => {
        if (chatInput.value.trim()) sendMessage(chatInput.value);
        chatInput.value = '';
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
            sendButton.click();
        }
    });
    
    // Initial greeting from Alex
    const initialGreeting = "Hi! I'm Alex, your digital concierge. How was your visit today?";
    setTimeout(() => {
        // We now pass 'true' to tell the function this is the first message
        processAIResponse(initialGreeting, true); 
    }, 1000);
    showTypingIndicator();
});
