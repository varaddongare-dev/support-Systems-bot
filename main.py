import os
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai  # ✅ Using the new 2.0 SDK
import uvicorn

app = FastAPI()

# 1. SETUP THE GEMINI
client = genai.Client(api_key="AIzaSyDREKHe2R5mvipluXTGC9c33H8gJs8Vs_8")

class UserMsg(BaseModel):
    message: str

@app.post("/process")
async def process_message(data: UserMsg):
    # Convert message to lowercase for easy keyword checking
    text = data.message.lower()
    
    # 2. PRIORITY LOGIC: Manual Keyword Checks
    # We check these FIRST so the bot sends specific files instead of just AI text
    if "brochure" in text:
        return {"intent": "BROCHURE", "reply": "I'm sending the Support Systems brochure to you right now! ✨"}
    
    if "doctor" in text or "executive" in text or "profile" in text:
        return {"intent": "EXECUTIVES", "reply": "Certainly! I am sharing our Psychologist and Executive profiles with you. ✨"}

    # 3. AI LOGIC: Using Gemini 2.0 Flash
    try:
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
        
        # Extract the text response from the AI
        ai_reply = response.text if response.text else "I've noted that. An executive will get back to you soon. ✨"
        
        return {"intent": "QUERY", "reply": ai_reply}
        
    except Exception as e:
        # If the AI service is down or there is an API error, use this fallback
        print(f"❌ Gemini SDK Error: {e}")
        return {
            "intent": "QUERY", 
            "reply": "Thank you for contacting Support Systems. We have received your message and an executive will assist you shortly. ✨"
        }

# 4. START THE SERVER
if __name__ == "__main__":
    # Detect port for deployment or default to 8000
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Python Brain is starting on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)