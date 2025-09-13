document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const stepContainer = document.getElementById('step-container');
    const progressBarFill = document.getElementById('progress-bar-fill');

    // State Management
    let conversationHistory = [];
    let currentStep = 0;
    const totalSteps = 4; // Approximate number of steps for progress bar

    // IMPORTANT: Replace with your actual Google Place ID.
    const placeId = 'ChIJk8TcKznF1EARfDUKY8D6pgw'; 
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

    // --- Core Functions ---

    // Sends conversation history to the AI backend
    async function getAIResponse(userMessage) {
        conversationHistory.push({ role: 'user', content: userMessage });
        try {
            const response = await fetch('/api/concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: conversationHistory }),
            });
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            const aiMessage = data.message;
            conversationHistory.push(aiMessage);
            return aiMessage.content;
        } catch (error) {
            console.error("Fetch Error:", error);
            return 'Sorry, I seem to be having trouble connecting. Please try again later.';
        }
    }

    // --- Step Rendering Engine ---

    // Fades out the old step, updates content, and fades in the new one
    function renderStep(prompt, optionsHtml) {
        stepContainer.classList.add('fade-out');
        
        setTimeout(() => {
            stepContainer.innerHTML = `
                <div class="prompt-text">${prompt}</div>
                <div class="options-container">${optionsHtml}</div>
            `;
            stepContainer.classList.remove('fade-out');
        }, 300); // Match this with CSS transition time
    }

    // Updates the progress bar
    function updateProgress() {
        currentStep++;
        const progress = (currentStep / totalSteps) * 100;
        progressBarFill.style.width = `${progress > 100 ? 100 : progress}%`;
    }

    // --- Specific Step Renderers ---

    // Step 1: Initial Pulse Check
    function renderPulseCheckStep(prompt) {
        updateProgress();
        const options = ["🙂 It was great!", "😐 It was okay.", "🙁 It wasn't good."];
        const optionsHtml = options.map(opt => 
            `<button class="survey-button" onclick="handlePulseCheck('${opt}')">${opt}</button>`
        ).join('');
        renderStep(prompt, optionsHtml);
    }

    // Step 2: Multi-select keywords
    function renderMultiSelectStep(prompt) {
        updateProgress();
        const keywords = ["✨ Friendly Staff", "🦷 Gentle Hygienist", "👍 Dr. Evans' Care", "🏢 Clean Office", "🕒 On-Time Appointment", "💬 Clear Explanations", "Other"];
        const optionsHtml = keywords.map(kw => 
            `<button class="survey-button" data-keyword="${kw}" onclick="toggleKeyword(this)">${kw}</button>`
        ).join('') + `<button class="action-button" onclick="handleMultiSelect()">Continue</button>`;
        renderStep(prompt, optionsHtml);
    }
    
    // Step 3: Unique Spark Text Input
    async function renderUniqueSparkStep(prompt, keywords) {
        updateProgress();
        const aiResponse = await getAIResponse(keywords);
        const optionsHtml = `
            <input type="text" id="unique-spark-input" class="survey-text-input" placeholder="Type your response here...">
            <button class="action-button" onclick="handleUniqueSpark()">Continue</button>
        `;
        renderStep(aiResponse, optionsHtml);
    }

    // Step 4: Final AI Draft and Actions
    async function renderFinalDraftStep(spark) {
        updateProgress();
        renderStep("Just a moment, I'm drafting your review... ✨", ''); // Loading state
        const aiResponse = await getAIResponse(spark);
        
        const quoteRegex = /"(.*?)"/;
        const matches = aiResponse.match(quoteRegex);
        if (matches) {
            const reviewText = matches[1];
            const optionsHtml = `
                <textarea id="review-draft-textarea" class="survey-textarea">${reviewText}</textarea>
                <div style="display: flex; justify-content: flex-end; width: 100%; gap: 10px;">
                    <button class="survey-button" onclick="handleRegenerateDraft()">🔄 Try another version</button>
                    <button class="action-button" onclick="handlePostToGoogle()">✅ Post to Google</button>
                </div>
            `;
            renderStep("Here's a draft based on your feedback. Feel free to edit it!", optionsHtml);
        } else {
            renderStep("I had a little trouble creating a draft. Please try again.", '');
        }
    }
    
    // --- Event Handlers (called from onclick in HTML) ---
    
    window.handlePulseCheck = async (choice) => {
        const aiResponse = await getAIResponse(choice);
        if (choice.includes("great")) {
            renderMultiSelectStep(aiResponse);
        } else {
            // Handle neutral/negative paths here
            renderStep("Thank you for your feedback. We'll use it to improve.", '');
        }
    };

    window.toggleKeyword = (button) => {
        button.classList.toggle('selected');
    };

    window.handleMultiSelect = () => {
        const selectedButtons = document.querySelectorAll('.survey-button.selected');
        const keywords = Array.from(selectedButtons).map(btn => btn.dataset.keyword).join(', ');
        renderUniqueSparkStep(null, keywords);
    };

    window.handleUniqueSpark = () => {
        const spark = document.getElementById('unique-spark-input').value;
        renderFinalDraftStep(spark);
    };

    window.handleRegenerateDraft = () => {
        renderFinalDraftStep("That wasn't quite right, please try another version.");
    };
    
    window.handlePostToGoogle = () => {
        const draftText = document.getElementById('review-draft-textarea').value;
        navigator.clipboard.writeText(draftText).then(() => {
            window.open(googleReviewUrl, '_blank');
            renderStep("Thank you! I've copied the text and opened the Google review page for you.", '');
        });
    };

    // --- Initial Load ---
    conversationHistory.push({ role: 'model', content: "Hi! I'm Alex, your digital concierge. How was your visit today?" });
    renderPulseCheckStep(conversationHistory[0].content);
});
