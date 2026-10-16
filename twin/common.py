"""Общие функции для подготовки датасета и для бота.

Важно, чтобы бот собирал контекст ровно так же, как он собирался при обучении,
поэтому эта логика живёт в одном месте.
"""

# Если между сообщениями прошло больше этого времени — считаем, что начался новый разговор.
CONVERSATION_GAP_SECONDS = 6 * 60 * 60
# Сколько последних реплик (с учётом склейки подряд идущих сообщений) видит модель.
MAX_CONTEXT_TURNS = 8


def build_system_prompt(me_name, contact_name, persona=""):
    prompt = (
        f"Ты — {me_name}. Ты переписываешься в Telegram с собеседником по имени {contact_name}. "
        f"Отвечай в стиле {me_name}: тем же тоном, длиной сообщений, словами и пунктуацией. "
        "Если отвечаешь несколькими сообщениями подряд — пиши каждое с новой строки."
    )
    if persona:
        prompt += "\n\nО тебе:\n" + persona.strip()
    return prompt


def group_turns(messages):
    """Склеивает сообщения в реплики и режет переписку на разговоры.

    messages — список (is_me, text, unix_timestamp) в хронологическом порядке.
    Возвращает список разговоров; разговор — список {"role", "content"},
    где role = "assistant" для ваших сообщений и "user" для собеседника.
    """
    conversations, current, last_ts = [], [], None
    for is_me, text, ts in messages:
        if last_ts is not None and ts - last_ts > CONVERSATION_GAP_SECONDS and current:
            conversations.append(current)
            current = []
        role = "assistant" if is_me else "user"
        if current and current[-1]["role"] == role:
            current[-1]["content"] += "\n" + text
        else:
            current.append({"role": role, "content": text})
        last_ts = ts
    if current:
        conversations.append(current)
    return conversations


def trim_context(turns):
    """Оставляет последние MAX_CONTEXT_TURNS реплик; контекст должен начинаться с собеседника."""
    turns = [dict(t) for t in turns[-MAX_CONTEXT_TURNS:]]
    while turns and turns[0]["role"] == "assistant":
        turns.pop(0)
    return turns
