# Importações de bibliotecas
from flask import current_app
import requests

class APISolicitarAlcadaService:

    @classmethod
    def get_grupos_economicos_cadastrados(self):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/grupos-economicos/obtem-grupos-economicos-cadastrados")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def get_tipos_de_eventos_cadastrados(cls, filtros: dict = None):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/solicitar-alcada/obtem-tipos-eventos", params=filtros)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def get_ratings_distintos_cadastrados(self):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/solicitar-alcada/obtem-ratings-distintos")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def get_limites_aprovados_grupo_economico(cls, filtros: dict = None):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/solicitar-alcada/limites-aprovados-grupo-economico", params=filtros)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def get_disponivel_flexibilizacao_grupo_economico(cls, filtros: dict = None):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/solicitar-alcada/disponivel-flexibilizacao-grupo-economico", params=filtros)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise e

    @classmethod
    def registrar_solicitacao_alcada(self, payload: dict):
        try:
            response = requests.post(f"{current_app.config['BACKEND_URL']}/v1/solicitar-alcada/insert-solicitacao-alcada", json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            raise Exception(response.text) from e