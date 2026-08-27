# Importações de bibliotecas
from flask import current_app
import requests


class APIGestaoDeUsuariosService:

    @classmethod
    def get_usuarios_cadastrados(cls):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/gestao-de-usuarios/consultar-usuarios-cadastrados")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def get_dados_usuario(cls, cd_user: str):
        try:
            response = requests.get(
                f"{current_app.config['BACKEND_URL']}/v1/gestao-de-usuarios/consultar-usuario",
                params={'cdUser': cd_user}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def registrar_usuario(cls, payload: dict):
        try:
            response = requests.post(f"{current_app.config['BACKEND_URL']}/v1/gestao-de-usuarios/cadastrar-usuario", json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e

    @classmethod
    def deletar_usuario(cls, payload: dict):
        try:
            response = requests.post(f"{current_app.config['BACKEND_URL']}/v1/gestao-de-usuarios/deletar-usuario", json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e