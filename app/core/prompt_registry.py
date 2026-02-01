
import json
from pathlib import Path

REGISTRY_PATH = Path("prompts/registry.json")

def load_registry() -> dict:
    return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))

def get_prompt(step: str) -> tuple[str, str]:
    reg = load_registry()
    node = reg[step]
    return node["version"], node["template"]