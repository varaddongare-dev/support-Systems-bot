# Support Systems Bot

This is a hybrid AI automation tool designed to live on WhatsApp. Instead of just sending rigid, pre-programmed replies, it uses a dual-brain architecture to give users genuinely helpful, AI-driven conversations.

Whether it is fetching a brochure or answering a complex query, this bot handles the heavy lifting so you do not have to.

Why this bot?
Most bots are either too simple (keyword only) or too slow (pure AI). This project strikes a balance:

Real Conversations: Powered by Gemini 2.0 Flash for fast, snappy, and context-aware replies.

Smart Triggers: It knows when to be an AI and when to just hand over a PDF brochure or an executive profile.

The Best of Both Worlds: We use Node.js to handle the WhatsApp connection and Python (FastAPI) to do the heavy lifting with AI processing.

How it Works
The bot operates like a team of two:

The Messenger (Node.js): Stays connected to WhatsApp, listens for messages, and handles files and QR codes.

The Brain (Python): Receives the message, thinks about it using Gemini, and tells the Messenger exactly what to say back.

What is under the hood?
Logic: Node.js and Python 3.10+

AI: Google Gemini 2.0 Flash API

Connectivity: whatsapp-web.js and FastAPI

Tools: qrcode-terminal for logins and dotenv for environment management.

## Getting Started

1. Grab the code
Bash
git clone <https://github.com/varaddongare-dev/support-systems-bot.git>
cd support-systems-bot
2. Set up the Messenger (Node)
Bash
npm install
3. Set up the Brain (Python)
Bash
pip install -r requirements.txt
4. Configuration
Create a .env file in the root folder and add your API key:

Code snippet
GEMINI_API_KEY=your_actual_api_key_here
BRAIN_URL=<http://localhost:8000/process>
Running the Bot
You will need to keep two terminals open simultaneously:

Terminal 1 (The Brain):

Bash
python main.py
Terminal 2 (The Messenger):

Bash
node index.js
Once both are running, scan the QR code that appears in your terminal with your WhatsApp linked devices to begin.

Roadmap
Building is never finished. Here is what is currently in development:

[ ] Empathy Tuning: Fine-tuning Gemini to handle sensitive support queries with more care.

[ ] Long-term Memory: Adding a database (MongoDB or Postgres) so the bot remembers user context over time.

[ ] Document Intelligence: Allowing the bot to analyze PDFs to answer specific questions.

[ ] Email Alerts: Automatically notifying a human when an issue requires manual intervention.

Developed by Varad Dongare
