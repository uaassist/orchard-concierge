document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const inputRow = document.getElementById('input-row');
    let conversationHistory = [];
    const placeId = 'Your_Google_Place_ID_Here'; // <-- PASTE YOUR PLACE ID HERE
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const avatarUrl = 'https://ucarecdn.com/c679e989-5032-408b-ae8a-83c7d204c67d/Vodafonebot.webp';
    let selectedKeywords = [];

    // Add a message to the chat UI
    function addMessage(sender, text, isHtml = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        if (sender === 'concierge') {
            const avatarImg = document.createElement('img');
            avatarImg.src = avatarUrl;
            avatarImg.className = 'chat-avatar';
            avatarImg.alt = 'TOBi the Assistant';
            wrapper.appendChild(avatarImg);
        }
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        if (isHtml) { bubble.innerHTML = text; } else { bubble.innerText = text; }
        wrapper.appendChild(bubble);
        chatBody.prepend(wrapper);
    }

    // Send message to the AI backend and get response
    async function getAIResponse(userMessage) {
        if (userMessage) {
            conversationHistory.push({ role: 'user', content: userMessage });
            if (userMessage !== "Hello") { // Don't show the initial "Hello"
                addMessage('user', userMessage);
            }
        }
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

    function showTypingIndicator() { /* ... unchanged ... */ }
    function removeTypingIndicator() { /* ... unchanged ... */ }

    // Process the AI's text to show messages and buttons
    function processAIResponse(text) {
        removeTypingIndicator();
        if (text.includes("|")) {
            const parts = text.split('|');
            const statement = parts[0].trim();
            const question = parts[1].trim();
            addMessage('concierge', statement);
            setTimeout(() => {
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    handleFinalQuestion(question);
                }, 1200);
            }, 1000);
        } else {
            handleFinalQuestion(text);
        }
    }
    
    // This function's only job is to display the final message part and any associated buttons
    function handleFinalQuestion(question) {
        addMessage('concierge', question);
        if (question.toLowerCase().includes("how was your visit") || question.toLowerCase().includes("share your feedback")) {
            createQuickReplies(["🙂 It was great!", "😐 It was okay.", "🙁 It wasn't good."]);
        } else if (question.includes("main reason for your visit today?")) {
            const tier1Options = ["📱 New Phone/Device", "🔄 Plan Upgrade/Change", "🔧 Technical Support", "💳 Bill Payment", "👤 New Account Setup", "➡️ More options"];
            createMultiSelectButtons(tier1Options);
        } else if (question.includes("what else stood out?")) {
            const tier2Options = ["⭐ Helpful Staff", "💨 Fast Service", "🏬 Clean Store", "👍 Easy Process", "🤝 Problem Solved", "👍 No Other Highlights"];
            createMultiSelectButtons(tier2Options);
        } else if (question.toLowerCase().includes("would you like me to draft")) {
             createQuickReplies(["✨ Yes, draft it for me!", "No, thanks"]);
        } else if (question.includes("Here's a draft")) {
            const reviewText = question.match(/"(.*?)"/)[1];
            createEditableDraft(reviewText);
        }
    }
    
    function createEditableDraft(reviewText) { /* ... unchanged ... */ }
    function createQuickReplies(replies) { /* ... unchanged ... */ }
    function createMultiSelectButtons(options) { /* ... unchanged ... */ }
    function createPostButtons() { /* ... unchanged ... */ }
    function clearQuickReplies() { /* ... unchanged ... */ }
    
    // --- All supporting functions (unchanged, for completeness) ---
    
    function showTypingIndicator() {
        if (document.querySelector('.typing-indicator')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper concierge typing-indicator';
wrapper.innerHTML = <img src="${avatarUrl}" class="chat-avatar" alt="TOBi typing"><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>;
chatBody.prepend(wrapper);
}
function removeTypingIndicator() {
const indicator = document.querySelector('.typing-indicator');
if (indicator) indicator.remove();
}
function createEditableDraft(reviewText) {
clearQuickReplies();
const wrapper = document.createElement('div');
wrapper.id = 'review-draft-wrapper';
const textArea = document.createElement('textarea');
textArea.id = 'review-draft-textarea';
textArea.className = 'review-draft-textarea';
textArea.value = reviewText;
wrapper.appendChild(textArea);
chatBody.prepend(wrapper);
addMessage('concierge', 'Feel free to edit it. When you're ready, just tap below.');
createPostButtons();
}
function createQuickReplies(replies) {
clearQuickReplies();
inputRow.style.display = 'none';
replies.forEach(replyText => {
const button = document.createElement('button');
button.className = 'quick-reply-btn';
button.innerText = replyText;
button.onclick = () => { getAIResponse(replyText); };
quickRepliesContainer.appendChild(button);
});
}
function createMultiSelectButtons(options) {
clearQuickReplies();
inputRow.style.display = 'none';
selectedKeywords = [];
options.forEach(optionText => {
const button = document.createElement('button');
button.className = 'quick-reply-btn';
button.innerText = optionText;
button.onclick = () => {
if (optionText === "➡️ More options") {
addMessage('user', 'More options');
button.style.display = 'none';
showTypingIndicator();
setTimeout(() => {
removeTypingIndicator();
handleFinalQuestion("what else stood out?");
}, 800);
return;
}
button.classList.toggle('selected');
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
const combinedMessage = selectedKeywords.length > 0 ? selectedKeywords.join(', ') : "No Other Highlights";
getAIResponse(combinedMessage);
};
quickRepliesContainer.appendChild(continueButton);
}
function createPostButtons() {
clearQuickReplies();
inputRow.style.display = 'none';
const postButton = document.createElement('button');
postButton.className = 'quick-reply-btn';
postButton.innerText = '✅ Post to Google';
postButton.onclick = () => {
const draftText = document.getElementById('review-draft-textarea').value;
navigator.clipboard.writeText(draftText).then(() => {
window.open(googleReviewUrl, '_blank');
});
};
const regenerateButton = document.createElement('button');
regenerateButton.className = 'quick-reply-btn';
regenerateButton.innerText = '🔄 Try another version';
regenerateButton.onclick = () => {
getAIResponse("That wasn't quite right, please try another version.", true);
};
quickRepliesContainer.appendChild(regenerateButton);
quickRepliesContainer.appendChild(postButton);
}
function clearQuickReplies() {
quickRepliesContainer.innerHTML = '';
inputRow.style.display = 'flex';
}
sendButton.addEventListener('click', () => { if (chatInput.value.trim()) { getAIResponse(chatInput.value); chatInput.value = ''; } });
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && chatInput.value.trim()) { sendButton.click(); } });
        // --- CORRECTED INITIALIZATION ---
    // We start the conversation by sending an initial "Hello" to the AI.
    // The AI's response to this will be the two-bubble greeting.
    getAIResponse("Hello");
});
