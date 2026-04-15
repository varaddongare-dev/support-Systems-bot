import os
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import uvicorn

# Load variables from .env
load_dotenv()

app = FastAPI()

# 1. SETUP THE GEMINI
api_key_env = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key_env)

class UserMsg(BaseModel):
    message: str

@app.post("/process")
async def process_message(data: UserMsg):
    text = data.message.lower()
    
    # 2. WEBSITE BUTTON LOGIC (Manual Priority Checks)
    # We check these FIRST to ensure the brand voice matches your image exactly.

    # Button 1: Confused about therapist
    if "confused" in text and "therapist" in text:
        reply = (
            "Trust me, we understand that it can be overwhelming and difficult. "
            "So, let us take care of it for you! A Support Systems executive will "
            "reach out shortly to help you find the perfect match."
        )
        return {"intent": "SUPPORT", "reply": reply}

    # Button 2: Bad experience
    if "bad experience" in text:
        reply = (
            "We're sorry you had to go through that. This happens more often than "
            "you think. We're here to get you the right person and ensure your "
            "journey with Support Systems is supportive and safe."
        )
        return {"intent": "SUPPORT", "reply": reply}

    # Button 3: Unsure/Medication
    if "unsure" in text or "medication" in text:
        reply = (
            "It's a fair confusion! Let's figure it out together. Our team will "
            "connect with you soon to help guide you through the best path for your healing."
        )
        return {"intent": "SUPPORT", "reply": reply}

    # 3. AI LOGIC: For any other general queries
    try:
        if not api_key_env:
            raise Exception("Gemini API Key missing!")

        print(f"🤖 Processing general query: {data.message}")
        
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=data.message,
            config={
                "system_instruction": (
                    "You are the official AI assistant for 'Support Systems'. "
                    "Your tone is professional, empathetic, and judgement-free. "
                    "If a user asks about choosing a therapist or bad experiences, "
                    "reassure them that Support Systems is here to find the right fit. "
                    "Keep responses under 3 sentences and always end with: 'We're here for you.'"
                )
            }
        )
        
        ai_reply = response.text if response.text else "We've noted your message. An executive will get back to you soon. We're here for you."
        
        return {"intent": "QUERY", "reply": ai_reply}
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "intent": "QUERY", 
            "reply": "Thank you for reaching out to Support Systems. An executive will assist you shortly. We're here for you."
        }

# 4. START THE SERVER
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Python Brain is starting on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)