"""Превращает экспорт Telegram Desktop (result.json) в датасет для дообучения.

Пример:
    python prepare_dataset.py "~/Downloads/Telegram Desktop/DataExport/result.json"
"""
import argparse
import json
import random
from collections import Counter
from datetime import datetime
from pathlib import Path

from common import build_system_prompt, group_turns, trim_context


def message_text(msg):
    text = msg.get("text", "")
    if isinstance(text, list):
        text = "".join(p if isinstance(p, str) else p.get("text", "") for p in text)
    return text.strip()


def message_ts(msg):
    if "date_unixtime" in msg:
        return int(msg["date_unixtime"])
    return datetime.fromisoformat(msg["date"]).timestamp()


def load_chats(data):
    if "chats" in data:
        return data["chats"]["list"]
    return [data]  # экспорт одного чата


def detect_me(data, chats):
    info = data.get("personal_information", {})
    if "user_id" in info:
        name = " ".join(filter(None, [info.get("first_name"), info.get("last_name")]))
        return f"user{info['user_id']}", name
    # Без personal_information: вы — тот, кто встречается в наибольшем числе чатов.
    counter = Counter()
    names = {}
    for chat in chats:
        for m in chat.get("messages", []):
            if m.get("from_id"):
                names[m["from_id"]] = m.get("from") or ""
        counter.update({m["from_id"] for m in chat.get("messages", []) if m.get("from_id")})
    top = counter.most_common(2)
    if not top or (len(top) == 2 and top[0][1] == top[1][1]):
        raise SystemExit("Не удалось определить ваш аккаунт — укажите его через --me-id user123456")
    return top[0][0], names.get(top[0][0], "")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("export", type=Path, help="путь к result.json из экспорта Telegram Desktop")
    parser.add_argument("-o", "--output", type=Path, default=Path("data/train.jsonl"))
    parser.add_argument("--me-id", help="ваш from_id в экспорте, например user123456 (обычно определяется сам)")
    parser.add_argument("--name", help="как вас зовут (по умолчанию — имя из экспорта)")
    parser.add_argument("--persona", type=Path, help="файл с фактами о вас (тот же, что PERSONA_FILE у бота)")
    parser.add_argument("--exclude", nargs="*", default=[], help="имена чатов, которые не брать в обучение")
    parser.add_argument("--max-reply-chars", type=int, default=1000, help="пропускать слишком длинные ответы")
    args = parser.parse_args()

    data = json.loads(args.export.read_text(encoding="utf-8"))
    chats = load_chats(data)
    me_id, detected_name = detect_me(data, chats)
    me_id = args.me_id or me_id
    me_name = args.name or detected_name or "я"
    persona = args.persona.read_text(encoding="utf-8") if args.persona else ""
    excluded = {name.lower() for name in args.exclude}

    samples, used_chats = [], 0
    for chat in chats:
        contact = chat.get("name") or "Собеседник"
        if chat.get("type") != "personal_chat" or contact.lower() in excluded:
            continue
        messages = []
        for m in chat.get("messages", []):
            if m.get("type") != "message" or m.get("forwarded_from") or m.get("via_bot"):
                continue
            text = message_text(m)
            if text:
                messages.append((m.get("from_id") == me_id, text, message_ts(m)))

        system = build_system_prompt(me_name, contact, persona)
        before = len(samples)
        for conversation in group_turns(messages):
            for i, turn in enumerate(conversation):
                if turn["role"] != "assistant" or len(turn["content"]) > args.max_reply_chars:
                    continue
                context = trim_context(conversation[:i])
                if context:
                    samples.append({"messages": [{"role": "system", "content": system}, *context, turn]})
        used_chats += len(samples) > before

    random.seed(0)
    random.shuffle(samples)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        for sample in samples:
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")

    print(f"Вы: {me_name} ({me_id})")
    print(f"Чатов использовано: {used_chats}, примеров: {len(samples)} -> {args.output}")
    if len(samples) < 300:
        print("Внимание: примеров мало, модель плохо выучит ваш стиль. Лучше 1000+.")


if __name__ == "__main__":
    main()
