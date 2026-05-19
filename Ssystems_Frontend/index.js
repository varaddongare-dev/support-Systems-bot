const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const path = require('path');

// Load env from an absolute path so it works regardless of working directory
require('dotenv').config({ path: path.resolve('C:/SupportBot/.env') });

// --- 1. SETTINGS ---
const BRAIN_URL = 'http://127.0.0.1:8000/log-message';
const BASE_URL  = 'http://127.0.0.1:8000/';
const sessions  = {};

// Simple ready flag — set to true only after WhatsApp confirms the session is live.
// The message listener ignores ALL messages until this is true (blocks history replay).
let isBotReady = false;

// --- 2. RETRY QUEUE ---
const pendingQueue = [];

async function sendToBrain(payload) {
    try {
        await axios.post(BRAIN_URL, payload, { timeout: 3000 });
    } catch {
        console.warn('[WARN] Backend offline — queuing message for retry');
        pendingQueue.push(payload);
    }
}

setInterval(async () => {
    while (pendingQueue.length) {
        const item = pendingQueue.shift();
        try {
            await axios.post(BRAIN_URL, item, { timeout: 3000 });
            console.log(`[INFO] Flushed queued message from ${item.sender}`);
        } catch {
            pendingQueue.unshift(item);
            break;
        }
    }
}, 30_000);

// --- 3. CLIENT INITIALIZATION ---
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'support-systems-session' }),
    authTimeoutMs: 0,           // 0 = no timeout, allows slow/flaky connections
    qrMaxRetries: 5,
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-js/main/dist/wppconnect-wa.js'
    },
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// --- 4. CONNECTION EVENTS ---
client.on('qr', (qr) => {
    console.log('[INFO] Scan the QR code below:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    isBotReady = true;
    console.log('\n[FINAL] Bot is fully authenticated and ready. Listening for new messages...');
});

// --- 5. EXACT THERAPY TRIGGERS (from supportsystems.co.in) ---
// Keys are normalized (lowercased, no punctuation) text sent via wa.me links on the website.
// ONLY these messages get a reply. Everything else: total silence.
const THERAPY_RESPONSES = {
    'felt confused about which therapist to choose or trust':
        "Trust me, we understand that it can be overwhelming and difficult. So, let us take care of it for you. Our team will get in touch with you shortly. We're here for you.",
    'tried therapy but it didnt feel right':
        "We're sorry you had to go through that. This happens more often than you think, that's why we're here to get you the right person for you. Our team will get in touch with you shortly. We're here for you.",
    'not sure if you need therapy medication or both':
        "It's a fair confusion, let's figure it out together. Our team will get in touch with you shortly. We're here for you.",
    'felt the need to talk to somebody about your feelings judgment-free':
        "We're glad you reached out! Our team will get in touch with you shortly. We're here for you.",
    'felt the need to understand yourself better':
        "We're glad you reached out! Our team will get in touch with you shortly. We're here for you.",
    'or just anything else':
        "We're glad you reached out! Our team will get in touch with you shortly. We're here for you."
};

function normalizeMsg(text) {
    return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// --- 6. CORE MESSAGE LOGIC (strict match only) ---
client.on('message', async (msg) => {

    // Gate 1: Ignore everything until the session is fully live + never self-reply
    if (!isBotReady || msg.fromMe) return;

    // Gate 1.5: Ignore historical messages (older than 60 seconds)
    const now = Math.floor(Date.now() / 1000);
    if (msg.timestamp < now - 60) {
        console.log(`[SKIP] Historical message ignored from ${msg.from}`);
        return;
    }

    // Confirm the bot is seeing the message
    console.log('New Message Detected:', msg.body);

    const userNumber  = msg.from;
    const userMessage = (msg.body || '').trim();
    const cleanMsg    = normalizeMsg(userMessage);

    // Log every incoming message so you can see what the bot is receiving
    console.log(`[MSG] New message received: "${userMessage}" from ${userNumber}`);

    // Gate 2: Ignore status broadcasts, group chats, empty bodies
    if (!userMessage || userNumber === 'status@broadcast' || userNumber.includes('@g.us')) return;

    // Gate 3: Skip if already processing a reply for this user
    if (sessions[userNumber]?.step === 'processing') return;

    // --- Strict match against therapy triggers ---
    const reply = THERAPY_RESPONSES[cleanMsg];

    // No match → total silence (no fallback, no AI)
    if (!reply) {
        console.log(`[SKIP] No match for: "${userMessage}"`);
        
        // Log the unmatched message to the backend
        sendToBrain({
            sender: userNumber,
            issue: userMessage,
            ai_response: "", // No AI response
            resolved_with_ai: false
        });
        
        return;
    }

    // Match found → lock session, send reply
    sessions[userNumber] = { step: 'processing' };

    try {
        await client.sendMessage(userNumber, reply);
        console.log(`[SENT] Replied to ${userNumber}`);
    } catch (err) {
        console.error(`[ERROR] Reply failed: ${err.message}`);
    } finally {
        sessions[userNumber].step = 'ready';
    }

    // Non-blocking POST to FastAPI — resolved_with_ai: false (hardcoded response)
    sendToBrain({
        sender: userNumber,
        issue: userMessage,
        ai_response: reply,
        resolved_with_ai: false
    });
});

// --- 7. STARTUP SEQUENCE ---
process.on('SIGINT', async () => {
    console.log('\n[INFO] Shutting down client cleanly...');
    try {
        await client.destroy();
    } catch (e) {}
    process.exit(0);
});

async function waitForBrain(retries = 10, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            await axios.get(BASE_URL, { timeout: 2000 });
            console.log('[INFO] Brain is online. Starting WhatsApp Client...');
            return;
        } catch {
            console.log(`[INFO] Waiting for Python backend... (${i + 1}/${retries})`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    console.error('[ERROR] Python backend did not start in time.');
    process.exit(1);
}

async function startBot() {
    await waitForBrain();
    client.initialize();
}

startBot();
