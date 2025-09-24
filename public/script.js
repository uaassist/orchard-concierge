document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const inputRow = document.getElementById('input-row');
    const thankYouScreen = document.getElementById('thank-you-screen');
    const chatInputArea = document.getElementById('chat-input-area');

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
         } else if (text.includes("What made your visit great today?")) {
            addMessage('concierge', text);
            const tier1Options = ["✨ Friendly Staff", "🦷 Gentle Hygienist", "👍 Dr. Evans' Care", "🏢 Clean Office", "🕒 On-Time Appointment", "💬 Clear Explanations", "➡️ More options"];
            createMultiSelectButtons(tier1Options);
         } else if (text.includes("what else stood out?")) {
            addMessage('concierge', text);
            const tier2Options = ["🤖 Advanced Technology", "🛋️ Comfortable Environment", "💳 Billing Was Easy", "🧸 Great with Kids", "👍 No Other Highlights"];
            createMultiSelectButtons(tier2Options);
         } else if (text.toLowerCase().includes("would you like me to draft")) {
             addMessage('concierge', text);
             createQuickReplies(["✨ Yes, draft it for me!", "No, thanks"]);
         } else {
            const quoteRegex = /"(.*?)"/;
            const matches = text.match(quoteRegex);
            if (matches && matches[1].length > 10) {
                const reviewText = matches[1];
                addMessage('concierge', "Here's a draft based on your feedback:");
                createEditableDraft(reviewText);
            } else {
                addMessage('concierge', text);
            }
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
                if (optionText === "➡️ More options") {
                    addMessage('user', 'More options');
                    button.style.display = 'none';
                    showTypingIndicator();
                    setTimeout(() => {
                        removeTypingIndicator();
                        const tier2Options = ["🤖 Advanced Technology", "🛋️ Comfortable Environment", "💳 Billing Was Easy", "🧸 Great with Kids"];
                        const continueButton = document.querySelector('.continue-btn');
                        tier2Options.forEach(tier2Text => {
                            const newButton = document.createElement('button');
                            newButton.className = 'quick-reply-btn';
                            newButton.innerText = tier2Text;
                            newButton.onclick = () => {
                                newButton.classList.toggle('selected');
                                if (selectedKeywords.includes(tier2Text)) {
                                    selectedKeywords = selectedKeywords.filter(k => k !== tier2Text);
                                } else {
                                    selectedKeywords.push(tier2Text);
                                }
                            };
                            quickRepliesContainer.insertBefore(newButton, continueButton);
                        });
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
                showThankYouScreen();
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

    function showThankYouScreen() {
        chatBody.style.opacity = '0';
        chatInputArea.style.opacity = '0';
        setTimeout(() => {
            chatBody.style.display = 'none';
            chatInputArea.style.display = 'none';
            thankYouScreen.classList.remove('hidden');
        }, 400);
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
