document.addEventListener('DOMContentLoaded', () => {
    // --- Element selectors ---
    const contentArea = document.getElementById('content-area');
    const welcomeScreen = document.getElementById('welcome-screen');
    const choiceScreen = document.getElementById('choice-screen');
    const chatView = document.getElementById('chat-view');
    const chatBody = document.getElementById('chat-body');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const progressIndicator = document.getElementById('progress-indicator');
    
    // --- THIS IS THE BUG FIX ---
    // The ID is 'chat-input-area', not 'chat-input-area-styled'
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
    
    async function getAIResponse(userMessage) {
        addMessage('user', userMessage);
        conversationHistory.push({ role: 'user', content: userMessage });
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
            }, 500);
        } else {
            const quoteRegex = /"(.*?)"/s;
            const matches = text.match(quoteRegex);
            if (matches && matches[1].length > 10) {
                const statementBeforeDraft = text.split('"')[0].trim();
                addMessage('concierge', statementBeforeDraft);
                createEditableDraft(matches[1]);
            } else {
                addMessage('concierge', text, false, false);
            }
        }
    }

    function handleFinalQuestion(question) {
        addMessage('concierge', question, false, true);
        if (question.includes("main reason for your visit today?")) {
            updateProgressBar(1);
            const tier1Options = ["📱 New Phone/Device", "🔄 Plan Upgrade/Change", "🔧 Technical Support", "💳 Bill Payment", "👤 New Account Setup"];
            createMultiSelectButtons(tier1Options, 'purpose');
        } else if (question.includes("what was your service experience like?")) {
            updateProgressBar(2);
            const tier2Options = ["⭐ Helpful Staff", "💨 Fast Service", "🏬 Clean Store", "👍 Easy Process", "🤝 Problem Solved"];
            createMultiSelectButtons(tier2Options, 'experience');
        }
    }

    function createEditableDraft(reviewText) {
        updateProgressBar(3);
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

    function createMultiSelectButtons(options, step) {
        clearQuickReplies();
        options.forEach(optionText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.innerText = optionText;
            button.onclick = () => { button.classList.toggle('selected'); };
            quickRepliesContainer.appendChild(button);
        });
        const continueButton = document.createElement('button');
        continueButton.className = 'quick-reply-btn continue-btn';
        continueButton.innerText = 'Continue';
        continueButton.onclick = () => {
            const selectedButtons = quickRepliesContainer.querySelectorAll('.quick-reply-btn.selected');
            const selectedKeywords = Array.from(selectedButtons).map(btn => btn.innerText);
            let combinedMessage = selectedKeywords.length > 0 ? selectedKeywords.join(', ') : "No specific highlights";
            if (step === 'purpose') {
                combinedMessage = `Purpose of visit was: ${combinedMessage}`;
            } else {
                combinedMessage = `Service experience was: ${combinedMessage}`;
            }
            getAIResponse(combinedMessage);
        };
        quickRepliesContainer.appendChild(continueButton);
    }

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
        postButton.onclick = () => {
            const draftText = document.getElementById('review-draft-textarea').value;
            navigator.clipboard.writeText(draftText).then(() => {
                chatBody.innerHTML = '';
                if (chatInputArea) chatInputArea.style.display = 'none';
                if (progressIndicator) progressIndicator.style.display = 'none';
                chatBody.style.backgroundColor = '#fff';
                chatBody.style.flexDirection = 'column';
                const confirmationHTML = `
                    <div class="final-confirmation-screen">
                        <div class="final-title">
                            Review copied! Opening Google
                            <span class="loading-dots">
                                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                            </span>
                        </div>
                        <p class="final-subtitle">Just tap ⭐⭐⭐⭐⭐ and paste your review. Thank you!</p>
                    </div>`;
                chatBody.innerHTML = confirmationHTML;
                setTimeout(() => {
                    window.open(googleReviewUrl, '_blank');
                }, 3000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                addMessage('concierge', 'Sorry, there was an error copying the text. Please copy it manually.');
            });
        };
        quickRepliesContainer.appendChild(regenerateButton);
        quickRepliesContainer.appendChild(postButton);
    }
    
    // Helper functions that don't need to change
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
