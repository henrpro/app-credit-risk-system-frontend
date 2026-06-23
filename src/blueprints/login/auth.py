# Importações do projeto
from services.api_login_service import APILoginService

# Importações de bibliotecas
from typing import Tuple, Optional
from flask_login import UserMixin

# Modelo de usuário
class User(UserMixin):
    def __init__(self, username: str, password: Optional[str], grupo: Optional[str]):
        self.id = username
        self.password = password
        self.grupo = grupo

    @staticmethod
    def authenticate_user(username: str, password_attempt: str) -> Tuple[bool, Optional[str]]:
        try:
            data = APILoginService.authenticate(username, password_attempt)
            if data.get('success'):
                return True, data.get('cdGrupo')
            return False, None
        except Exception:
            return False, None

    @staticmethod
    def get_user_data(username: str) -> Tuple[Optional[str], Optional[str]]:
        try:
            data = APILoginService.get_user_data(username)
            return data.get('cdPassword'), data.get('cdGrupo')
        except Exception:
            return None, None

    @staticmethod
    def get_login(username: str) -> 'User':
        password, grupo = User.get_user_data(username)
        return User(username, password, grupo)