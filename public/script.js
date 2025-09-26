document.addEventListener('DOMContentLoaded', () => {
    // --- Element selectors ---
    const contentArea = document.getElementById('content-area');
    const welcomeScreen = document.getElementById('welcome-screen');
    const choiceScreen = document.getElementById('choice-screen');
    const chatView = document.getElementById('chat-view');
    const chatBody = document.getElementById('chat-body');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const progressIndicator = document.getElementById('progress-indicator');
    const chatInputArea = document.getElementById('chat-input-area'); 
    
    // --- Single Event Listener using Event Delegation ---
    contentArea.addEventListener('click', (event) => {
        const button = event.target.closest('.choice-button');
        if (!button) return;

        const buttonId = button.id;
        const buttonText = button.innerText.trim();

        switch (buttonId) {
            case 'great-btn':
                welcomeScreen.style.display = 'none';
                choiceScreen.classList.remove('hidden');
                break;
            
            case 'okay-btn':
            case 'bad-btn':
                startConversation(buttonText);
                break;
            
            case 'ai-draft-btn':
                choiceScreen.style.display = 'none';
                startConversation("It was great!");
                break;

            case 'manual-review-btn':
                window.open(googleReviewUrl, '_blank');
                choiceScreen.innerHTML = `<h1 class="main-title">Thank you!</h1><p class="subtitle">We've opened the Google review page for you in a new tab.</p>`;
                break;
        }
    });

    function updateProgressBar(step) {
        const segments = progressIndicator.querySelectorAll('.progress-segment');
        segments.forEach((segment, index) => {
            if (index < step) {
                segment.classList.add('active');
            } else {
                segment.classList.remove('active');
            }
        });
    }

    function startConversation(firstMessage) {
        welcomeScreen.style.display = 'none';
        choiceScreen.style.display = 'none';
        chatView.classList.remove('hidden');

        if (firstMessage === "It was great!") {
            progressIndicator.classList.remove('hidden');
        }
        
        getAIResponse(firstMessage);
    }
    
    let conversationHistory = [];
    const placeId = 'Your_Google_Place_ID_Here';
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const avatarUrl = 'https://ucarecdn.com/c679e989-5032-408b-ae8a-83c7d204c67d/Vodafonebot.webp';
    
    async function getAIResponse(userMessage) { /* ... same as before ... */ }
    function addMessage(sender, text) { /* ... same as before ... */ }
    function showTypingIndicator() { /* ... same as before ... */ }
    function removeTypingIndicator() { /* ... same as before ... */ }
    function processAIResponse(text) { /* ... same as before ... */ }
    function handleFinalQuestion(question) { /* ... same as before ... */ }
    function createEditableDraft(reviewText) { /* ... same as before ... */ }
    function createMultiSelectButtons(options, step) { /* ... same as before ... */ }
    function clearQuickReplies() { /* ... same as before ... */ }

    // --- THIS IS THE KEY CHANGE ---
    function createPostButtons() {
        clearQuickReplies();
        const regenerateButton = document.createElement('button');
        regenerateButton.className = 'quick-reply-btn';
        regenerateButton.innerText = '🔄 Try another version';
        regenerateButton.onclick = () => {
             getAIResponse("That wasn't quite right, please try another version.", true);
        };

        const postButton = document.createElement('button');
        postButton.className = 'quick-reply-btn primary-action';
        postButton.innerText = '✅ Post to Google';
        
        // --- REWRITTEN ONCLICK LOGIC FOR POP-UP BLOCKER COMPATIBILITY ---
        postButton.onclick = () => {
            const draftText = document.getElementById('review-draft-textarea').value;
            
            // 1. Perform the two "trusted" actions immediately
            navigator.clipboard.writeText(draftText);
            window.open(googleReviewUrl, '_blank'); // This is now safe

            // 2. THEN, update the UI with the confirmation message
            // This happens after the new tab is already open
            chatBody.innerHTML = '';
            if (chatInputArea) chatInputArea.style.display = 'none';
            if (progressIndicator) progressIndicator.style.display = 'none';
            chatBody.style.backgroundColor = '#fff';
            chatBody.style.flexDirection = 'column';
            
            const confirmationHTML = `
                <div class="final-confirmation-screen">
                    <div class="final-title">
                        Review copied!
                    </div>
                    <p class="final-subtitle">We've opened Google for you. Just tap ⭐⭐⭐⭐⭐ and paste your review. Thank you!</p>
                </div>`;
            chatBody.innerHTML = confirmationHTML;
        };
        // --- END REWRITTEN LOGIC ---

        quickRepliesContainer.appendChild(regenerateButton);
        quickRepliesContainer.appendChild(postButton);
    }

    // Unchanged helper functions...
    function addMessage(sender, text) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        if (sender === 'concierge') {
            wrapper.innerHTML = `<img src="${avatarUrl}" class="chat-avatar" alt="TOBi"><div class="bubble">${text}</div>`;
        } else {
            wrapper.innerHTML = `<div class="bubble">${text}</div>`;
        }
        const bubble = wrapper.querySelector('.bubble');
        if (text.includes("main reason") || text.includes("service experience") || text.includes("Feel free to edit")) {
            bubble.classList.add('question-bubble');
        }
        chatBody.prepend(wrapper);
    }
    function showTypingIndicator() {
        if (document.querySelector('.typing-indicator')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper concierge typing-indicator';
        wrapper.innerHTML = `<img src="${avatarUrl}" class="chat-avatar" alt="TOBi typing"><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
        chatBody.prepend(wrapper);
    }
    function removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }
    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
    }
});
