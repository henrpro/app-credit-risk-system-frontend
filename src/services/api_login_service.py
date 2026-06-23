from typing import Dict, Any

class APILoginService:
    @staticmethod
    def authenticate(username: str, password_attempt: str) -> Dict[str, Any]:
        """
        Simula uma chamada de API para autenticação de usuário.
        Usuário de teste: 'Teste' | Senha: '123'
        """
        if username == 'Teste' and password_attempt == '123':
            return {
                'success': True,
                'cdGrupo': 'Administrador'
            }
        
        return {
            'success': False,
            'cdGrupo': None
        }

    @staticmethod
    def get_user_data(username: str) -> Dict[str, Any]:
        """
        Simula a busca de dados do usuário na API.
        """
        if username == 'Teste':
            return {
                'cdPassword': '123',
                'cdGrupo': 'Administrador'
            }
            
        return {
            'cdPassword': None,
            'cdGrupo': None
        }
