document.addEventListener('DOMContentLoaded', () => {
    // --- All selectors and event listeners at the top remain the same ---
    const contentArea = document.getElementById('content-area');
    const welcomeScreen = document.getElementById('welcome-screen');
    const choiceScreen = document.getElementById('choice-screen');
    const chatView = document.getElementById('chat-view');
    const chatBody = document.getElementById('chat-body');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const progressIndicator = document.getElementById('progress-indicator');
    const chatInputArea = document.getElementById('chat-input-area-styled'); // Get the input area to hide it

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
    
    // --- The code down to createPostButtons remains the same ---
    // (getAIResponse, processAIResponse, handleFinalQuestion, etc. are unchanged)
    let conversationHistory = [];
    const placeId = 'Your_Google_Place_ID_Here';
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const avatarUrl = 'https://ucarecdn.com/c679e989-5032-408b-ae8a-83c7d204c67d/Vodafonebot.webp';
    
    async function getAIResponse(userMessage) { /* ... same as before ... */ }
    function addMessage(sender, text, isHtml = false, isQuestion = false) { /* ... same as before ... */ }
    function showTypingIndicator() { /* ... same as before ... */ }
    function removeTypingIndicator() { /* ... same as before ... */ }
    function processAIResponse(text) { /* ... same as before ... */ }
    function handleFinalQuestion(question) { /* ... same as before ... */ }
    function createEditableDraft(reviewText) { /* ... same as before ... */ }
    function createMultiSelectButtons(options, step) { /* ... same as before ... */ }
    function clearQuickReplies() { /* ... same as before ... */ }
    // --- Unchanged code ends here ---

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
        
        // --- REWRITTEN ONCLICK LOGIC ---
        postButton.onclick = () => {
            const draftText = document.getElementById('review-draft-textarea').value;
            
            navigator.clipboard.writeText(draftText).then(() => {
                // 1. Clean up the UI
                chatBody.innerHTML = ''; // Clear all previous chat messages
                chatInputArea.style.display = 'none'; // Hide the button area
                progressIndicator.style.display = 'none'; // Hide the progress bar
                
                // 2. Change chat background and display the new confirmation screen
                chatBody.style.backgroundColor = '#fff';
                chatBody.style.flexDirection = 'column'; // Override reverse direction for centering
                
                const confirmationHTML = `
                    <div class="final-confirmation-screen">
                        <div class="final-title">
                            Review copied! Opening Google
                            <span class="loading-dots">
                                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            </span>
                        </div>
                        <p class="final-subtitle">Just tap ⭐⭐⭐⭐⭐ and paste your review. Thank you!</p>
                    </div>
                `;
                chatBody.innerHTML = confirmationHTML;

                // 3. Wait for 3 seconds before redirecting
                setTimeout(() => {
                    window.open(googleReviewUrl, '_blank');
                }, 3000);

            }).catch(err => {
                console.error('Failed to copy text: ', err);
                // Optionally, show an error message to the user
                addMessage('concierge', 'Sorry, there was an error copying the text. Please copy it manually.');
            });
        };
        // --- END REWRITTEN LOGIC ---

        quickRepliesContainer.appendChild(regenerateButton);
        quickRepliesContainer.appendChild(postButton);
    }
});
