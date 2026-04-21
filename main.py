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
    # 1. Capture and Normalize
    raw_message = data.message if data.message else ""
    text_lower = raw_message.lower().strip()

    print(f"Received message: {raw_message}")

    # 2. --- WEBSITE BUTTON LOGIC ---
    # Each 'if' must be followed by a 'return' indented further in
    if "felt confused" in text_lower or "choose" in text_lower:
        return {"intent": "QUERY", "reply": "I have felt confused about which therapist to choose"}

    if "tried therapy" in text_lower or "didn't feel right" in text_lower:
        return {"intent": "QUERY", "reply": "I have tried therapy but it didn’t feel right for me"}

    if "not sure" in text_lower or "medication" in text_lower:
        return {"intent": "QUERY", "reply": "I don’t know if I need therapy, medication or both"}

    if "talk to somebody" in text_lower or "judgement free" in text_lower:
        return {"intent": "QUERY", "reply": "I have felt the need talk to someone judgement free"}

    if "understand myself better" in text_lower:
        return {"intent": "QUERY", "reply": "I want to understand myself better."}

    # 3. --- FILE REQUEST LOGIC ---
    if "brochure" in text_lower:
        return {"intent": "BROCHURE", "reply": "I'm sending the Support Systems brochure to you right now! ✨"}
    
    if any(word in text_lower for word in ["doctor", "executive", "profile"]):
        return {"intent": "EXECUTIVES", "reply": "Sharing our Psychologist and Executive profiles with you. ✨"}

    # 4. --- GENERAL AI FALLBACK ---
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=raw_message,
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