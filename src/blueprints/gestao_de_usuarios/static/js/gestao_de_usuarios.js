document.addEventListener('DOMContentLoaded', function () {
    // Referências aos modais Bootstrap
    const modalUsuarioEl = document.getElementById('modalUsuario');
    const bsModalUsuario = modalUsuarioEl ? new bootstrap.Modal(modalUsuarioEl) : null;

    const modalExclusaoEl = document.getElementById('modalConfirmarExclusao');
    const bsModalExclusao = modalExclusaoEl ? new bootstrap.Modal(modalExclusaoEl) : null;

    // Referências do Formulário de Usuário
    const formUsuario = document.getElementById('formUsuario');
    const modalHeaderTitleText = document.getElementById('modalHeaderTitleText');
    const modalHeaderIcon = document.getElementById('modalHeaderIcon');
    const btnSalvarText = document.getElementById('btnSalvarText');
    const modalAlert = document.getElementById('modalAlert');

    const inputActionType = document.getElementById('inputActionType');
    const inputOriginalUser = document.getElementById('inputOriginalUser');
    const inputUser = document.getElementById('inputUser');
    const inputNome = document.getElementById('inputNome');
    const inputPassword = document.getElementById('inputPassword');
    const selectProfile = document.getElementById('selectProfile');
    const selectAlcadaAprovador = document.getElementById('selectAlcadaAprovador');
    const inputPesoAprovacao = document.getElementById('inputPesoAprovacao');
    const pesoRequiredAsterisk = document.getElementById('pesoRequiredAsterisk');

    // Botão Adicionar Novo Usuário
    const btnAbrirModalNovo = document.getElementById('btnAbrirModalNovoUsuario');
    if (btnAbrirModalNovo) {
        btnAbrirModalNovo.addEventListener('click', function () {
            abrirModalNovoUsuario();
        });
    }

    // Toggle de visualização da senha
    const btnTogglePassword = document.getElementById('btnTogglePassword');
    const iconTogglePassword = document.getElementById('iconTogglePassword');
    if (btnTogglePassword && inputPassword) {
        btnTogglePassword.addEventListener('click', function () {
            const isPassword = inputPassword.getAttribute('type') === 'password';
            inputPassword.setAttribute('type', isPassword ? 'text' : 'password');
            if (iconTogglePassword) {
                iconTogglePassword.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
            }
        });
    }

    // Controle dinâmico do campo "Peso" com base no "Aprovador de Alçada"
    function atualizarEstadoPeso() {
        if (!selectAlcadaAprovador || !inputPesoAprovacao) return;

        const alcadaValor = selectAlcadaAprovador.value;
        const temAlcada = alcadaValor && alcadaValor !== 'Nenhuma';

        if (temAlcada) {
            inputPesoAprovacao.disabled = false;
            inputPesoAprovacao.required = true;
            if (pesoRequiredAsterisk) pesoRequiredAsterisk.classList.remove('d-none');
        } else {
            inputPesoAprovacao.disabled = true;
            inputPesoAprovacao.required = false;
            inputPesoAprovacao.value = '';
            inputPesoAprovacao.classList.remove('is-invalid');
            if (pesoRequiredAsterisk) pesoRequiredAsterisk.classList.add('d-none');
        }
    }

    if (selectAlcadaAprovador) {
        selectAlcadaAprovador.addEventListener('change', atualizarEstadoPeso);
    }

    // Função para abrir modal em modo CRIAÇÃO
    function abrirModalNovoUsuario() {
        if (!formUsuario) return;

        formUsuario.reset();
        formUsuario.classList.remove('was-validated');
        if (modalAlert) {
            modalAlert.classList.add('d-none');
            modalAlert.textContent = '';
        }

        inputActionType.value = 'create';
        inputOriginalUser.value = '';
        inputUser.readOnly = false;

        modalHeaderTitleText.textContent = 'Adicionar Novo Usuário';
        modalHeaderIcon.className = 'bi bi-person-plus-fill';
        btnSalvarText.textContent = 'Salvar Usuário';

        if (iconTogglePassword) {
            iconTogglePassword.className = 'bi bi-eye';
        }
        if (inputPassword) {
            inputPassword.setAttribute('type', 'password');
        }

        if (selectAlcadaAprovador) {
            selectAlcadaAprovador.value = 'Nenhuma';
        }
        atualizarEstadoPeso();

        if (bsModalUsuario) {
            bsModalUsuario.show();
        }
    }

    // Função para abrir modal em modo EDIÇÃO
    async function abrirModalEditarUsuario(cdUser) {
        if (!formUsuario || !cdUser) return;

        formUsuario.reset();
        formUsuario.classList.remove('was-validated');
        if (modalAlert) {
            modalAlert.classList.add('d-none');
            modalAlert.textContent = '';
        }

        inputActionType.value = 'edit';
        inputOriginalUser.value = cdUser;

        modalHeaderTitleText.textContent = 'Alterar Usuário';
        modalHeaderIcon.className = 'bi bi-pencil-square';
        btnSalvarText.textContent = 'Atualizar Usuário';

        if (iconTogglePassword) {
            iconTogglePassword.className = 'bi bi-eye';
        }
        if (inputPassword) {
            inputPassword.setAttribute('type', 'password');
        }

        // Abre o modal
        if (bsModalUsuario) {
            bsModalUsuario.show();
        }

        // Carrega dados via API
        try {
            const response = await fetch(`/gestao-de-usuarios/api/consultar-usuario/${encodeURIComponent(cdUser)}`);
            const result = await response.json();

            if (result.success && result.data) {
                const u = result.data;
                inputUser.value = u.cdUser || cdUser;
                inputNome.value = u.dsNome || '';
                inputPassword.value = u.cdPassword || '';
                
                if (selectProfile) {
                    selectProfile.value = u.dsProfile || '';
                }

                if (selectAlcadaAprovador) {
                    selectAlcadaAprovador.value = u.dsAlcadaAprovador || 'Nenhuma';
                }

                atualizarEstadoPeso();

                if (u.dsAlcadaAprovador && u.dsAlcadaAprovador !== 'Nenhuma' && u.vlPesoAprovacao !== null && u.vlPesoAprovacao !== undefined) {
                    inputPesoAprovacao.value = u.vlPesoAprovacao;
                }
            } else {
                if (modalAlert) {
                    modalAlert.className = 'alert alert-warning mb-3';
                    modalAlert.textContent = result.message || 'Não foi possível obter todos os dados do usuário.';
                    modalAlert.classList.remove('d-none');
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            if (modalAlert) {
                modalAlert.className = 'alert alert-danger mb-3';
                modalAlert.textContent = 'Erro ao carregar dados do usuário do servidor.';
                modalAlert.classList.remove('d-none');
            }
        }
    }

    // Configuração dos botões "Alterar" na tabela
    document.querySelectorAll('.btn-alterar-usuario').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const cdUser = this.getAttribute('data-user');
            abrirModalEditarUsuario(cdUser);
        });
    });

    // Configuração dos botões "Excluir" na tabela
    const inputDeleteCdUser = document.getElementById('inputDeleteCdUser');
    const deleteUserDisplay = document.getElementById('deleteUserDisplay');
    const deleteNomeDisplay = document.getElementById('deleteNomeDisplay');

    document.querySelectorAll('.btn-excluir-usuario').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const cdUser = this.getAttribute('data-user');
            const dsNome = this.getAttribute('data-nome') || '';

            if (inputDeleteCdUser) inputDeleteCdUser.value = cdUser;
            if (deleteUserDisplay) deleteUserDisplay.textContent = cdUser;
            if (deleteNomeDisplay) deleteNomeDisplay.textContent = dsNome;

            if (bsModalExclusao) {
                bsModalExclusao.show();
            }
        });
    });

    // Validação e Envio do Formulário de Usuário
    if (formUsuario) {
        formUsuario.addEventListener('submit', function (event) {
            atualizarEstadoPeso();

            if (!formUsuario.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            formUsuario.classList.add('was-validated');
        });
    }

    // Filtro de Busca Dinâmica na Tabela
    const filtroInput = document.getElementById('filtroUsuariosTabela');
    const contadorUsuarios = document.getElementById('contadorUsuarios');
    const rows = document.querySelectorAll('.usuario-row');

    if (filtroInput) {
        filtroInput.addEventListener('input', function () {
            const termo = this.value.toLowerCase().trim();
            let visiveis = 0;

            rows.forEach(function (row) {
                const user = (row.getAttribute('data-user') || '').toLowerCase();
                const nome = (row.getAttribute('data-nome') || '').toLowerCase();
                const profile = (row.getAttribute('data-profile') || '').toLowerCase();

                if (user.includes(termo) || nome.includes(termo) || profile.includes(termo)) {
                    row.style.display = '';
                    visiveis++;
                } else {
                    row.style.display = 'none';
                }
            });

            if (contadorUsuarios) {
                contadorUsuarios.textContent = visiveis;
            }
        });
    }
});
