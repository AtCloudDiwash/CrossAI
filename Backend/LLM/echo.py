import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")

gemini = genai.Client(api_key=GEMINI_KEY)

generation_config = types.GenerateContentConfig(
    temperature=0.7
)

def generate_echo(prompt: str):
    response = gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=generation_config
    )

    return {"result": response.text}
