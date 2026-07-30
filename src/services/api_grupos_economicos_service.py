

def get_lista_grupos_economicos():
    return ['AEGEA', 'COSAN', 'GRUPO TESTE']


def get_grupo_economicos():
    return {
        'dsNome': 'GRUPO TESTE',
        'idEmissor': [1,2,3,4,5,6,7],
        'dsEmissor': ['Holding 1', 'Holding 2', 'Emissor 1', 'Emissor 2', 'Emissor 3', 'Emissor 4', 'Emissor 5'],
        'icHolding': [1, 1, 0, 0, 0, 0, 0],
        'icConsomeHolding': [0, 0, 1, 1, 1, 0, 0],
        'idEmissorHoldingConsumo': [None, None, 1, 1, 2, None, None],
        'dsSetor': ['Energia', 'Energia', 'Açucar e Álcool', 'O&G', 'Saneamento', 'Energia', 'Energia'],
        'cdEmissorOC3': ['TESTE1', 'TESTE2', ['TESTE3', 'TESTE4'], 'TESTE5', 'TESTE6', 'TESTE7', 'TESTE8'],
        'cdEmissorOC3': ['TESTE1', 'TESTE2', 'TESTE5', ['TESTE3', 'TESTE4'], 'TESTE6', 'TESTE7', 'TESTE8'],
        'cdListaPapeis': [
            {'Papel1': 1, 'Papel2': 1}, 
            {'Papel3': 1},
            {'Papel4': 1, 'Papel5': 1},
            {'Papel6': 1},
            {'Papel7': 1, 'Papel8': 1},
            {'Papel9': 1},
            {'Papel10': 1, 'Papel11': 0.5}
        ]
    }