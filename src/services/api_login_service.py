# Importações de bibliotecas
from flask import current_app
from typing import Dict, Any
import requests

class APILoginService:

    @classmethod
    def authenticate(cls, username: str, password_attempt: str) -> Dict[str, Any]:
        try:
            payload = {"username": username, "password": password_attempt}
            response = requests.post(f"{current_app.config['BACKEND_URL']}/v1/login/authenticate", data=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def get_user_data(cls, username: str) -> Dict[str, Any]:
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/login/{username}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e