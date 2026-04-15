import os
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai 
import uvicorn
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

app = FastAPI()

# 1. SETUP GEMINI CLIENT 
# It now looks for GEMINI_API_KEY in your .env file
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

class UserMsg(BaseModel):
    message: str

@app.post("/process")
async def process_message(data: UserMsg):
    text = data.message.lower()
    
    # --- WEBSITE BUTTON LOGIC (Direct Empathy) ---
    if "confused" in text or "choose" in text or "trust" in text:
        return {"intent": "QUERY", "reply": "Choosing the right therapist is a deeply personal step, and it's completely normal to feel unsure. At Support Systems, we match you with professionals who prioritize your safety and trust. Would you like to see our executive profiles to help you decide?"}

    if "didn't feel right" in text or "tried therapy" in text:
        return {"intent": "QUERY", "reply": "I'm sorry to hear your previous experience wasn't ideal. Therapy is all about the 'click' between you and the professional. We’d love to help you find a better fit within the Support Systems network."}

    if "medication" in text or "both" in text:
        return {"intent": "QUERY", "reply": "That is a very important question. Whether you need talk therapy, medical support, or a combination of both depends on your unique journey. We can schedule a preliminary consultation to help clarify the best path for you."}

    if "judgement free" in text or "talk to somebody" in text or "feelings" in text:
        return {"intent": "QUERY", "reply": "Everyone deserves a safe space to be heard without being judged. Our psychologists at Support Systems are here to listen and support you through whatever you are feeling right now."}

    if "understand yourself" in text or "better" in text:
        return {"intent": "QUERY", "reply": "Self-discovery is a powerful journey. We can provide the tools and professional guidance to help you navigate your thoughts and understand yourself on a deeper level."}

    # --- STANDARD KEYWORDS ---
    if "brochure" in text:
        return {"intent": "BROCHURE", "reply": "I'm sending the Support Systems brochure to you right now! ✨"}
    
    if any(word in text for word in ["doctor", "executive", "profile"]):
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