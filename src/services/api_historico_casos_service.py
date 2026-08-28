# Importações de bibliotecas
from flask import current_app
import requests


class APIHistoricoCasosService:

    @classmethod
    def obtem_solicitacoes_finalizadas(cls, payload: dict):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/historico-casos/obtem-solicitacoes-finalizadas", params=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def obtem_dados_solicitacao(cls, payload: dict):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/historico-casos/obtem-dados-solicitacao", params=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e
