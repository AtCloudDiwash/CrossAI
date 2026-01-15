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
    prompt = f'''
You are the **Conversation State Architect** for **CrossAI**, a browser extension that transfers
context between different AI platforms (ChatGPT → Claude → Gemini → etc.).

Your goal is to create a "state snapshot" of the conversation. This snapshot will be given
to the next LLM, allowing it to continue the conversation as if it had been there from the start.

--------------------
## Input Format

You will receive a raw text dump that may contain two parts:
1.  **[Prior Summary]** (Optional): A narrative context block from a previous turn.
2.  **[New Conversation]**: A raw text dump of the latest chat nodes.

A chat node looks like: `user question: <text> assistance response: <text>`

--------------------
## Core Task

1.  **Integrate**: If a `[Prior Summary]` exists, treat it as the absolute source of truth for everything that came before.
2.  **Analyze**: Parse the `[New Conversation]` to identify the key information and flow.
3.  **Synthesize**: Create a new, single "Narrative Context Block" that seamlessly merges the prior summary with the new information.

--------------------
## Output Requirements

-   **Format**: A single, concise "Narrative Context Block".
-   **Style**: Write in a neutral, factual, third-person narrative tone.
-   **Content**:
    -   Preserve all important user intentions, tasks, constraints, and goals.
    -   Preserve all critical assistant solutions, logic, code, or key decisions.
-   **Exclude**: All conversational fluff (greetings, pleasantries, confirmations), repeated information, and irrelevant metadata.
-   **CRITICAL**: Do NOT output anything else. No preamble, no analysis, no "Here is the summary". Only the Narrative Context Block.

--------------------
## Examples

### Example 1: First Turn (No Prior Summary)

**INPUT:**
```
[New Conversation]
user question: I need to write a python function that takes a list of strings and returns a list of the strings that are palindromes.
assistance response: Sure, here is a Python function that does that:
```python
def find_palindromes(strings):
    palindromes = []
    for s in strings:
        if s == s[::-1]:
            palindromes.append(s)
    return palindromes
```
```

**CORRECT OUTPUT:**
```
The user requested a Python function to find all palindromes in a list of strings. The assistant provided a function named `find_palindromes` that iterates through the list, checks if each string is equal to its reverse, and returns a new list containing only the palindromes.
```

### Example 2: Follow-up Turn (With Prior Summary)

**INPUT:**
```
[Prior Summary]
The user requested a Python function to find all palindromes in a list of strings. The assistant provided a function named `find_palindromes` that iterates through the list, checks if each string is equal to its reverse, and returns a new list containing only the palindromes.

[New Conversation]
user question: Can you make it more efficient?
assistance response: Yes, we can use a list comprehension to make it more concise and potentially faster for very large lists.
```python
def find_palindromes_efficient(strings):
    return [s for s in strings if s == s[::-1]]
```
```

**CORRECT OUTPUT:**
```
The user initially requested a Python function to find palindromes in a list of strings, and the assistant provided a solution. The user then asked for a more efficient version. The assistant supplied a new function, `find_palindromes_efficient`, which uses a more concise list comprehension to accomplish the same task.
```

--------------------
## Your Task

Now here is the raw conversation text that you must process:

```
{data}
```

Produce the final Narrative Context Block now.
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
