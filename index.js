const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs'); 
const nodemailer = require('nodemailer'); 
const express = require('express'); 

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => { res.send('Bot is Online! 🚀'); });
app.listen(PORT, () => { console.log(`Server on port ${PORT}`); });

// 1. SETTINGS & PATHS
const MY_NUMBER = '919740746668'; 
// Updated with your specific Windows path
const BROCHURE_PATH = 'C:\\Whatsapp Bot\\my-whatsapp-bot\\Clients Brochure.pdf'; 
const LOG_FILE = 'daily_leads.csv';
const sessions = {}; 

// 2. EMAIL CONFIGURATION
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'contact.ssystems25@gmail.com',
        pass: 'YOUR_16_CHARACTER_APP_PASSWORD' 
    }
});
//check demo

// 3. LOGGING & EMAIL FUNCTION
const processLead = async (userNumber, userEmail, type, details, sendBrochure = false) => {
    const timestamp = new Date().toLocaleString().replace(/,/g, '');
    if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, 'Date,User Number,Email,Type,Details\n');
    }
    const logEntry = `${timestamp},${userNumber},${userEmail},${type},${details.replace(/,/g, ';')}\n`;
    fs.appendFile(LOG_FILE, logEntry, (err) => { if (err) console.error(err); });

    const mailOptions = {
        from: '"Support Systems" <contact.ssystems25@gmail.com>',
        to: userEmail,
        subject: sendBrochure ? 'Your Requested Brochure - Support Systems' : 'Request Confirmation - Support Systems',
        text: sendBrochure 
            ? `Hello,\n\nPlease find the Support Systems brochure attached as requested.\n\nBest regards,\nSupport Systems Team`
            : `Hello,\n\nWe have received your request regarding ${type}. Our team will contact you shortly.\n\nBest regards,\nSupport Systems Team`,
        attachments: fs.existsSync(BROCHURE_PATH) ? [{ filename: 'Support_Systems_Brochure.pdf', path: BROCHURE_PATH }] : []
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to: ${userEmail}`);
    } catch (error) {
        console.log('❌ Email error:', error.message);
    }
};

// 4. WHATSAPP CLIENT
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => { qrcode.generate(qr, { small: true }); });
client.on('ready', () => { console.log('\nSUCCESS: Support Systems Smart Bot Active!'); });

// 5. CORE BOT LOGIC
client.on('message', async (msg) => {
    const userNumber = msg.from;
    const userMessage = msg.body.trim().toLowerCase();
    
    if (msg.fromMe) { delete sessions[msg.to]; return; }

    if (!sessions[userNumber]) {
        if (['hi', 'hello', 'menu'].includes(userMessage)) {
            sessions[userNumber] = { step: 'initial' };
            msg.reply('Hi! 👋 Welcome to *Support Systems*.\n\nAre you:\n1️⃣ Existing Client\n2️⃣ New Client\n\nReply with 1 or 2');
        }
        return;
    }

    const session = sessions[userNumber];

    // IMAGE/MEDIA HANDLER
    if (msg.hasMedia) {
        msg.reply('✅ *Attachment Received!* Logged for our team.');
        return;
    }

    if (session.step === 'initial') {
        if (userMessage === '1') { session.type = 'EXISTING'; session.step = 'collect_email'; msg.reply('Welcome back! Please enter your *Email ID*:'); }
        else if (userMessage === '2') { session.type = 'NEW'; session.step = 'collect_email'; msg.reply('Welcome! Please enter your *Email ID*:'); }
    }

    else if (session.step === 'collect_email') {
        if (userMessage.includes('@')) {
            session.email = userMessage;
            session.step = 'menu_selection';
            msg.reply('Thank you! How can we help?\n\n1️⃣ Book Session\n2️⃣ Get Brochure 📄\n3️⃣ Billing Support\n4️⃣ Request Call-back\n5️⃣ Other');
        } else {
            msg.reply('Please enter a valid email.');
        }
    }

    else if (session.step === 'menu_selection') {
        if (userMessage === '2') {
            // OPTION 2: SPECIFIC BROCHURE REQUIREMENT
            if (fs.existsSync(BROCHURE_PATH)) {
                const media = MessageMedia.fromFilePath(BROCHURE_PATH);
                await client.sendMessage(userNumber, media, { caption: 'Here is our brochure! 📄' });
                await processLead(userNumber, session.email, 'BROCHURE_ONLY', 'User requested brochure via menu', true);
                msg.reply(`✅ *Brochure Sent!* I have also emailed a copy to ${session.email}. Do you have any other questions? (Reply below or wait for an executive)`);
                session.step = 'collect_details'; // Move to details if they want to ask more
            } else {
                msg.reply('Our brochure is being updated. We will email it to you manually very soon!');
                delete sessions[userNumber];
            }
        } else if (['1', '3', '4', '5'].includes(userMessage)) {
            session.step = 'collect_details';
            msg.reply('Please share your *Full Name* and details of your request:');
        }
    }

    else if (session.step === 'collect_details') {
        await processLead(userNumber, session.email, session.type, msg.body, false);
        await client.sendMessage(MY_NUMBER, `📢 *NEW LEAD*\nUser: ${userNumber}\nEmail: ${session.email}\nDetails: ${msg.body}`);
        msg.reply(`✅ *Recorded!* Confirmation sent to ${session.email}. Our team will reach out within 2 hours.`);
        delete sessions[userNumber];
    }
});

client.initialize();