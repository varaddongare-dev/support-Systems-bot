const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const MY_NUMBER = process.env.MY_NUMBER || '918433750502'; 

const appointmentSessions = {};

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, 
       args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', 
        ],
        
    }
});


client.on('qr', (qr) => {
    console.log('--- SCAN THE QR CODE BELOW ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log(`\nSUCCESS: Neurology Support Bot is active on ${MY_NUMBER}!`);
});

client.on('message', async (msg) => {
    const contact = msg.from;
    const userMessage = msg.body.toLowerCase();
    const originalMessage = msg.body;

    
    if (appointmentSessions[contact]) {
        const session = appointmentSessions[contact];

        if (session.step === 'awaiting_name') {
            session.name = originalMessage;
            session.step = 'awaiting_phone';
            msg.reply(`Thank you, ${session.name}. Please provide a contact phone number so our medical team can reach you:`);
        } 
        else if (session.step === 'awaiting_phone') {
            session.phone = originalMessage;
            session.step = 'awaiting_date';
            msg.reply('What date and time would you like to request for your consultation?');
        }
        else if (session.step === 'awaiting_date') {
            session.date = originalMessage;
            session.step = 'awaiting_reason';
            msg.reply('Could you briefly describe the symptoms or reason for the visit? (This helps us prepare for your care)');
        } 
        else if (session.step === 'awaiting_reason') {
            session.reason = originalMessage;
            
            const summary = `*✅ Consultation Request Received* \n\n` +
                            `👤 *Patient Name:* ${session.name}\n` +
                            `📞 *Contact Number:* ${session.phone}\n` +
                            `📅 *Requested Date:* ${session.date}\n` +
                            `📝 *Notes:* ${session.reason}\n\n` +
                            `Our neurology specialists will review your request and contact you shortly to confirm the appointment. If this is a medical emergency, please visit the nearest hospital immediately.`;
            
            msg.reply(summary);
            console.log(`NEW NEUROLOGY BOOKING: ${session.name} - ${session.phone}`);
            delete appointmentSessions[contact];
        }
        return; 
    }

    
    if (userMessage === 'hi' || userMessage === 'hello') {
        msg.reply('Welcome to Support Systems Neurology. We are here to assist you with brain health and recovery. How can we help you today?');
    } 
    else if (userMessage === 'book appointment' || userMessage === 'book an appointment') {
        appointmentSessions[contact] = { step: 'awaiting_name' };
        msg.reply('To book a consultation, please start by providing the *Patient\'s Full Name*:');
    }
    else if (userMessage === 'contact' || userMessage === 'contact us') {
        msg.reply('📍 *Neurology Center*\n📧 Email: contact.ssystems25@gmail.com\n📞 Phone: +91 97407 46668\nOur specialists are available Mon-Fri, 9 AM - 6 PM.');
    }
});
const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Neurology Bot is Online');
    res.end();
}).listen(process.env.PORT || 3000);
client.initialize();