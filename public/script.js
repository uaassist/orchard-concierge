document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const inputRow = document.getElementById('input-row');
    let conversationHistory = [];
    const placeId = 'Your_Google_Place_ID_Here'; // <-- PASTE YOUR PLACE ID HERE
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const avatarUrl = 'https://ucarecdn.com/2008f119-a819-4d18-8fb4-1236ca14b8b8/ChatGPTImageMay22202502_03_10PMezgifcomresize.png';
    let selectedKeywords = [];
    function addMessage(sender, text, isHtml = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        if (sender === 'concierge') {
            const avatarImg = document.createElement('img');
            avatarImg.src = avatarUrl;
            avatarImg.className = 'chat-avatar';
            avatarImg.alt = 'Alex the Concierge';
            wrapper.appendChild(avatarImg);
        }
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        if (isHtml) { bubble.innerHTML = text; } else { bubble.innerText = text; }
        wrapper.appendChild(bubble);
        chatBody.prepend(wrapper);
    }
    async function sendMessage(content, isSilent = false) {
        if (!isSilent) { addMessage('user', content); }
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
    function showTypingIndicator() {
        if (document.querySelector('.typing-indicator')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper concierge typing-indicator';
        wrapper.innerHTML = `<img src="${avatarUrl}" class="chat-avatar" alt="Alex typing"><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
        chatBody.prepend(wrapper);
    }
    function removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }
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
                    handleFinalMessagePart(question);
                }, 1200);
            }, 1000);
        } else {
            handleFinalMessagePart(text);
        }
    }
    function handleFinalMessagePart(text) {
         if (text.toLowerCase().includes("how was your visit today?")) {
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
        } else {
            addMessage('concierge', text);
        }
    }
    function createEditableDraft(reviewText) {
        clearQuickReplies();
        const oldDraft = document.getElementById('review-draft-wrapper');
        if(oldDraft) oldDraft.remove();
        const wrapper = document.createElement('div');
        wrapper.id = 'review-draft-wrapper';
        const textArea = document.createElement('textarea');
        textArea.id = 'review-draft-textarea';
        textArea.className = 'review-draft-textarea';
        textArea.value = reviewText;
        wrapper.appendChild(textArea);
        chatBody.prepend(wrapper);
        addMessage('concierge', 'Feel free to edit it. When you\'re ready, just tap below.');
        createPostButtons();
    }
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
    function createMultiSelectButtons(options) {
        clearQuickReplies();
        inputRow.style.display = 'none';
        selectedKeywords = [];
        options.forEach(optionText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.innerText = optionText;
            button.onclick = () => {
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
            const combinedMessage = selectedKeywords.length > 0 ? selectedKeywords.join(', ') : "No specific highlights";
            sendMessage(combinedMessage);
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
    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
        inputRow.style.display = 'flex';
    }
    sendButton.addEventListener('click', () => { if (chatInput.value.trim()) { sendMessage(chatInput.value); chatInput.value = ''; } });
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && chatInput.value.trim()) { sendButton.click(); } });
    setTimeout(() => {
        sendMessage("Hello", true);
    }, 500);
    showTypingIndicator();
});
