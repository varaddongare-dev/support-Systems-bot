Support Systems Bot 🤖
An intelligent WhatsApp automation tool built with Node.js and Python, integrated with the Google Gemini API. This bot is designed to handle automated queries, provide AI-driven responses, and streamline support workflows.

🚀 Features
AI Conversations: Real-time intelligent chat powered by Gemini.

WhatsApp Integration: Seamless messaging via whatsapp-web.js.

Hybrid Logic: Core automation in Node.js with specialized Python scripts.

Secure Config: Environment-based API key management using .env.

🛠️ Tech Stack
Languages: JavaScript (Node.js), Python 3.x

AI Model: Google Gemini API

Key Libraries: whatsapp-web.js, qrcode-terminal, dotenv, google-generativeai

📋 Prerequisites
Node.js (v16+)

Python (v3.10+)

Gemini API Key from Google AI Studio

⚙️ Installation & Setup
Clone the repository:

Bash
git clone https://github.com/varaddongare-dev/support-systems-bot.git
cd support-systems-bot
Install Node.js Dependencies:

Bash
npm install
Install Python Dependencies:

Bash
pip install -r requirements.txt
Configure Environment Variables:
Create a .env file in the root directory:

Code snippet
GEMINI_API_KEY=your_actual_api_key_here
Run the Bot:

Bash
node index.js
🚧 Roadmap
[ ] Refine Gemini prompt engineering for better support accuracy.

[ ] Complete email notification integration.

[ ] Add support for image-to-text processing (Multimodal).

Developed by Varad