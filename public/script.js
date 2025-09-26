document.addEventListener('DOMContentLoaded', () => {
    // --- Element selectors for all three views ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const choiceScreen = document.getElementById('choice-screen'); // New screen
    const chatView = document.getElementById('chat-view');
    
    const chatBody = document.getElementById('chat-body');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    
    // --- Event listeners for the initial choice buttons ---
    const initialChoiceButtons = document.querySelectorAll('.choice-button');
    initialChoiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userChoice = button.innerText.trim();
            
            if (userChoice === '🙂 It was great!') {
                // If positive, show the new choice screen instead of starting the chat
                welcomeScreen.style.display = 'none';
                choiceScreen.classList.remove('hidden');
            } else {
                // For "okay" or "bad" feedback, go directly to the service recovery chat
                startConversation(userChoice);
            }
        });
    });

    // --- NEW: Event listeners for the two CTA buttons on the choice screen ---
    const aiDraftBtn = document.getElementById('ai-draft-btn');
    const manualReviewBtn = document.getElementById('manual-review-btn');

    aiDraftBtn.addEventListener('click', () => {
        // Hide the choice screen and start the AI conversation
        choiceScreen.style.display = 'none';
        startConversation("It was great!"); // We still need to pass the original positive intent to the AI
    });

    manualReviewBtn.addEventListener('click', () => {
        // Open the Google Review page directly
        window.open(googleReviewUrl, '_blank');
        // Provide confirmation to the user
        choiceScreen.innerHTML = `<h1 class="main-title">Thank you!</h1><p class="subtitle">We've opened the Google review page for you in a new tab.</p>`;
    });

    // --- Function to transition to the chat view ---
    function startConversation(firstMessage) {
        welcomeScreen.style.display = 'none'; // Ensure welcome screen is hidden
        choiceScreen.style.display = 'none';  // Ensure choice screen is hidden
        chatView.classList.remove('hidden');   // Show the chat view
        
        // Start the AI conversation with the user's first choice
        getAIResponse(firstMessage);
    }

    let conversationHistory = [];
    const placeId = 'Your_Google_Place_ID_Here'; // <-- PASTE YOUR PLACE ID HERE
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const avatarUrl = 'https://ucarecdn.com/c679e989-5032-408b-ae8a-83c7d204c67d/Vodafonebot.webp';
    let selectedKeywords = [];

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
    
        const statementAndRepliesRegex = /^(.*?)\|([^|]+(?:\|[^|]+)*)$/;
        const match = text.match(statementAndRepliesRegex);
    
        if (match) {
            const statement = match[1].trim();
            const replies = match[2].split('|').map(item => item.trim());
            
            if (statement) {
                 addMessage('concierge', statement, false, false);
            }
            
            const isSurveyQuestion = replies[0].includes("main reason for your visit") || replies[0].includes("service experience like");
    
            setTimeout(() => {
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    if (isSurveyQuestion) {
                        const questionText = replies.shift();
                        handleFinalQuestion(questionText); 
                    } else {
                        createQuickReplies(replies);
                    }
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
            const tier1Options = ["📱 New Phone/Device", "🔄 Plan Upgrade/Change", "🔧 Technical Support", "💳 Bill Payment", "👤 New Account Setup"];
            createMultiSelectButtons(tier1Options, 'purpose');
        } else if (question.includes("what was your service experience like?")) {
            const tier2Options = ["⭐ Helpful Staff", "💨 Fast Service", "🏬 Clean Store", "👍 Easy Process", "🤝 Problem Solved"];
            createMultiSelectButtons(tier2Options, 'experience');
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

    function createQuickReplies(replies) {
        clearQuickReplies();
        quickRepliesContainer.classList.remove('column-layout');
        replies.forEach(replyText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            if (replyText.toLowerCase().includes("yes")) {
                button.classList.add('primary-action');
            }
            button.innerText = replyText;
            button.onclick = () => { getAIResponse(replyText); };
            quickRepliesContainer.appendChild(button);
        });
    }

    function createMultiSelectButtons(options, step) {
        clearQuickReplies();
        quickRepliesContainer.classList.remove('column-layout');
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

    function createPostButtons() {
        clearQuickReplies();
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
                addMessage('concierge', "Great! Your review has been copied. I'll open Google for you now. Just tap the 5th star and paste your review. Thank you!");
                setTimeout(() => {
                    window.open(googleReviewUrl, '_blank');
                }, 1500);
            });
            clearQuickReplies();
        };
        quickRepliesContainer.appendChild(regenerateButton);
        quickRepliesContainer.appendChild(postButton);
    }

    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
    }
});
