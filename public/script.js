document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const inputRow = document.getElementById('input-row');

    let conversationHistory = [];
    let selectedKeywords = []; // Array to hold multiple selections
    const placeId = 'Your_Google_Place_ID_Here'; 
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

    function addMessage(sender, text, isHtml = false) { /* ... (This function remains the same as before) ... */ }
    async function sendMessage(content, isSilent = false) { /* ... (This function remains the same as before) ... */ }
    function showTypingIndicator() { /* ... (This function remains the same as before) ... */ }
    function removeTypingIndicator() { /* ... (This function remains the same as before) ... */ }

    // --- CORE LOGIC UPDATES ARE HERE ---

    function processAIResponse(text, isInitialGreeting = false) {
        removeTypingIndicator();

        if (isInitialGreeting) {
            addMessage('concierge', text);
            createInitialReplies();
            return;
        }
        
        const quoteRegex = /"(.*?)"/;
        const matches = text.match(quoteRegex);

        if (text.includes("What made your visit great today?")) {
            addMessage('concierge', text);
            createMultiSelectReplies(["✨ Friendly Staff", "🦷 Gentle Hygienist", "👍 Dr. Evans' Care", "🏢 Clean Office", "🕒 On-Time Appointment", "💬 Clear Explanations", "Other"]);
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
    
    // Creates the initial 🙂 😐 🙁 buttons
    function createInitialReplies() {
        createQuickReplies(["🙂 It was great!", "😐 It was okay.", "🙁 It wasn't good."]);
    }

    // Creates the multi-select checklist
    function createMultiSelectReplies(replies) {
        clearQuickReplies();
        inputRow.style.display = 'none';
        selectedKeywords = []; // Reset selections

        replies.forEach(replyText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.innerText = replyText;
            button.onclick = () => {
                // Toggle selection
                button.classList.toggle('selected');
                const keyword = replyText;
                if (selectedKeywords.includes(keyword)) {
                    selectedKeywords = selectedKeywords.filter(item => item !== keyword);
                } else {
                    selectedKeywords.push(keyword);
                }
                updateContinueButton(); // Show/hide continue button
            };
            quickRepliesContainer.appendChild(button);
        });
    }
    
    // Shows or hides the "Continue" button based on selections
    function updateContinueButton() {
        let continueBtn = document.getElementById('continue-btn');
        if (selectedKeywords.length > 0) {
            if (!continueBtn) {
                continueBtn = document.createElement('button');
                continueBtn.id = 'continue-btn';
                continueBtn.className = 'continue-btn';
                continueBtn.innerText = 'Continue';
                continueBtn.onclick = () => {
                    const combinedMessage = selectedKeywords.join(', ');
                    sendMessage(combinedMessage);
                };
                quickRepliesContainer.appendChild(continueBtn);
            }
        } else {
            if (continueBtn) {
                continueBtn.remove();
            }
        }
    }
    
    function createEditableDraft(reviewText) { /* ... (This function remains the same as before) ... */ }
    function createQuickReplies(replies) { /* ... (This function remains the same as before, but is now simpler) ... */ }
    function createPostButtons() { /* ... (This function remains the same as before) ... */ }
    function clearQuickReplies() { /* ... (This function remains the same as before) ... */ }
    
    // ---UNCHANGED FUNCTIONS (PASTE THEM HERE)---
    
    // Copy the full, unchanged functions from the previous response for:
    // addMessage, sendMessage, showTypingIndicator, removeTypingIndicator,
    // createEditableDraft, createQuickReplies, createPostButtons, clearQuickReplies
    // And the event listeners and initial greeting logic.
    // For brevity, I am not repeating them all here, but you MUST have them in your file.
    // (The full version will be provided next as requested)
});
