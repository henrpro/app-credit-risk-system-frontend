# Diretrizes de Qualidade e Estilo de Código — CRS Frontend

Este documento estabelece as regras de qualidade, estética de código e boas práticas de engenharia de software a serem seguidas estritamente em todo o front-end do CRS.

---

## 1. Regra de Ouro das Importações (Pirâmide Invertida)

Cada arquivo Python do frontend deve agrupar seus imports em dois blocos, ordenados estritamente do **mais longo para o mais curto** em quantidade de caracteres por linha:

```python
# Importações do projeto
from services.api_grupos_economicos_service import APIGruposEconomicosService

# Importações de bibliotecas
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user
```

> **Atenção:**
> - Nunca misture bibliotecas externas com módulos internos do projeto.
> - O bloco `# Importações do projeto` sempre antecede o bloco `# Importações de bibliotecas`.
> - Verifique visualmente o formato de pirâmide invertida (funil) em cada bloco.

---

## 2. Divisores de Seção

- Utilize linhas de comentário no padrão `# ______________________________ Nome_Da_Secao ______________________________`.
- Mantenha espaçamento consistente de duas linhas vazias antes e depois de cada bloco de rota ou classe.
- Exemplo:
  ```python
  # ______________________________ Geral _______________________________________


  # ______________________________ Cadastrar Grupo ______________________________


  # ______________________________ Consultar Grupo ______________________________
  ```

---

## 3. Lógica Linear e Proibição de Funções Aninhadas

- **Lógica Plana e Sequencial**: O fluxo deve ser claro e linear de cima para baixo. Evite if/else profundamente aninhados.
- **Sem Nested Functions**: NUNCA declare `def` dentro de outro `def`. Funções auxiliares devem ser declaradas no escopo do módulo ou em utilitários dedicados.
- **Comentários de Fluxo Narrativo**: Utilize comentários que expliquem a progressão sequencial do algoritmo:
  ```python
  # Começamos buscando o grupo selecionado e seus dados
  grupo_selecionado = request.form.get('dsGrupo', '').strip()

  # Depois pegamos os dados dos emissores
  cnpjs = request.form.getlist('cnpjEmissor[]')
  nomes = request.form.getlist('nomeEmissor[]')

  # Iteramos pelos emissores e montamos o payload
  emissores = []
  for i, nome in enumerate(nomes):
      ...
  ```

---

## 4. Sanitização e Extração Segura de Formulários

- Trate todo dado recebido de `request.form` com `.strip()` e sanitização contra valores vazios, `'nan'`, `'none'`, `'null'`.
- Converta flags booleanas para inteiros (`1` ou `0`):
  ```python
  'icHolding': int(is_holdings[i] == 'sim')
  ```
- Campos numéricos e IDs devem ser validados antes de `int()` ou `float()`:
  ```python
  id_grupo = int(request.form.get('idGrupo', '').strip()) if request.form.get('idGrupo', '').strip().isdigit() else None
  ```
- Trate campos monetários ou percentuais que possam vir com vírgula:
  ```python
  vl_pc_consumo = float(vl_pc_consumo.replace(',', '.'))
  ```

---

## 5. Padrão de Flash Messages e Redirecionamento

- Toda operação de escrita (`POST`) deve envolver sua lógica em `try...except Exception as e:`.
- Notifique o usuário com mensagens claras usando `flash(mensagem, categoria)`:
  - Sucesso: `flash("Grupo econômico cadastrado com sucesso!", "success")`
  - Erro: `flash(f"Erro ao cadastrar grupo econômico: {str(e)}", "error")`
  - Aviso: `flash("Selecione um grupo econômico para continuar.", "warning")`
  - Informação: `flash("Solicitação cancelada com sucesso.", "info")`
- Sempre encerre fluxos de mutação com `redirect(url_for('<blueprint>.<rota>'))`.

---

## 6. Endpoints de API Assíncrona (`/api/...`)

- Endpoints internos da blueprint para alimentar selects dinâmicos, autocompletes ou modais assíncronos devem retornar JSON padronizado:
  ```python
  @grupos_economicos_blueprint.route('/api/emissores-oc3', methods=['GET'])
  @login_required
  def api_obtem_emissores_oc3():
      try:
          filtros = request.args.to_dict()
          dados = APIGruposEconomicosService.obtem_emissores_oc3(filtros=filtros)
          return jsonify({"success": True, "data": dados}), 200
      except Exception as e:
          return jsonify({"success": False, "error": str(e), "data": []}), 500
  ```

---

## 7. Anti-Patterns Proibidos no Frontend

❌ Declarar funções aninhadas (`nested functions` ou closures).  
❌ Fazer chamadas `requests` diretas dentro de `routes.py` sem passar pelo `APINomeModuloService`.  
❌ Inserir código SQL diretamente no frontend.  
❌ Deixar de sanitizar inputs de formulário (`.strip()`, conversão de tipos e checagem de nulos).  
❌ Esquecer de proteger rotas com `@login_required`.  
❌ Misturar imports sem separar os blocos de projeto e bibliotecas na ordem da pirâmide invertida.  
❌ Hardcodar URLs de backend em vez de usar `current_app.config['BACKEND_URL']`.  
