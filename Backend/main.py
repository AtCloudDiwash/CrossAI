import time
import logging
import os
import hmac
import requests
from enum import Enum
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from LLM.echo import generate_echo
from fastapi.middleware.cors import CORSMiddleware 

load_dotenv()

app = FastAPI()

origins = [
    # Allow the specific URL where your extension content script runs.
    # For a browser extension targeting AI platforms, you need to allow
    # the domains of those platforms.
    "https://chatgpt.com",
    "https://gemini.google.com",
    "https://claude.ai",
    "https://perplexity.ai",
    "https://www.perplexity.ai",
    "https://chat.deepseek.com",
    
    # If testing locally, you might need to allow localhost:
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    
    # You can also use "*" to allow ALL origins, but this is less secure.
    # For a browser extension accessing public domains, using specific domains is better.
]

extension_origin = os.getenv("EXTENSION_ORIGIN")
if extension_origin:
    origins.append(extension_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,             
    allow_credentials=True,           
    allow_methods=["*"],              
    allow_headers=["*"],              
)

class TurnData(BaseModel):
    turns: list

class TelemetryEvent(str, Enum):
    extension_opened = "extension_opened"
    platform_detected = "platform_detected"
    summary_endpoint_hit = "summary_endpoint_hit"
    selector_failed = "selector_failed"

class TelemetryPlatform(str, Enum):
    chatgpt = "chatgpt"
    claude = "claude"
    gemini = "gemini"
    perplexity = "perplexity"
    deepseek = "deepseek"
    unknown = "unknown"

class TelemetryData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event: TelemetryEvent
    version: Optional[str] = Field(default=None, max_length=32)
    platform: Optional[TelemetryPlatform] = None
    selector_area: Optional[str] = Field(default=None, max_length=64)

def turns_to_text(turns: list) -> str:
    parts = []
    for turn in turns:
        platform = list(turn["assistant"].keys())[0]
        response = turn["assistant"][platform]
        parts.append(f'user: {turn["user"]}\n{platform}: {response}')
    return "\n\n".join(parts)

