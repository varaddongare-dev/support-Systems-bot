# Support Systems Bot 🤖

An intelligent WhatsApp automation tool built with a **Hybrid Architecture** (Node.js + Python), integrated with the Google Gemini 2.0 API. This bot is designed to handle automated queries, provide AI-driven responses, and streamline support workflows.

## 🚀 Features

* **AI Conversations:** Real-time intelligent chat powered by Gemini 2.0 Flash.
* **WhatsApp Integration:** Seamless messaging via `whatsapp-web.js`.
* **Hybrid Logic:** Core automation and session management in Node.js with specialized AI processing in Python (FastAPI).
* **Smart Fallbacks:** Priority keyword detection for brochures and executive profiles.
* **Secure Config:** Professional environment-based API key management.

## 🏗 System Architecture

The bot operates using a dual-server setup:

1. **Frontend (Node.js):** Handles the WhatsApp connection, QR scanning, and media (PDF) delivery.
2. **Backend (Python/FastAPI):** Acts as the "Brain," processing text through Gemini and returning intent-based instructions to Node.js.

## 🛠 Tech Stack

* **Languages:** JavaScript (Node.js), Python 3.10+
* **AI Model:** Google Gemini 2.0 Flash
* **Frameworks:** FastAPI (Python), Express (Node.js - for health checks)
* **Key Libraries:** `whatsapp-web.js`, `qrcode-terminal`, `python-dotenv`, `google-genai`

## 📋 Prerequisites

* Node.js (v16+)
* Python (v3.10+)
* Gemini API Key (from [Google AI Studio](https://aistudio.google.com/))

## ⚙️ Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/varaddongare-dev/support-systems-bot.git](https://github.com/varaddongare-dev/support-systems-bot.git)
   cd support-systems-bot

2. **Install Node.js Dependencies:**

Bash
npm install

3. **Install Python Dependencies:**

Bash
pip install -r requirements.txt

4. **Configure Environment Variables:**
Create a .env file in the root directory:

Code snippet:
GEMINI_API_KEY=your_actual_api_key_here
BRAIN_URL=http://localhost:8000/process

# Optional: CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.ex

🏃 Run the Bot
You will need two terminals open:

Terminal 1 (Python Brain):

Bash
python main.py
Terminal 2 (WhatsApp Client):

Bash
node index.js
🚧 Roadmap
[ ] Refine Gemini system instructions for better medical/support empathy.

[ ] Complete automated email notification integration.

[ ] Implement a database (MongoDB/PostgreSQL) for long-term session memory.

[ ] Multi-document support (PDF analysis).

Developed by Varad Dongare MIT World Peace University, Pune
