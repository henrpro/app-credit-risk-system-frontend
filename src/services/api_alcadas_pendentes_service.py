# Importações de bibliotecas
from flask import current_app
import requests


class APIAlcadasPendentesService:

    @classmethod
    def consultar_alcadas_pendentes(cls, payload: dict = None):
        try:
            response = requests.get(
                f"{current_app.config['BACKEND_URL']}/v1/alcadas-pendentes/consultar-alcadas-pendentes",
                params=payload or {}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def obtem_dados_solicitacao(cls, payload: dict):
        try:
            response = requests.get(
                f"{current_app.config['BACKEND_URL']}/v1/alcadas-pendentes/obtem-dados-solicitacao",
                params=payload
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def responder_alcada(cls, payload: dict):
        try:
            response = requests.post(
                f"{current_app.config['BACKEND_URL']}/v1/alcadas-pendentes/responder-alcada",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e
