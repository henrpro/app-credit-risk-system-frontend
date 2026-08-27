# Importações de bibliotecas
from flask import current_app
import requests


class APIMapeamentosService:

    # ________________________________ Mapeamento Managers ______________________________

    @classmethod
    def consultar_mapeamentos_managers(cls):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/consultar-mapeamentos-managers")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def consultar_managers_sem_mapeamento(cls):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/consultar-managers-sem-mapeamento")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def salvar_mapeamento_manager(cls, payload: dict):
        try:
            response = requests.post(
                f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/salvar-mapeamento-manager",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e

    @classmethod
    def deletar_mapeamento_manager(cls, payload: dict):
        try:
            response = requests.post(
                f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/deletar-mapeamento-manager",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e


    # ________________________________ Mapeamento Tipo Produto ______________________________

    @classmethod
    def consultar_mapeamentos_produtos(cls):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/consultar-mapeamentos-produtos")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def consultar_produtos_sem_mapeamento(cls):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/consultar-produtos-sem-mapeamento")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def salvar_mapeamento_produto(cls, payload: dict):
        try:
            response = requests.post(
                f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/salvar-mapeamento-produto",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e

    @classmethod
    def deletar_mapeamento_produto(cls, payload: dict):
        try:
            response = requests.post(
                f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/deletar-mapeamento-produto",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e


    # ________________________________ Mapeamento Ativo Consumo ______________________________

    @classmethod
    def consultar_mapeamentos_ativos(cls):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/consultar-mapeamentos-ativos")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def consultar_ativos_sem_mapeamento(cls):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/consultar-ativos-sem-mapeamento")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def consultar_emissores_cadastrados(cls):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/consultar-emissores-cadastrados")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def salvar_mapeamento_ativo(cls, payload: dict):
        try:
            response = requests.post(
                f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/salvar-mapeamento-ativo",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e

    @classmethod
    def deletar_mapeamento_ativo(cls, payload: dict):
        try:
            response = requests.post(
                f"{current_app.config['BACKEND_URL']}/v1/mapeamentos/deletar-mapeamento-ativo",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e
