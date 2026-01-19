import time
import logging
from fastapi import FastAPI
from pydantic import BaseModel
from LLM.echo import generate_echo
from fastapi.middleware.cors import CORSMiddleware 

app = FastAPI()

origins = [
    # Allow the specific URL where your extension content script runs.
    # For a browser extension targeting AI platforms, you need to allow
    # the domains of those platforms.
    "https://chatgpt.com",
    "https://gemini.google.com",
    "https://claude.ai",
    
    # If testing locally, you might need to allow localhost:
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    
    # You can also use "*" to allow ALL origins, but this is less secure.
    # For a browser extension accessing public domains, using specific domains is better.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,             
    allow_credentials=True,           
    allow_methods=["*"],              
    allow_headers=["*"],              
)

class InputData(BaseModel):
    text: str

def custom_prompt(data: str):
    print("This enpoint is pinged")
    print(data)
    prompt = f'''
        <ROLE>

            You are a smart summarization engine.
            Your purpose is to ingest raw conversation logs between a user and an AI platform
            (e.g., ChatGPT, Claude, Gemini) and produce a **Structured Context Handoff Summary**.

            This summary must allow a secondary AI (the target AI platform) to resume the conversation
            with perfect continuity, without losing any important details, while preserving the
            semantic meaning, intent, constraints, and decisions of the original interaction.

            The secondary AI should be able to continue as if it has seen the entire conversation.

        </ROLE>


        <DATAFORMAT>

            The input consists of one or more conversation turns.
            Each turn appears in chronological order and follows this structure:

            user: "User message"
            AI: "AI response"

            The sequence may repeat multiple times:

            user: "User message"
            AI: "AI response"

            user: "User message"
            AI: "AI response"
            
            user: "User message"
            AI: "AI response"

            There may be:
            - A single turn, or
            - Multiple consecutive turns forming a full conversation

            You must treat all turns as a continuous interaction and summarize them
            as a single coherent context.

            The input conversation may be incomplete or out of chronological order.
            You must infer logical and semantic chronology based on meaning, corrections,
            and dependency — not message position.


        </DATAFORMAT>

        <CONSTRAINTS>

            1. DO NOT write meta-summaries (e.g., "The user asked about...").
            2. DO NOT explain concepts abstractly or add educational commentary.
            3. PRESERVE all constraints, decisions, facts, goals, and instructions exactly as stated.
            4. REMOVE conversational fluff, greetings, filler, and any content that does not affect
            future reasoning or decision-making.
            5. DO NOT infer, assume, guess, or invent information that is not explicitly present
            in the conversation.
            6. Preserve speaker authority:
            - User instructions, constraints, and corrections are authoritative.
            - AI responses should be summarized only as outcomes, decisions, or provided solutions.
            7. IF information for a section is missing, write exactly:
            "(No specific information provided in this interaction.)"

            8. Image handling rules:
            - If the user query is empty or missing, assume an image may have been provided.
            - If the AI response references an image (e.g., “the provided image”, “the image shows…”),
                note that an image was supplied.
            - If the AI response itself is an image generation (e.g., design, illustration, visual output),
                record that explicitly.
            - Do NOT describe image contents unless the AI explicitly described them.

            9. Any image-related context must be recorded only in the designated section
                of the output schema.
            10. If AI responses conflict with each other:
                - Prefer later, more specific, or explicitly revised outcomes.
                - If no clear resolution exists, preserve the uncertainty explicitly.
            11. The input may contain only user messages or only AI messages.
                You must still produce a valid summary using the provided schema.
        </CONSTRAINTS>


        <FORMAT_SCHEMA>

            User Goal:
            [Clear statement of the user’s high-level objective.]

            Current State:
            [What has already been done, answered, or decided.]

            Key Decisions:
            - [Confirmed choices or conclusions.]

            Constraints & Rules:
            - [Instructions, limitations, or requirements that must be followed strictly.]

            Important Details:
            [Technical specifics, configurations, definitions, versions, or references.]

            Images / Visual Context:
            [Indicate whether images were provided or generated, and how they were used.
            If none, state the missing-information placeholder.]

            Open Questions / Next Steps:
            [What is still unresolved or required to proceed.]

            The output MUST follow this schema exactly.
            Do NOT add, remove, rename, or reorder sections.

        </FORMAT_SCHEMA>


        <EXAMPLE>

        INPUT:

        user: The system should store everything in a database.

        AI: Explains a database-based storage architecture and persistence strategy.

        user: No, do NOT use a database. This must be completely databaseless.

        AI: Adjusts the solution to use client-side storage and avoid any server-side persistence.

        OUTPUT:

        User Goal:
        Design a storage approach for the system that meets architectural requirements.

        Current State:
        The storage approach has been revised from a database-backed solution to a fully databaseless design using client-side mechanisms.

        Key Decisions:
        - The system will NOT use any database.
        - All storage must be handled without server-side persistence.

        Constraints & Rules:
        - Do not introduce any database or server-side data storage.
        - The solution must remain completely databaseless.

        Important Details:
        - Client-side storage mechanisms are used instead of a traditional database.

        Open Questions / Next Steps:
        (No specific information provided in this interaction.)

        </EXAMPLE>


        <EXAMPLE>

        INPUT:

        user:
        Why is the design in this image faulty?
        (User provided an image.)

        AI:
        Describes the image layout, identifies structural weaknesses in the design, and explains why the design may fail under certain conditions.

        OUTPUT:

        User Goal:
        Understand why the provided design is faulty.

        Current State:
        An image of a design was provided and analyzed for structural issues.

        Key Decisions:
        (No specific information provided in this interaction.)

        Constraints & Rules:
        (No specific information provided in this interaction.)

        Important Details:
        - The user provided an image as part of the query.
        - The AI analyzed visual elements of the design and identified specific flaws.

        Open Questions / Next Steps:
        (No specific information provided in this interaction.)

        </EXAMPLE>

        # ===== BEGIN USER DATA =====
            {data}
        # ===== END USER DATA =====

    '''
    return prompt


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CrossAI")


@app.post("/generate_echo")
def generate_result(data: InputData):
    prompt = custom_prompt(data.text)

    start_time = time.perf_counter()
    result = generate_echo(prompt)
    end_time = time.perf_counter()

    duration = end_time - start_time
    logger.info(f"generate_echo latency: {duration:.3f}s")
    print(f"CrossAI took {duration}s to generate the last response")

    return result

@app.get("/ping")
async def ping():
    return {"status": "ok"}
