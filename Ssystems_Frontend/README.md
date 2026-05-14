# Support Systems - Frontend & WhatsApp Bot

This directory contains the Node.js WhatsApp Bot and the frontend dashboard UI for the Support Systems application.

## Contents
- **`index.js`**: The main Node.js application that runs the WhatsApp Web bot using `whatsapp-web.js` and `puppeteer`. It listens to incoming messages, replies based on predefined rules, and logs interactions to the Python backend.
- **`login.html` & `dashboard.html`**: The frontend UI for monitoring the bot's logs and metrics.
- **`package.json`**: Contains the Node.js dependencies and run scripts.

## Requirements
- **Node.js** (v14 or higher recommended)
- **NPM** (Node Package Manager)
- **Google Chrome** installed (for Puppeteer to launch the WhatsApp Web client)
- The Python Backend must be running for the bot to successfully log messages.

## Setup & Installation
1. Open your terminal in the `Ssystems_Frontend` folder (or the root folder where `package.json` resides).
2. Install the necessary Node.js dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables. Ensure you have a `.env` file containing any required configuration.

## How to Run
To start the WhatsApp bot:
```bash
npm start
```
- When the bot starts, it will generate a QR code in the terminal.
- Scan this QR code using the WhatsApp app on your phone (Linked Devices).
- Once authenticated, the bot will start listening for incoming messages.

To view the dashboard, simply open `login.html` in your web browser.
