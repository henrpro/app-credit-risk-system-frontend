# Importações de bibliotecas
import json

def init_config():
    with open("config/config.local.json", "r", encoding="utf-8") as f:
        config = json.load(f)
    return config