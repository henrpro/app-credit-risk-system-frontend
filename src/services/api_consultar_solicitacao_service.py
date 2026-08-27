# Importações de bibliotecas
from flask import current_app
import requests


class APIConsultarSolicitacaoService:

    @classmethod
    def obtem_solicitacoes_pendentes(cls, payload: dict):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/consultar-solicitacao/obtem-solicitacoes-pendentes", params=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def atualizar_status_aprovacao_pendente(cls, payload: dict):
        try:
            response = requests.post(f"{current_app.config['BACKEND_URL']}/v1/consultar-solicitacao/atualizar-status-aprovacao-pendente", json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e

    @classmethod
    def atualizar_status_cancelar_solicitacao(cls, payload: dict):
        try:
            response = requests.post(f"{current_app.config['BACKEND_URL']}/v1/consultar-solicitacao/atualizar-status-cancelar-solicitacao", json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e