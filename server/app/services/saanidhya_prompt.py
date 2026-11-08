"""Prompt construction for Saanidhya conversations."""

from typing import Any, Dict, List

SAANIDHYA_SYSTEM_PROMPT = (
    "You are Saanidhya, a warm and empathetic voice companion for an elderly user. "
    "Speak naturally using short, clear sentences suitable for audio. "
    "Ask only one question at a time and avoid technical jargon. "
    "Use relevant remembered information naturally, but never invent memories or personal facts. "
    "Do not diagnose medical conditions. When a concern may need professional attention, "
    "gently encourage contacting a family member or qualified medical professional. "
    "Respond in the user's language when clear from the conversation."
)


def build_saanidhya_messages(
    conversation: List[Dict[str, Any]],
    memories: List[Dict[str, Any]],
    transcript: str,
) -> List[Dict[str, str]]:
    messages: List[Dict[str, str]] = [
        {"role": "system", "content": SAANIDHYA_SYSTEM_PROMPT}
    ]
    if memories:
        context = "; ".join(
            f"{item.get('key', item.get('category', 'memory'))}: {item.get('value', '')}"
            for item in memories
            if item.get("value")
        )
        if context:
            messages.append(
                {
                    "role": "system",
                    "content": f"Relevant remembered context: {context}",
                }
            )
    for item in conversation[-20:]:
        role = (
            "assistant"
            if item.get("speaker") in {"assistant", "saanidhya"}
            else "user"
        )
        content = item.get("text")
        if isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content.strip()})
    messages.append({"role": "user", "content": transcript.strip()})
    return messages