def custom_prompt(data: str):
    print("This endpoint is pinged")
    print(data)
    prompt = f'''
        <ROLE>

            You are a memory export engine.
            Your purpose is to ingest raw conversation logs between a user and an AI platform
            and convert them into a structured, self-contained memory block.

            This memory block will be injected into a different AI platform as persistent context.
            The receiving AI must be able to read it and immediately understand:
            - What the user is working on
            - What has already been decided or solved
            - What rules and constraints must be respected
            - What still needs to be done

            The output is NOT a summary for a human to read.
            It is a machine-readable memory handoff that another AI will consume directly.
            Write it as instructions and facts addressed TO the receiving AI.

        </ROLE>


        <DATAFORMAT>

            Input is one or more conversation turns in chronological order:

            user: “User message”
            [platform_name]: “AI response”

            The platform name (e.g. chatgpt, claude, perplexity) identifies which AI produced the response.
            Treat all turns as a single continuous interaction regardless of source platform.

            The input may be incomplete or partially out of order.
            Infer logical chronology from meaning, corrections, and dependencies — not position.

        </DATAFORMAT>


        <CONSTRAINTS>

            1. Write the output as direct instructions TO the receiving AI, not descriptions about the conversation.
            2. DO NOT write meta-commentary (e.g., “The user discussed...” or “The conversation covered...”).
            3. PRESERVE all constraints, decisions, facts, and instructions verbatim where possible.
            4. REMOVE greetings, filler, and anything that does not affect future reasoning.
            5. DO NOT infer, assume, or invent anything not explicitly present in the input.
            6. User instructions and corrections are authoritative. AI responses are recorded only as outcomes or solutions provided.
            7. If conflicting AI responses exist, prefer the most recent or explicitly corrected one.
            8. If information for a section is absent, write exactly:
               “(No specific information provided.)”
            9. Image handling:
               - If the AI references an image, note that one was provided.
               - If the AI generated an image, record that explicitly.
               - Do NOT describe image contents unless the AI explicitly did so.

        </CONSTRAINTS>


        <FORMAT_SCHEMA>

            [IMPORTED MEMORY]
            This context was extracted from a prior conversation. Treat everything below as persistent memory and apply it to all responses in this session.

            Source Platform: [platform name(s) found in the input]

            User Goal:
            [What the user is trying to achieve — stated as a fact, not a description.]

            Current State:
            [What has been completed, answered, or decided so far.]

            Key Decisions:
            - [Confirmed choices or conclusions the user has locked in.]

            Constraints & Rules:
            - [Hard rules and requirements you must follow without exception.]

            Important Details:
            [Technical facts, configurations, definitions, or references that affect future responses.]

            Images / Visual Context:
            [Whether images were provided or generated and how they were used.]

            Open Questions / Next Steps:
            [What is unresolved or what the user still needs.]

            The output MUST follow this schema exactly.
            Do NOT add, remove, rename, or reorder sections.

        </FORMAT_SCHEMA>


        <EXAMPLE>

        INPUT:

        user: The system should store everything in a database.
        chatgpt: Proposes a PostgreSQL-based storage architecture with persistent server-side tables.

        user: No, do NOT use a database. This must be completely databaseless.
        chatgpt: Revises the solution to use chrome.storage.local and avoids all server-side persistence.

        OUTPUT:

        [IMPORTED MEMORY]
        This context was extracted from a prior conversation. Treat everything below as persistent memory and apply it to all responses in this session.

        Source Platform: chatgpt

        User Goal:
        Design a storage solution for the system that is completely databaseless.

        Current State:
        A databaseless approach using chrome.storage.local has been agreed upon and replaces the earlier database proposal.

        Key Decisions:
        - No database of any kind will be used.
        - All storage must be client-side only.

        Constraints & Rules:
        - Never introduce a database or any server-side data persistence.
        - The solution must remain fully databaseless.

        Important Details:
        - chrome.storage.local is the confirmed storage mechanism.

        Images / Visual Context:
        (No specific information provided.)

        Open Questions / Next Steps:
        (No specific information provided.)

        </EXAMPLE>


        <EXAMPLE>

        INPUT:

        user: Why is the design in this image faulty?
        claude: Analyzes the image, identifies that the load-bearing column is misaligned, and explains why this causes structural failure under lateral stress.

        OUTPUT:

        [IMPORTED MEMORY]
        This context was extracted from a prior conversation. Treat everything below as persistent memory and apply it to all responses in this session.

        Source Platform: claude

        User Goal:
        Understand the structural faults in a provided design image.

        Current State:
        The image has been analyzed. A misaligned load-bearing column was identified as the primary fault.

        Key Decisions:
        (No specific information provided.)

        Constraints & Rules:
        (No specific information provided.)

        Important Details:
        - The user provided a design image for analysis.
        - The fault identified: load-bearing column misalignment causing structural failure under lateral stress.

        Images / Visual Context:
        - User provided a design image as part of the query.
        - The AI performed a structural analysis of the image.

        Open Questions / Next Steps:
        (No specific information provided.)

        </EXAMPLE>


        # ===== BEGIN USER DATA =====
            {data}
        # ===== END USER DATA =====

    '''
    return prompt


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CrossAI")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
TELEMETRY_TABLE = os.getenv("TELEMETRY_TABLE", "extension_telemetry")
TELEMETRY_INGEST_TOKEN = os.getenv("TELEMETRY_INGEST_TOKEN", "")

def require_telemetry_token(token: Optional[str]):
    if not TELEMETRY_INGEST_TOKEN:
        raise HTTPException(status_code=503, detail="telemetry_not_configured")

    if not token or not hmac.compare_digest(token, TELEMETRY_INGEST_TOKEN):
        raise HTTPException(status_code=401, detail="unauthorized")

def insert_telemetry_event(data: TelemetryData):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=503, detail="telemetry_not_configured")

    row = {
        "event_name": data.event.value,
        "extension_version": data.version,
        "platform": data.platform.value if data.platform else None,
        "selector_area": data.selector_area,
    }

    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/{TELEMETRY_TABLE}",
            headers={
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            json=row,
            timeout=5,
        )
    except requests.RequestException as err:
        logger.exception("Telemetry insert request failed")
        raise HTTPException(status_code=502, detail="telemetry_insert_failed") from err

    if response.status_code >= 400:
        logger.error("Telemetry insert failed: %s %s", response.status_code, response.text)
        raise HTTPException(status_code=502, detail="telemetry_insert_failed")


@app.post("/generate_echo")
def generate_result(data: TurnData):
    prompt = custom_prompt(turns_to_text(data.turns))

    start_time = time.perf_counter()
    result = generate_echo(prompt)
    end_time = time.perf_counter()

    duration = end_time - start_time
    logger.info(f"generate_echo latency: {duration:.3f}s")
    print(f"CrossAI took {duration}s to generate the last response")

    return result

@app.post("/telemetry")
def telemetry(
    data: TelemetryData,
    request: Request,
    x_crossai_telemetry_key: Optional[str] = Header(default=None),
):
    require_telemetry_token(x_crossai_telemetry_key)

    origin = request.headers.get("origin")
    if origin and origin not in origins:
        raise HTTPException(status_code=403, detail="origin_not_allowed")

    insert_telemetry_event(data)
    return {"ok": True}

@app.get("/ping")
async def ping():
    return {"status": "ok"}
