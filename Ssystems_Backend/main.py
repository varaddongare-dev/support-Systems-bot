from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.responses import JSONResponse
from bson import ObjectId
import datetime
import sys


def safe_print(*args, **kwargs):
    """Print to stdout, replacing characters that can't be encoded by the
    terminal's codec instead of raising a UnicodeEncodeError."""
    text = " ".join(str(a) for a in args)
    safe_text = text.encode(sys.stdout.encoding or "utf-8", errors="replace").decode(
        sys.stdout.encoding or "utf-8"
    )
    print(safe_text, **kwargs)

app = FastAPI()

# CORS (so dashboard.html can call the API directly)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.SupportSystems_DB
logs_collection = db.message_logs


class MessageLog(BaseModel):
    sender: str
    issue: str
    ai_response: str = ""
    resolved_with_ai: bool = False


class LoginRequest(BaseModel):
    username: str
    password: str


@app.get("/")
async def heartbeat():
    return {"status": "online"}


@app.post("/login")
async def login(data: LoginRequest):
    import secrets
    if (
        str(data.username).strip() == "ADMIN" and
        str(data.password) == "AdminLogin"
    ):
        token = secrets.token_urlsafe(32)
        return {"success": True, "token": token}

    return {"success": False, "message": "Invalid credentials"}


@app.get("/logs")
async def get_logs(limit: int = 50, since: str = Query(None)):
    """Return data for the dashboard: recent logs + stats.

    Supports optional `?since=<ISO timestamp>` to only return logs newer
    than that timestamp, drastically reducing payload size on repeat polls.

    Payload shape:
    {
      "backend": {"status": "online"},
      "stats": {"totalMessages": number, "aiResolutions": number, "activeSessions": number},
      "logs": [{"id": str, "sender": str, "issue": str, "ai_response": str, "timestamp": iso}]
    }
    """

    # Build query — filter by timestamp if `since` was provided
    query = {}
    if since:
        try:
            since_dt = datetime.datetime.fromisoformat(since.replace("Z", "+00:00"))
            # Convert to naive UTC for comparison with stored UTC datetimes
            since_dt = since_dt.replace(tzinfo=None)
            query["timestamp"] = {"$gt": since_dt}
        except ValueError:
            pass  # ignore malformed since values — fall back to full fetch

    # Fetch logs (most recent first)
    cursor = logs_collection.find(query).sort("timestamp", -1).limit(limit)
    logs = []

    try:
        async for doc in cursor:
            ts = doc.get("timestamp")
            ts_iso = ts.isoformat() if hasattr(ts, "isoformat") else ts

            logs.append({
                "id": str(doc.get("_id") or ObjectId()),
                "sender": doc.get("sender", "unknown"),
                "issue": doc.get("issue", ""),
                "ai_response": doc.get("ai_response", ""),
                "timestamp": ts_iso,
            })
    except Exception:
        logs = []

    # Stats — total messages and real AI resolution count
    try:
        total_messages = await logs_collection.count_documents({})
    except Exception:
        total_messages = 0

    try:
        ai_resolutions = await logs_collection.count_documents({"resolved_with_ai": True})
    except Exception:
        ai_resolutions = 0

    payload = {
        "backend": {"status": "online"},
        "stats": {
            "totalMessages": total_messages,
            "aiResolutions": ai_resolutions,
            "activeSessions": 0,  # extend later with live session tracking
        },
        "logs": logs,
    }

    return JSONResponse(payload)


@app.post("/log-message")
async def log_message(data: MessageLog):
    log_entry = {
        "sender": data.sender,
        "issue": data.issue,
        "ai_response": data.ai_response,
        "resolved_with_ai": data.resolved_with_ai,
        "timestamp": datetime.datetime.now(datetime.timezone.utc)
    }

    result = await logs_collection.insert_one(log_entry)

    safe_print(f"[SUCCESS] Logged message from {data.sender} (AI resolved: {data.resolved_with_ai})")
    return {"status": "success", "db_id": str(result.inserted_id)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)