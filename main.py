import os
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai 
import uvicorn
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Setup Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

class UserMsg(BaseModel):
    message: str

@app.post("/process")
async def process_message(data: UserMsg):
    text = data.message.strip() # Exact match works better for website buttons
    text_lower = text.lower()
    
    # --- WEBSITE BUTTON LOGIC (Your Exact Replies) ---
    
    # 1. Choice/Trust Confusion
    if "confused about which therapist" in text_lower:
        return {"intent": "QUERY", "reply": "Trust me, we understand that it can be overwhelming and difficult. So, let us take care of it for you. Our team will get in touch with you shortly. We’re here for you."}

    # 2. Previous Bad Experience
    if "didn't feel right" in text_lower:
        return {"intent": "QUERY", "reply": "We’re sorry you had to go through that, this happens more often than you think—that’s why we’re here to get you the right person for you. Our team will get in touch with you shortly. We’re here for you."}

    # 3. Therapy vs Medication
    if "therapy, medication, or both" in text_lower:
        return {"intent": "QUERY", "reply": "It’s a fair confusion, let’s figure it out together. Our team will get in touch with you shortly. We’re here for you."}

    # 4. Talk / Judgement Free
    if "judgement free" in text_lower:
        return {"intent": "QUERY", "reply": "We’re glad you reached out! Our team will get in touch with you shortly. We’re here for you."}

    # 5. Understand yourself better
    if "understand yourself better" in text_lower:
        return {"intent": "QUERY", "reply": "Self-awareness is the first step toward growth. Our team will get in touch with you shortly to help you navigate this journey. We’re here for you."}

    # --- STANDARD KEYWORDS ---
    if "brochure" in text_lower:
        return {"intent": "BROCHURE", "reply": "I'm sending the Support Systems brochure to you right now! ✨"}
    
    if any(word in text_lower for word in ["doctor", "executive", "profile"]):
        return {"intent": "EXECUTIVES", "reply": "Sharing our Psychologist and Executive profiles with you. ✨"}

    # --- GENERAL AI FALLBACK ---
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=data.message,
            config={
                "system_instruction": (
                    "You are the official AI assistant for 'Support Systems'. "
                    "Be professional, empathetic, and brief. Mention 'Support Systems' "
                    "and keep responses under 3 sentences."
                )
            }
        )
        return {"intent": "QUERY", "reply": response.text}
        
    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return {"intent": "QUERY", "reply": "I've noted your message. An executive from Support Systems will get back to you soon. ✨"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)