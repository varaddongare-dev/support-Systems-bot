const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs'); 
const axios = require('axios');
const path = require('path'); 
require('dotenv').config(); 

// 1. SETTINGS ⚙️
const TIMEOUT_DURATION = 10 * 60 * 1000; 
const BRAIN_URL = process.env.BRAIN_URL || 'http://localhost:8000/process'; 
const COPYRIGHT = "\n\n© Support Systems 2026 All Rights Reserved.";

const PATHS = {
    BROCHURE: path.join(__dirname, 'Brochure.pdf'),
    EXECUTIVES: path.join(__dirname, 'Psychologist Brochure.pdf'),
};

const sessions = {}; 

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.CHROME_PATH || undefined 
    }
});

// --- CONNECTION ---
client.on('qr', (qr) => { qrcode.generate(qr, { small: true }); });
client.on('ready', () => { console.log('🚀 Support Systems Bot is Online and Ready.'); });

// --- CORE LOGIC ---
client.on('message', async (msg) => {
    const userNumber = msg.from;
    const userMessage = msg.body.trim();
    const userMessageLower = userMessage.toLowerCase();

    console.log(`\n📩 Incoming from ${userNumber}: "${userMessage}"`);

    if (userNumber.includes('@g.us')) return; 

    if (sessions[userNumber] && sessions[userNumber].step === 'handled') {
        console.log(`[GUARD] Query already handled for ${userNumber}.`);
        return;
    }

    // --- WEBSITE BUTTON DETECTION ---
    // This checks if the message contains keywords from your "Tell us more" website buttons
    const websiteKeywords = ['confused', 'therapist', 'experience', 'unsure', 'medication'];
    const isWebsiteQuestion = websiteKeywords.some(word => userMessageLower.includes(word));
    const isGreeting = ['hi', 'hello', 'hey'].includes(userMessageLower);

    // 2. GREETING LOGIC
    // If it's a first message and NOT a website button, send the standard greeting
    if (!sessions[userNumber] && isGreeting) {
        console.log(`[FLOW] Sending Standard Greeting...`);
        sessions[userNumber] = { step: 'awaiting_query', greeted: true };
        
        sessions[userNumber].timeout = setTimeout(() => { 
            delete sessions[userNumber]; 
        }, TIMEOUT_DURATION);

        const greeting = `Thank you for contacting *Support Systems*.\n\nPlease drop in your queries and we will get back to you soon as possible.\n\nWe look forward to speaking with you!\n\nBest Regards\n\nSupport Systems. ✨${COPYRIGHT}`;
        await msg.reply(greeting);
        return;
    }

    // If it's a website question and a new session, initialize the session but SKIP the greeting
    if (!sessions[userNumber] && isWebsiteQuestion) {
        console.log(`[FLOW] Website Redirect detected. Skipping greeting for direct answer.`);
        sessions[userNumber] = { step: 'awaiting_query', greeted: true };
    }

    // 3. PYTHON BRAIN CALL
    try {
        console.log(`[API] Querying Brain at ${BRAIN_URL}...`);
        const response = await axios.post(BRAIN_URL, { message: userMessage });
        const { intent, reply } = response.data;

        const finalReply = reply + COPYRIGHT;

        if (intent === 'BROCHURE') {
            await msg.reply(finalReply);
            if (fs.existsSync(PATHS.BROCHURE)) {
                const media = MessageMedia.fromFilePath(PATHS.BROCHURE);
                await client.sendMessage(userNumber, media);
            }
        } else if (intent === 'EXECUTIVES') {
            await msg.reply(finalReply);
            if (fs.existsSync(PATHS.EXECUTIVES)) {
                const media = MessageMedia.fromFilePath(PATHS.EXECUTIVES);
                await client.sendMessage(userNumber, media);
            }
        } else {
            await msg.reply(finalReply);
            // Mark handled so the bot doesn't keep responding to "Thank you" etc.
            if (sessions[userNumber]) {
                sessions[userNumber].step = 'handled'; 
            }
        }

    } catch (error) {
        console.error(`[ERROR] Brain Offline: ${error.message}`);
        const fallback = `We have noted your response.\n\nWe will connect you to the right person at the earliest.\n\nHave a great day! ✨${COPYRIGHT}`;
        await msg.reply(fallback);
        
        if (!sessions[userNumber]) {
            sessions[userNumber] = { greeted: true };
        }
        sessions[userNumber].step = 'handled';
    }
});

client.initialize();