"""Поговорить с моделью в консоли до того, как пускать её в Telegram.

    python chat.py "Имя собеседника"
"""
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

from common import build_system_prompt, trim_context

load_dotenv()
persona = Path(os.environ["PERSONA_FILE"]).read_text(encoding="utf-8") if os.getenv("PERSONA_FILE") else ""
system = build_system_prompt(os.getenv("MY_NAME", "я"), sys.argv[1] if len(sys.argv) > 1 else "Друг", persona)
url = os.getenv("OLLAMA_URL", "http://localhost:11434") + "/api/chat"
model = os.getenv("OLLAMA_MODEL", "twin")

turns = []
print("Пишите сообщения от лица собеседника (Ctrl+C — выход).")
while True:
    turns.append({"role": "user", "content": input("> ")})
    response = httpx.post(url, timeout=300, json={
        "model": model,
        "messages": [{"role": "system", "content": system}, *trim_context(turns)],
        "stream": False,
        "options": {"temperature": float(os.getenv("TEMPERATURE", "0.7"))},
    })
    response.raise_for_status()
    answer = response.json()["message"]["content"].strip()
    turns.append({"role": "assistant", "content": answer})
    print(answer, "\n")
