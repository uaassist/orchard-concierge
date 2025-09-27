document.addEventListener('DOMContentLoaded', () => {
    // --- Element selectors for all views ---
    const contentArea = document.getElementById('content-area');
    const welcomeScreen = document.getElementById('welcome-screen');
    const choiceScreen = document.getElementById('choice-screen');
    const chatView = document.getElementById('chat-view');
    const chatBody = document.getElementById('chat-body');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const progressIndicator = document.getElementById('progress-indicator');

    // --- Single Event Listener using Event Delegation ---
    contentArea.addEventListener('click', (event) => {
        const button = event.target.closest('button');
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

    // --- Function to update the progress bar ---
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

    // --- Function to transition to the chat view ---
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

    function addMessage(sender, text, isHtml = false, isQuestion = false) {
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
        if (isQuestion) { bubble.classList.add('question-bubble'); }
        if (isHtml) { bubble.innerHTML = text; } else { bubble.innerText = text; }
        wrapper.appendChild(bubble);
        chatBody.prepend(wrapper);
    }

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
        addMessage('concierge', 'You can edit the text if you like. When ready, just tap below.', false, true);
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
            } else if (step === 'experience') {
                combinedMessage = `Service experience was: ${combinedMessage}`;
            }
            getAIResponse(combinedMessage);
        };
        quickRepliesContainer.appendChild(continueButton);
    }

    // --- THIS FUNCTION CONTAINS THE FINAL, SUPERIOR LOGIC ---
    function createPostButtons() {
        clearQuickReplies();
        
        const postButton = document.createElement('button');
        // Use a more descriptive class and make it look like a title/subtitle button
        postButton.className = 'quick-reply-btn primary-action choice-button'; 
        postButton.innerHTML = `
            <div class="button-main-text">✅ Open Google to post</div>
            <div class="button-sub-text">Your review is copied—just paste & rate</div>
        `;
        
        postButton.onclick = () => {
            const draftText = document.getElementById('review-draft-textarea').value;
            
            // Re-ordered for reliability: open the window first!
            // This is a direct result of the user's click and will not be blocked.
            window.open(googleReviewUrl, '_blank');

            // Then, perform the copy action.
            navigator.clipboard.writeText(draftText);

            // Clean up the UI in the original tab.
            clearQuickReplies();
            addMessage('concierge', "Thank you for your feedback!");
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
    }
});
