document.addEventListener('DOMContentLoaded', function () {
    // -------------------------------------------------------------------------
    // 1. UTILITÁRIOS DE FORMATAÇÃO
    // -------------------------------------------------------------------------
    function parseVal(val) {
        if (val === null || val === undefined || val === '') return 0;
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        let s = String(val).trim();
        if (s === '') return 0;
        if (s.includes(',')) {
            s = s.replace(/\./g, '').replace(',', '.');
        }
        const num = parseFloat(s);
        return isNaN(num) ? 0 : num;
    }

    function formatNumber(num) {
        if (isNaN(num) || num === null || num === undefined) num = 0;
        return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatCurrency(num) {
        return `R$ ${formatNumber(num)}`;
    }

    // -------------------------------------------------------------------------
    // 2. FILTRAGEM EM TEMPO REAL (BUSCA + STATUS)
    // -------------------------------------------------------------------------
    const inputFiltro = document.getElementById('filtroHistorico');
    const selectStatus = document.getElementById('filtroStatus');
    const contadorCasos = document.getElementById('contadorCasos');
    const tabelaRows = document.querySelectorAll('.historico-row');
    const emptyFiltro = document.getElementById('emptyFiltroHistorico');

    function aplicarFiltros() {
        const termo = (inputFiltro ? inputFiltro.value : '').toLowerCase().trim();
        const statusSelecionado = (selectStatus ? selectStatus.value : '').toLowerCase().trim();

        let visiveis = 0;

        tabelaRows.forEach(row => {
            const id = (row.dataset.id || '').toLowerCase();
            const grupo = (row.dataset.grupo || '').toLowerCase();
            const nome = (row.dataset.nome || '').toLowerCase();
            const profile = (row.dataset.profile || '').toLowerCase();
            const evento = (row.dataset.evento || '').toLowerCase();
            const status = (row.dataset.status || '').toLowerCase();
            const alcada = (row.dataset.alcada || '').toLowerCase();

            const textoCompleto = `${id} ${grupo} ${nome} ${profile} ${evento} ${status} ${alcada}`;
            const matchesTermo = !termo || textoCompleto.includes(termo);
            const matchesStatus = !statusSelecionado || status === statusSelecionado;

            if (matchesTermo && matchesStatus) {
                row.style.display = '';
                visiveis++;
            } else {
                row.style.display = 'none';
            }
        });

        if (contadorCasos) {
            contadorCasos.textContent = visiveis;
        }

        if (emptyFiltro) {
            if (visiveis === 0 && tabelaRows.length > 0) {
                emptyFiltro.classList.remove('d-none');
            } else {
                emptyFiltro.classList.add('d-none');
            }
        }
    }

    if (inputFiltro) inputFiltro.addEventListener('input', aplicarFiltros);
    if (selectStatus) selectStatus.addEventListener('change', aplicarFiltros);

    // -------------------------------------------------------------------------
    // 3. MODAL DE DETALHES DA SOLICITAÇÃO
    // -------------------------------------------------------------------------
    const modalEl = document.getElementById('modalDetalhesSolicitacao');
    const bsModal = modalEl ? new bootstrap.Modal(modalEl) : null;

    const modalIdDisplay = document.getElementById('modalIdSolicitacaoDisplay');
    const modalSubtituloDisplay = document.getElementById('modalSubtituloDisplay');
    const modalLoader = document.getElementById('modalDetalhesLoader');
    const modalError = document.getElementById('modalDetalhesError');
    const modalErrorMessage = document.getElementById('modalDetalhesErrorMessage');
    const modalContent = document.getElementById('modalDetalhesContent');

    // Métricas de Resumo
    const modalResumoGrupo = document.getElementById('modalResumoGrupo');
    const modalResumoMesa = document.getElementById('modalResumoMesa');
    const modalResumoEvento = document.getElementById('modalResumoEvento');
    const modalResumoData = document.getElementById('modalResumoData');
    const modalResumoRating = document.getElementById('modalResumoRating');
    const modalResumoShare = document.getElementById('modalResumoShare');

    // Tabelas do Grupo
    const tabelaGrupoTodasMesasBody = document.querySelector('#tabelaGrupoTodasMesas tbody');
    const containerGrupoMetaTodas = document.getElementById('containerGrupoMetaTodas');
    const tabelaGrupoTodasMesasMetaBody = document.querySelector('#tabelaGrupoTodasMesasMeta tbody');

    const tabelaGrupoPorMesaBody = document.querySelector('#tabelaGrupoPorMesa tbody');
    const containerGrupoMetaPorMesa = document.getElementById('containerGrupoMetaPorMesa');
    const tabelaGrupoPorMesaMetaBody = document.querySelector('#tabelaGrupoPorMesaMeta tbody');

    // Emissores
    const modalQtdEmissores = document.getElementById('modalQtdEmissores');
    const modalEmissoresContainer = document.getElementById('modalEmissoresContainer');

    function renderTabelaPrazos(linhas, isPrivateMarkets) {
        if (!Array.isArray(linhas) || linhas.length === 0) {
            return `<tr><td colspan="4" class="text-center text-muted py-3">Nenhum limite registrado</td></tr>`;
        }

        return linhas.map(l => {
            const prazo = l.vlPrazo !== undefined ? `${l.vlPrazo} ano(s)` : '-';
            const terc = parseVal(l.vlTerceiros);
            const rt = parseVal(l.vlReservaTecnica);
            const multimesas = parseVal(l.vlMultimesas);
            const valRtMult = (l.vlMultimesas !== undefined) ? multimesas : rt;
            const total = terc + valRtMult;

            return `
                <tr>
                    <td class="td-prazo">${prazo}</td>
                    <td class="td-val text-end fw-bold">${formatNumber(total)}</td>
                    <td class="td-val text-end text-muted">${formatNumber(terc)}</td>
                    <td class="td-val text-end text-muted">${formatNumber(valRtMult)}</td>
                </tr>
            `;
        }).join('');
    }

    function renderTabelaPorMesa(linhas) {
        if (!Array.isArray(linhas) || linhas.length === 0) {
            return `<tr><td colspan="4" class="text-center text-muted py-3">Nenhum limite registrado</td></tr>`;
        }

        return linhas.map(l => {
            const mesa = l.cdMesa || '-';
            const prazo = l.vlPrazo !== undefined ? `${l.vlPrazo} ano(s)` : '-';
            const terc = parseVal(l.vlTerceiros);
            const valRtMult = (l.vlMultimesas !== undefined) ? parseVal(l.vlMultimesas) : parseVal(l.vlReservaTecnica);

            return `
                <tr>
                    <td class="fw-semibold"><i class="bi bi-diagram-3 text-muted me-1"></i>${mesa}</td>
                    <td class="td-prazo">${prazo}</td>
                    <td class="td-val text-end text-muted">${formatNumber(terc)}</td>
                    <td class="td-val text-end text-muted">${formatNumber(valRtMult)}</td>
                </tr>
            `;
        }).join('');
    }

    const btnsAbrirDetalhes = document.querySelectorAll('.btn-abrir-detalhes');
    btnsAbrirDetalhes.forEach(btn => {
        btn.addEventListener('click', function () {
            const idSolicitacao = btn.dataset.id;
            const dsGrupo = btn.dataset.grupo || 'Grupo Econômico';
            const dsEvento = btn.dataset.evento || '';
            const dsStatus = btn.dataset.status || '';
            const dsMesa = btn.dataset.mesa || '';
            const dtSolicitacao = btn.dataset.data || '';

            if (modalIdDisplay) modalIdDisplay.textContent = `#${idSolicitacao}`;
            if (modalSubtituloDisplay) modalSubtituloDisplay.textContent = `${dsGrupo} • ${dsEvento}`;

            // Exibe loader e abre modal
            if (modalLoader) modalLoader.classList.remove('d-none');
            if (modalError) modalError.classList.add('d-none');
            if (modalContent) modalContent.classList.add('d-none');

            if (bsModal) bsModal.show();

            // Chamada à API de detalhes
            fetch(`/historico-casos/api/detalhes-solicitacao/${idSolicitacao}`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                    return res.json();
                })
                .then(resData => {
                    if (!resData.success || !resData.data) {
                        throw new Error(resData.message || 'Dados da solicitação não encontrados.');
                    }

                    const d = resData.data;
                    const isPrivateMarkets = (d.cdMesa || dsMesa || '').toUpperCase().includes('PRIVATE MARKETS');
                    const labelRt = isPrivateMarkets ? 'Multimesas' : 'Reserva Técnica';

                    // Atualiza labels de RT/Multimesas nos cabeçalhos da tabela do modal
                    document.querySelectorAll('.modal-th-rt').forEach(el => {
                        el.textContent = labelRt;
                    });

                    // 1. Preenche Resumo Superior
                    if (modalResumoGrupo) modalResumoGrupo.textContent = d.dsGrupo || dsGrupo;
                    if (modalResumoMesa) modalResumoMesa.textContent = d.cdMesa || dsMesa || 'Mesa não informada';
                    if (modalResumoEvento) modalResumoEvento.textContent = d.dsTipoEvento || dsEvento;
                    if (modalResumoData) modalResumoData.textContent = dtSolicitacao ? `Solicitado em ${dtSolicitacao}` : '-';
                    if (modalResumoRating) modalResumoRating.textContent = d.cdRatingGrupo || '-';
                    
                    let shareStr = '-';
                    if (d.vlShareDividaGrupo !== null && d.vlShareDividaGrupo !== undefined) {
                        const valShare = parseFloat(d.vlShareDividaGrupo);
                        shareStr = !isNaN(valShare) ? `${(valShare > 1 ? valShare : valShare * 100).toFixed(2)}%` : '-';
                    }
                    if (modalResumoShare) modalResumoShare.textContent = shareStr;

                    // 2. Preenche Visão Consolidada do Grupo - Todas as Mesas
                    if (tabelaGrupoTodasMesasBody) {
                        tabelaGrupoTodasMesasBody.innerHTML = renderTabelaPrazos(d.limitesGrupoConsolidadoSemMeta, isPrivateMarkets);
                    }

                    // Limites com Meta (Todas as Mesas)
                    if (Array.isArray(d.limitesGrupoConsolidadoComMeta) && d.limitesGrupoConsolidadoComMeta.length > 0) {
                        if (containerGrupoMetaTodas) containerGrupoMetaTodas.classList.remove('d-none');
                        if (tabelaGrupoTodasMesasMetaBody) {
                            tabelaGrupoTodasMesasMetaBody.innerHTML = renderTabelaPrazos(d.limitesGrupoConsolidadoComMeta, isPrivateMarkets);
                        }
                    } else {
                        if (containerGrupoMetaTodas) containerGrupoMetaTodas.classList.add('d-none');
                    }

                    // 3. Preenche Visão Consolidada do Grupo - Por Mesa
                    if (tabelaGrupoPorMesaBody) {
                        tabelaGrupoPorMesaBody.innerHTML = renderTabelaPorMesa(d.limitesGrupoPorMesaSemMeta);
                    }

                    // Limites com Meta (Por Mesa)
                    if (Array.isArray(d.limitesGrupoPorMesaComMeta) && d.limitesGrupoPorMesaComMeta.length > 0) {
                        if (containerGrupoMetaPorMesa) containerGrupoMetaPorMesa.classList.remove('d-none');
                        if (tabelaGrupoPorMesaMetaBody) {
                            tabelaGrupoPorMesaMetaBody.innerHTML = renderTabelaPorMesa(d.limitesGrupoPorMesaComMeta);
                        }
                    } else {
                        if (containerGrupoMetaPorMesa) containerGrupoMetaPorMesa.classList.add('d-none');
                    }

                    // 4. Preenche Emissores do Grupo
                    const emissores = Array.isArray(d.emissores) ? d.emissores : [];
                    if (modalQtdEmissores) modalQtdEmissores.textContent = emissores.length;

                    if (modalEmissoresContainer) {
                        if (emissores.length === 0) {
                            modalEmissoresContainer.innerHTML = '<div class="text-muted p-3 text-center">Nenhum emissor cadastrado para esta solicitação.</div>';
                        } else {
                            modalEmissoresContainer.innerHTML = emissores.map((e, idx) => {
                                let shareEmissorStr = '-';
                                if (e.vlShareDivida !== null && e.vlShareDivida !== undefined) {
                                    const v = parseFloat(e.vlShareDivida);
                                    shareEmissorStr = !isNaN(v) ? `${(v > 1 ? v : v * 100).toFixed(2)}%` : '-';
                                }

                                const linhasSemMetaHtml = renderTabelaPrazos(e.limitesConsolidadoSemMeta, isPrivateMarkets);
                                const hasMeta = Array.isArray(e.limitesConsolidadoComMeta) && e.limitesConsolidadoComMeta.length > 0;
                                const linhasComMetaHtml = hasMeta ? renderTabelaPrazos(e.limitesConsolidadoComMeta, isPrivateMarkets) : '';

                                return `
                                    <div class="modal-emissor-card">
                                        <div class="modal-emissor-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                                            <div class="d-flex align-items-center gap-2">
                                                <i class="bi bi-building text-accent"></i>
                                                <h6 class="modal-emissor-title mb-0">Emissor #${idx + 1}: ${e.dsEmissor || 'Emissor'}</h6>
                                            </div>
                                            <div class="d-flex align-items-center gap-2">
                                                <span class="badge-emissor-rating">
                                                    <i class="bi bi-star-fill me-1"></i>Rating: ${e.cdRating || '-'}
                                                </span>
                                                <span class="badge-emissor-share">
                                                    <i class="bi bi-pie-chart-fill me-1"></i>Share: ${shareEmissorStr}
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Tabela de Limites do Emissor -->
                                        <div class="table-responsive mb-2">
                                            <table class="table modal-detail-table align-middle">
                                                <thead>
                                                    <tr>
                                                        <th class="th-center" style="width: 15%;">Prazo</th>
                                                        <th class="th-val text-end" style="width: 28%;">Total</th>
                                                        <th class="th-val text-end" style="width: 28%;">Terceiros</th>
                                                        <th class="th-val text-end modal-th-rt" style="width: 29%;">${labelRt}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${linhasSemMetaHtml}
                                                </tbody>
                                            </table>
                                        </div>

                                        ${hasMeta ? `
                                            <div class="mt-3">
                                                <div class="d-flex align-items-center gap-2 mb-2">
                                                    <span class="badge bg-warning-subtle text-warning border border-warning px-2 py-1 small">
                                                        <i class="bi bi-bullseye me-1"></i>Limite Meta Aprovado
                                                    </span>
                                                </div>
                                                <div class="table-responsive">
                                                    <table class="table modal-detail-table align-middle">
                                                        <thead>
                                                            <tr>
                                                                <th class="th-center" style="width: 15%;">Prazo</th>
                                                                <th class="th-val text-end" style="width: 28%;">Total Meta</th>
                                                                <th class="th-val text-end" style="width: 28%;">Terceiros Meta</th>
                                                                <th class="th-val text-end modal-th-rt" style="width: 29%;">${labelRt} Meta</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${linhasComMetaHtml}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('');
                        }
                    }

                    // Exibe o conteúdo e oculta loader
                    if (modalLoader) modalLoader.classList.add('d-none');
                    if (modalContent) modalContent.classList.remove('d-none');
                })
                .catch(err => {
                    console.error("Erro ao carregar detalhes do histórico:", err);
                    if (modalLoader) modalLoader.classList.add('d-none');
                    if (modalErrorMessage) modalErrorMessage.textContent = err.message || 'Erro ao carregar detalhes da solicitação.';
                    if (modalError) modalError.classList.remove('d-none');
                });
        });
    });
});

