import os
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai  # ✅ Using the new 2.0 SDK
from dotenv import load_dotenv # ⬅️ Added this
import uvicorn

# Load variables from the .env file
load_dotenv()

app = FastAPI()

# 1. SETUP THE GEMINI
# Created an .env file for api_key used for the bot.

api_key_env = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key_env)

class UserMsg(BaseModel):
    message: str

@app.post("/process")
async def process_message(data: UserMsg):
    # Convert message to lowercase for easy keyword checking
    text = data.message.lower()
    
    # 2. PRIORITY LOGIC: Manual Keyword Checks
    if "brochure" in text:
        return {"intent": "BROCHURE", "reply": "I'm sending the Support Systems brochure to you right now! ✨"}
    
    if any(keyword in text for keyword in ["doctor", "executive", "profile"]):
        return {"intent": "EXECUTIVES", "reply": "Certainly! I am sharing our Psychologist and Executive profiles with you. ✨"}

    # 3. AI LOGIC: Using Gemini 2.0 Flash
    try:
        # Checking if API key is missing before calling Gemini
        if not api_key_env:
            raise Exception("Gemini API Key is missing from .env file!")

        print(f"🤖 Processing query with Gemini: {data.message}")
        
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=data.message,
            config={
                "system_instruction": (
                    "You are the official AI assistant for 'Support Systems'. "
                    "Your tone is professional, empathetic, and helpful. "
                    "If a user has a billing or technical issue, acknowledge it and say "
                    "an executive will verify the details soon. "
                    "Keep responses under 3 sentences and always mention 'Support Systems'."
                )
            }
        )
        
        ai_reply = response.text if response.text else "I've noted that. An executive will get back to you soon. ✨"
        
        return {"intent": "QUERY", "reply": ai_reply}
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "intent": "QUERY", 
            "reply": "Thank you for contacting Support Systems. We have received your message and an executive will assist you shortly. ✨"
        }

# 4. START THE SERVER
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Python Brain is starting on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)