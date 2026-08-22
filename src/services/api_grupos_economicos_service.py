# Importações de bibliotecas
from flask import current_app
import requests


class APIGruposEconomicosService:

    @classmethod
    def get_grupos_economicos_cadastrados(self):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/obtem-grupos-economicos-cadastrados")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def obtem_setores_cadastrados(self):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/obtem-setores-cadastrados")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def obtem_subsetores_cadastrados(self):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/obtem-subsetores-cadastrados")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def obtem_emissores_oc3(self, filtros: dict = None):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/obtem-emissores-oc3", params=filtros)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def obtem_emissores_crims(self, filtros: dict = None):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/obtem-emissores-crims", params=filtros)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def consultar_grupo_economico(self, filtros: dict = None):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/consultar-grupo-conomico", params=filtros)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def registrar_grupo_economico(self, payload: dict):
        try:
            response = requests.post(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/registrar-grupo-economico", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def atualizar_grupo_economico(self, payload: dict):
        try:
            response = requests.post(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/atualizar-grupo-economico", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def deletar_grupo_economico(self, payload: dict):
        try:
            response = requests.post(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/deletar-grupo-economico", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e
