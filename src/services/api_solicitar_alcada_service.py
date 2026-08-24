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
    def get_tipos_de_eventos_cadastrados(self):
        try:
            response = requests.get(f"{current_app.config['BACKEND_URL']}/v1/solicitar-alcada/obtem-tipos-eventos")
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