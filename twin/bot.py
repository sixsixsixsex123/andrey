"""Telegram-юзербот: отвечает в личных сообщениях от вашего имени с помощью дообученной модели.

Управление — пишите себе в «Избранное»:
    /twin off     — выключить автоответы
    /twin on      — включить
    /twin status  — текущее состояние
Если вы сами написали в чат, пока бот «думал», он в этом чате промолчит.
"""
import asyncio
import logging
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from telethon import TelegramClient, events, utils

from common import build_system_prompt, group_turns, trim_context

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("twin")


def _set(name):
    return {x.strip().lstrip("@").lower() for x in os.getenv(name, "").split(",") if x.strip()}


API_ID = int(os.environ["API_ID"])
API_HASH = os.environ["API_HASH"]
MY_NAME = os.environ["MY_NAME"]
PERSONA = Path(os.environ["PERSONA_FILE"]).read_text(encoding="utf-8") if os.getenv("PERSONA_FILE") else ""
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "twin")
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))
REPLY_DELAY = float(os.getenv("REPLY_DELAY", "20"))
HISTORY_LIMIT = int(os.getenv("HISTORY_LIMIT", "40"))
WHITELIST = _set("WHITELIST")
BLACKLIST = _set("BLACKLIST")

client = TelegramClient("twin", API_ID, API_HASH)
state = {"enabled": True}
pending = {}  # chat_id -> asyncio.Task с отложенным ответом


def allowed(user):
    keys = {str(user.id)} | ({user.username.lower()} if user.username else set())
    if keys & BLACKLIST:
        return False
    return not WHITELIST or bool(keys & WHITELIST)


async def generate(messages):
    async with httpx.AsyncClient(timeout=300) as http:
        response = await http.post(f"{OLLAMA_URL}/api/chat", json={
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
            "options": {"temperature": TEMPERATURE, "num_predict": 256},
        })
        response.raise_for_status()
        return response.json()["message"]["content"].strip()


async def reply(chat_id, user):
    # Ждём, пока собеседник допишет: каждое новое сообщение перезапускает таймер.
    await asyncio.sleep(REPLY_DELAY)
    history = await client.get_messages(chat_id, limit=HISTORY_LIMIT)
    if not history or history[0].out:
        return
    messages = [(m.out, m.message.strip(), m.date.timestamp())
                for m in reversed(history) if m.message and m.message.strip()]
    conversations = group_turns(messages)
    if not conversations:
        return
    context = trim_context(conversations[-1])
    if not context or context[-1]["role"] != "user":
        return

    contact = utils.get_display_name(user) or "Собеседник"
    system = build_system_prompt(MY_NAME, contact, PERSONA)
    text = await generate([{"role": "system", "content": system}, *context])
    if not text:
        return
    # Дальше задачу не отменяем — иначе ответ оборвётся на середине.
    if pending.get(chat_id) is asyncio.current_task():
        del pending[chat_id]

    log.info("-> %s: %s", contact, text.replace("\n", " | "))
    await client.send_read_acknowledge(chat_id)
    for line in (l.strip() for l in text.split("\n")):
        if not line:
            continue
        async with client.action(chat_id, "typing"):
            await asyncio.sleep(min(1 + len(line) * 0.06, 8))
        await client.send_message(chat_id, line)


async def safe_reply(chat_id, user):
    try:
        await reply(chat_id, user)
    except asyncio.CancelledError:
        pass
    except Exception:
        log.exception("Не удалось ответить в чат %s", chat_id)


def cancel_pending(chat_id):
    task = pending.pop(chat_id, None)
    if task and not task.done():
        task.cancel()


@client.on(events.NewMessage(incoming=True))
async def on_incoming(event):
    if not state["enabled"] or not event.is_private:
        return
    user = await event.get_sender()
    if user is None or getattr(user, "bot", False) or not allowed(user):
        return
    cancel_pending(event.chat_id)
    pending[event.chat_id] = asyncio.create_task(safe_reply(event.chat_id, user))


@client.on(events.NewMessage(outgoing=True))
async def on_outgoing(event):
    if event.chat_id != state["me_id"]:
        # Вы ответили сами — бот в этом чате не вмешивается.
        cancel_pending(event.chat_id)
        return
    command = event.raw_text.strip().lower()
    if command == "/twin off":
        state["enabled"] = False
        for chat_id in list(pending):
            cancel_pending(chat_id)
        await event.reply("Автоответы выключены")
    elif command == "/twin on":
        state["enabled"] = True
        await event.reply("Автоответы включены")
    elif command == "/twin status":
        await event.reply("Включено" if state["enabled"] else "Выключено")


async def main():
    await client.start()
    state["me_id"] = (await client.get_me()).id
    log.info("Бот запущен. Управление: /twin off | on | status в «Избранном».")
    await client.run_until_disconnected()


if __name__ == "__main__":
    client.loop.run_until_complete(main())
