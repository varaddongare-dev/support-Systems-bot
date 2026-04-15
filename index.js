const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs'); 
const axios = require('axios');
const path = require('path'); 
require('dotenv').config(); 

// 1. SETTINGS ⚙️
const BOT_NUMBER = '919740746668@c.us'; 
const TIMEOUT_DURATION = 10 * 60 * 1000; 
const BRAIN_URL = process.env.BRAIN_URL || 'http://localhost:8000/process'; 
const COPYRIGHT = "\n\n© Support Systems 2026 All Rights Reserved.";

// ✅ Updated Paths to be dynamic based on your new folder
const PATHS = {
    BROCHURE: path.join(__dirname, 'Brochure.pdf'),
    EXECUTIVES: path.join(__dirname, 'Psychologist Brochure.pdf'),
};

const sessions = {}; 

// 2. CLIENT SETUP
const client = new Client({
    authStrategy: new LocalAuth({ 
        clientId: "support-systems-session" 
    }),
    puppeteer: {
        headless: true, // Keep this false until you successfully link
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        ],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
    }
});

client.on('qr', (qr) => { 
    console.log('✨ Scan the QR code in the Chrome window:');
    qrcode.generate(qr, { small: true }); 
});

client.on('ready', () => { 
    console.log('\n🚀 Support Systems Bot is Online.'); 
});

// 3. CORE LOGIC
client.on('message', async (msg) => {
    const userNumber = msg.from;
    const userMessage = msg.body.trim();
    const userMessageLower = userMessage.toLowerCase();

    // Guards
    if (msg.fromMe || userNumber === BOT_NUMBER || userNumber.includes('@g.us')) return;
    if (sessions[userNumber]?.step === 'processing') return;

    console.log(`\n📩 Incoming from ${userNumber}: "${userMessage}"`);

    const websiteKeywords = ['confused', 'therapist', 'experience', 'unsure', 'medication'];
    const isWebsiteQuestion = websiteKeywords.some(word => userMessageLower.includes(word));
    const isGreeting = ['hi', 'hello', 'hey'].includes(userMessageLower);

    if (!sessions[userNumber]) {
        if (isGreeting) {
            sessions[userNumber] = { step: 'awaiting_query', greeted: true };
            const greeting = `Thank you for contacting *Support Systems*.\n\nPlease drop in your queries and we will get back to you as soon as possible. ✨${COPYRIGHT}`;
            await msg.reply(greeting);
            sessions[userNumber].timeout = setTimeout(() => { delete sessions[userNumber]; }, TIMEOUT_DURATION);
            return;
        }
        sessions[userNumber] = { step: 'processing', greeted: true };
    }

    // 4. API CALL TO PYTHON
    try {
        sessions[userNumber].step = 'processing';
        const response = await axios.post(BRAIN_URL, { message: userMessage });
        const { intent, reply } = response.data;
        const finalReply = reply + COPYRIGHT;

        if (intent === 'BROCHURE') {
            await msg.reply(finalReply);
            if (fs.existsSync(PATHS.BROCHURE)) {
                await client.sendMessage(userNumber, MessageMedia.fromFilePath(PATHS.BROCHURE));
            } else {
                console.error(`❌ File missing: ${PATHS.BROCHURE}`);
            }
        } else if (intent === 'EXECUTIVES') {
            await msg.reply(finalReply);
            if (fs.existsSync(PATHS.EXECUTIVES)) {
                await client.sendMessage(userNumber, MessageMedia.fromFilePath(PATHS.EXECUTIVES));
            } else {
                console.error(`❌ File missing: ${PATHS.EXECUTIVES}`);
            }
        } else {
            await msg.reply(finalReply);
        }
        
        sessions[userNumber].step ='ready';

    } catch (error) {
        console.error(`[ERROR] Brain Offline: ${error.message}`);
        await msg.reply(`We have noted your response. An executive will connect with you shortly. ✨${COPYRIGHT}`);
       sessions[userNumber].step = 'ready';
    }
});

client.initialize();