const fetch = require('node-fetch');

// --- NEW: Your Curated Review Examples ---
// IMPORTANT: Replace the text inside the backticks ` ` with your own 5-7 curated reviews.
// Keep the formatting with a hyphen "-" before each review.
const reviewExamples = `
1. "I get my cleanings done here and got a filling also. Always have such a great experience. Location is central, the facility is very nice and clean. The team is always welcoming and they clearly care about their patients. I definitely recommend!"
2. "Had a great experience. The facility is calm and pleasant. The staff are welcoming and professional. Treatment wise and with contacting the insurance. Went much better than I expected in every sense. Consider me a regular from now on"
3. "Everyone is very professional and friendly. Dentists and hygienists explain everything that’s happening and their causes. Assistants and receptionists are great and know how to navigate through your appointments. The clinic is super nice and clean. I moved to other side of the city and yet I keep coming back for appointments!"
4. "Alex has been my dental hygienist for many years now and she's been friendly, approachable, and professional every time I come in for a cleaning. I've got no complaints and only good things to say about the level of service I've received from everyone working here. The space itself always looks clean, they've got big TVs for when you're sitting in the chair (even affixed to the ceilings). Someone there decorated their window with a Raptors plush so whoever that is get bonus points from me."
5. "I would like to preface the following by stating that this is an honest, heartfelt and sincere review.I have walked passed 2000 Yonge Dental 100s of times as I only live 15 minutes away from the office. I always thought the office was beautiful and taken aback at how immaculate everything was at all times.
My teeth used to be my crowning glory until 2 accidents knocked out my 2 teeth on top and then 2 teeth on the bottom. My teeth started to shift so severely due to the missing teeth. As well, due to several rounds of chemotherapy, a multitude of medications and unfortunately 30 years of anorexia my oral health was in extremely bad shape. I had an upper and bottom plate made quickly by another dentist to replace my 4 missing teeth. I had completely lost all self confidence and I was in a lot of pain.
One day I decided to walk into 2000 Yonge Dental to inquire about their services. The receptionist is an absolute delight and I made an appointment for a consultation. This is when I met the outstanding Dr. Cott.
From the very first consultation up to and including the extensive work I had done, Dr. Cott explained in detail every procedure. While the work was being done Dr. Cott described
comprehensively everything she was about to do . Dr. Cott is a brilliant dentist, caring, compassionate, highly skilled and a true artist as is definitely apparent by the exquisite dentures she designed.
The oral hygienists are extremely knowledgeable and highly adept as well as being delightfully sweet, caring and very compassionate.
Dr. Cott literally transformed my oral hygiene, my smile and my life by giving me back my self-confidence, self worth and my ability to meet the world again with zeal and excitement. I feel a great sense of pride again greeting people with a beautiful, welcoming and vibrant smile. All the work completed so professionally and with great expertise Dr. Cott did has enabled me to start living my best life again.
I am truly blessed and deeply grateful to have had the extensive work, fabulous experience and gorgeous perfect fitting dentures I received by Dr. Cott and everyone at 2000 Yonge Dental.
I highly and wholeheartedly recommend 2000 Yonge Dental for any and all your dental needs. They truly surpass any other dentist I have ever had work done which is an extensive list.
Thank you Dr. Cott et al for giving me back my life. I am forever grateful."
`;

// --- THE NEW SYSTEM PROMPT ---
const systemPrompt = `You are "Alex," a friendly and professional digital concierge for "Orchard Dental Care." You have two modes: Analysis Mode and Conversation Mode.

**Analysis Mode:**
If the user's message is "INITIATE_ANALYSIS", your ONLY job is to analyze the following 5 real customer reviews. Extract the 6 most common positive themes. Your response MUST be a single line of text containing exactly 6 themes, separated by a pipe character "|". Add a relevant emoji to the start of each theme.
Example Response: ✨ Friendly Staff|🏢 Clean & Modern Office|🕒 On-Time Appointment|🦷 Gentle Cleaning|💬 Clear Explanations|😌 Felt Comfortable

**Real Customer Reviews for Analysis:**
${curatedReviews}

**Conversation Mode (Default):**
This is your normal mode. Your goal is to be an "active listener" and guide the user through a feedback process. Follow the conversational flow and formatting rules precisely.
- **CRITICAL FORMATTING RULE:** Separate statements from questions with a pipe character "|".
- **FLOW:** Start with the opening, then follow the positive or negative path based on user input. Acknowledge their selected keywords (pillars), ask for a specific detail, and then offer to draft a review.`;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { messages } = JSON.parse(event.body);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, },
      body: JSON.stringify({
        model: 'gpt-4-turbo', // A powerful model is needed for the analysis task
        messages: [ { role: 'system', content: systemPrompt }, ...messages, ],
        temperature: 0.5, // Lower temperature for more consistent analysis
      }),
    });
    if (!response.ok) { const errorData = await response.json(); console.error("OpenAI API Error:", errorData); throw new Error("OpenAI API request failed."); }
    const data = await response.json();
    const aiMessage = data.choices[0].message;
    return { statusCode: 200, body: JSON.stringify({ message: aiMessage }), };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "AI service is currently unavailable." }), };
  }
};
