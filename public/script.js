document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const inputArea = document.getElementById('input-area');

    let conversationHistory = [];
    const placeId = 'Your_Google_Place_ID_Here'; // <-- PASTE YOUR PLACE ID HERE
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    
    // Auto-resizing textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });

    // Add a message to the UI
    function addMessage(sender, text) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        wrapper.innerHTML = `<div class="bubble">${text}</div>`;
        chatBody.prepend(wrapper);
    }

    async function sendMessage(content) {
        addMessage('user', content);
        conversationHistory.push({ role: 'user', content });
        clearQuickRepliesAndInput();
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
        wrapper.innerHTML = `<div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
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
         if (text.toLowerCase().includes("how your visit was today?")) {
            addMessage('concierge', text);
            createQuickReplies([
                { text: "🙂 It was great!", value: "It was great!" },
                { text: "😐 It was okay.", value: "It was okay." },
                { text: "🙁 It wasn't good.", value: "It wasn't good." }
            ]);
        } else if (text.includes("to help us recognize")) {
            addMessage('concierge', text);
            // In this design, the user types the feedback, so we show the input field.
            inputArea.style.display = 'flex';
        } else if (text.toLowerCase().includes("would you like me to draft")) {
             addMessage('concierge', text);
             createQuickReplies([
                { text: "✨ Yes, draft it for me!", value: "Yes, draft it for me!", primary: true },
                { text: "No, thanks", value: "No, thanks" }
            ]);
        } else {
            addMessage('concierge', text);
        }
    }

    function createQuickReplies(replies) {
        quickRepliesContainer.innerHTML = '';
        inputArea.style.display = 'none'; // Hide text input by default when buttons are shown
        
        replies.forEach(reply => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            if (reply.primary) {
                button.classList.add('primary');
            }
            button.innerHTML = reply.text;
            button.onclick = () => { sendMessage(reply.value); };
            quickRepliesContainer.appendChild(button);
        });
    }
    
    function clearQuickRepliesAndInput() {
        quickRepliesContainer.innerHTML = '';
        chatInput.value = '';
        chatInput.style.height = 'auto';
        inputArea.style.display = 'flex';
    }

    sendButton.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (text) {
            sendMessage(text);
        }
    });
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });
    
    // Initial greeting
    function startConversation() {
        showTypingIndicator();
        setTimeout(() => {
            const initialGreeting = "Hi! Welcome to Orchard Dental Care. I'm your digital concierge. To start, could you quickly tell me how your visit was today?";
            processAIResponse(initialGreeting);
        }, 1500);
    }

    startConversation();
});
