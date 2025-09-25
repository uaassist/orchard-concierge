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

    function addMessage(sender, text, isHtml = false, isQuestion = false) {
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
        if (isQuestion) {
            bubble.classList.add('question-bubble');
        }
        if (isHtml) { bubble.innerHTML = text; } else { bubble.innerText = text; }
        wrapper.appendChild(bubble);
        chatBody.prepend(wrapper);
    }

    async function getAIResponse(userMessage) {
        if (userMessage) {
            conversationHistory.push({ role: 'user', content: userMessage });
            if (userMessage.toLowerCase() !== "hello") { addMessage('user', userMessage); }
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
            addMessage('concierge', statement, false, false);
            setTimeout(() => {
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    handleFinalQuestion(question);
                }, 300);
            }, 200);
        } else {
            const quoteRegex = /"(.*?)"/s;
            const matches = text.match(quoteRegex);
             if (matches && matches[1].length > 10) {
                addMessage('concierge', "Here's a draft based on your feedback:");
                createEditableDraft(matches[1]);
            } else {
                addMessage('concierge', text, false, false);
            }
        }
    }
    function handleFinalQuestion(question) {
        addMessage('concierge', question, false, true);
        if (question.toLowerCase().includes("how was your visit") || question.toLowerCase().includes("share your feedback")) {
            createQuickReplies(["🙂 It was great!", "😐 It was okay.", "🙁 It wasn't good."], true);
        } else if (question.includes("main reason for your visit today?")) {
            createMultiSelectButtons(["✨ Friendly Staff", "🦷 Gentle Hygienist", "👍 Dr. Evans' Care", "🏢 Clean Office", "🕒 On-Time Appointment", "💬 Clear Explanations", "➡️ More options"]);
        } else if (question.includes("what else stood out?")) {
            createMultiSelectButtons(["🤖 Advanced Technology", "🛋️ Comfortable Environment", "💳 Billing Was Easy", "🧸 Great with Kids", "👍 No Other Highlights"]);
        } else if (question.toLowerCase().includes("would you like me to draft")) {
             createQuickReplies(["✨ Yes, draft it for me!", "No, thanks"]);
        }
    }
    function createEditableDraft(reviewText) {
        clearQuickReplies();
        const wrapper = document.createElement('div');
        const textArea = document.createElement('textarea');
        textArea.id = 'review-draft-textarea';
        textArea.className = 'review-draft-textarea';
        textArea.value = reviewText;
        wrapper.appendChild(textArea);
        chatBody.prepend(wrapper);
        addMessage('concierge', 'Feel free to edit it. When you\'re ready, just tap below.', false, true);
        createPostButtons();
    }
    function createQuickReplies(replies, useColumnLayout = false) {
        clearQuickReplies();
        inputRow.style.display = 'none';
        if (useColumnLayout) {
            quickRepliesContainer.classList.add('column-layout');
        } else {
            quickRepliesContainer.classList.remove('column-layout');
        }
        replies.forEach(replyText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            if (replyText.includes("Yes, draft it for me")) {
                button.classList.add('primary-action');
            }
            button.innerText = replyText;
            button.onclick = () => { getAIResponse(replyText); };
            quickRepliesContainer.appendChild(button);
        });
    }
    function createMultiSelectButtons(options) {
        clearQuickReplies();
        inputRow.style.display = 'none';
        quickRepliesContainer.classList.remove('column-layout');
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
                    }, 400);
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
        quickRepliesContainer.classList.remove('column-layout');
        const regenerateButton = document.createElement('button');
        regenerateButton.className = 'quick-reply-btn';
        regenerateButton.innerText = '🔄 Try another version';
        regenerateButton.onclick = () => {
             getAIResponse("That wasn't quite right, please try another version.", true);
        };
        const postButton = document.createElement('button');
        postButton.className = 'quick-reply-btn primary-action';
        postButton.innerText = '✅ Post to Google';
        postButton.onclick = () => {
            const draftText = document.getElementById('review-draft-textarea').value;
            navigator.clipboard.writeText(draftText).then(() => {
                window.open(googleReviewUrl, '_blank');
            });
        };
        quickRepliesContainer.appendChild(regenerateButton);
        quickRepliesContainer.appendChild(postButton);
    }
    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
        inputRow.style.display = 'flex';
        chatInput.disabled = false;
    }
    sendButton.addEventListener('click', () => { if (chatInput.value.trim()) { getAIResponse(chatInput.value); chatInput.value = ''; } });
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && chatInput.value.trim()) { sendButton.click(); } });
    setTimeout(() => {
        getAIResponse("Hello");
    }, 250);
    showTypingIndicator();
});
