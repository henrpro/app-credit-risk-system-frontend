document.addEventListener('DOMContentLoaded', function() {
    const btnAdicionar = document.getElementById('btnAdicionarEmissor');
    const container = document.getElementById('emissoresContainer');
    const template = document.getElementById('emissorTemplate');

    // Função para atualizar os dropdowns de "Holding de Consumo"
    function updateHoldingsDropdowns() {
        const allBlocks = document.querySelectorAll('.emissor-block');
        const holdings = [];
        
        // Coleta o nome de todos os emissores marcados como holding
        allBlocks.forEach(block => {
            const isHoldingSelect = block.querySelector('select[name="isHolding[]"]');
            const nameInput = block.querySelector('input[name="nomeEmissor[]"]');
            
            if (isHoldingSelect && isHoldingSelect.value === 'sim' && nameInput && nameInput.value.trim() !== '') {
                holdings.push(nameInput.value.trim());
            }
        });

        // Atualiza todos os dropdowns de consumo
        allBlocks.forEach(block => {
            const consumoSelect = block.querySelector('.select-holding-consumo');
            if (consumoSelect) {
                const currentValue = consumoSelect.value;
                
                // Limpa as opções mantendo apenas a opção "Nenhuma"
                consumoSelect.innerHTML = '<option value="">Nenhuma</option>';
                
                // Adiciona as holdings encontradas
                holdings.forEach(holdingName => {
                    const option = document.createElement('option');
                    option.value = holdingName;
                    option.textContent = holdingName;
                    consumoSelect.appendChild(option);
                });
                
                // Restaura o valor selecionado se ele ainda existir na lista
                if (holdings.includes(currentValue)) {
                    consumoSelect.value = currentValue;
                }
            }
        });
    }

    // Função para aplicar máscara de CNPJ
    function maskCNPJ(value) {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2') 
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') 
            .replace(/\.(\d{3})(\d)/, '.$1/$2') 
            .replace(/(\d{4})(\d)/, '$1-$2'); 
    }

    // Delegação de eventos para as máscaras (funciona para inputs criados dinamicamente)
    document.addEventListener('input', function(e) {
        if (e.target && e.target.classList.contains('cnpj-mask')) {
            e.target.value = maskCNPJ(e.target.value);
        }
    });

    if (btnAdicionar && container && template) {
        btnAdicionar.addEventListener('click', function() {
            const clone = template.content.cloneNode(true);
            const btnRemove = clone.querySelector('.remove-emissor-btn');
            if (btnRemove) {
                btnRemove.addEventListener('click', function(e) {
                    e.target.closest('.emissor-block').remove();
                    updateHoldingsDropdowns(); // Atualiza a lista quando um emissor for removido
                });
            }

            const nameInput = clone.querySelector('input[name="nomeEmissor[]"]');
            const isHoldingSelect = clone.querySelector('select[name="isHolding[]"]');
            
            if (nameInput) {
                nameInput.addEventListener('input', updateHoldingsDropdowns);
            }
            if (isHoldingSelect) {
                isHoldingSelect.addEventListener('change', updateHoldingsDropdowns);
            }

            container.appendChild(clone);
            updateHoldingsDropdowns(); // Atualiza os dropdowns para incluir o novo bloco
        });
    }

    // Lógica do Modal de Associação de Emissor
    const btnPesquisarEmissor = document.getElementById('btnPesquisarEmissor');
    const inputPesquisaEmissor = document.getElementById('inputPesquisaEmissor');
    const resultadosPesquisaEmissor = document.getElementById('resultadosPesquisaEmissor');

    if (btnPesquisarEmissor && resultadosPesquisaEmissor) {
        btnPesquisarEmissor.addEventListener('click', async function() {
            const query = inputPesquisaEmissor.value.trim();
            const listaResultados = document.getElementById('listaEmissoresResultados');
            
            if (!listaResultados) return;
            
            // Adiciona estado de carregamento
            btnPesquisarEmissor.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i> Pesquisando...';
            btnPesquisarEmissor.disabled = true;
            
            try {
                const response = await fetch(`/api/buscar-emissores?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                listaResultados.innerHTML = ''; // Limpa resultados anteriores
                
                if (data.length > 0) {
                    data.forEach((emissor, index) => {
                        const bgClass = index % 2 === 0 ? 'var(--color-bg-main)' : 'var(--color-bg-card)';
                        
                        const itemHtml = `
                            <label class="list-group-item d-flex gap-3 align-items-center" style="background-color: ${bgClass}; border-color: var(--color-border); cursor: pointer; transition: all 0.2s ease;">
                                <input class="form-check-input flex-shrink-0" type="checkbox" value="${emissor.codigo}" style="font-size: 1.2em;">
                                <span class="pt-1 form-checked-content" style="color: var(--color-text-main); font-family: 'ItauText', sans-serif;">
                                    <strong>${emissor.codigo}</strong> - ${emissor.nome}
                                </span>
                            </label>
                        `;
                        listaResultados.insertAdjacentHTML('beforeend', itemHtml);
                    });
                    resultadosPesquisaEmissor.style.display = 'block';
                } else {
                    listaResultados.innerHTML = `
                        <div class="p-4 text-center text-muted" style="font-family: 'ItauText', sans-serif;">
                            Nenhum emissor encontrado.
                        </div>
                    `;
                    resultadosPesquisaEmissor.style.display = 'block';
                }
            } catch (error) {
                console.error("Erro na busca de emissores:", error);
                alert("Erro ao buscar emissores. Tente novamente.");
            } finally {
                // Restaura botão
                btnPesquisarEmissor.innerHTML = '<i class="bi bi-search me-1"></i> Pesquisar';
                btnPesquisarEmissor.disabled = false;
            }
        });
    }

    // Limpa os dados do modal quando ele é fechado
    const modalAssociarEmissor = document.getElementById('modalAssociarEmissor');
    if (modalAssociarEmissor) {
        modalAssociarEmissor.addEventListener('hidden.bs.modal', function () {
            if (inputPesquisaEmissor) inputPesquisaEmissor.value = '';
            if (resultadosPesquisaEmissor) {
                resultadosPesquisaEmissor.style.display = 'none';
                // Desmarca todos os checkboxes para a próxima vez
                const checkboxes = resultadosPesquisaEmissor.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => cb.checked = false);
            }
        });
    }

    // Lógica do Modal Detalhes do Emissor (Organograma)
    const modalEmissorDetalhes = document.getElementById('modalEmissorDetalhes');
    if (modalEmissorDetalhes) {
        modalEmissorDetalhes.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            
            const nome = button.getAttribute('data-nome');
            const oc3 = button.getAttribute('data-oc3');
            const crims = button.getAttribute('data-crims');
            let papeis = {};
            try {
                papeis = JSON.parse(button.getAttribute('data-papeis') || '{}');
            } catch (e) {
                console.error("Erro ao fazer parse dos papeis", e);
            }
            
            document.getElementById('modalEmissorNome').textContent = nome;
            document.getElementById('modalEmissorOC3').textContent = oc3 && oc3 !== 'None' ? oc3 : 'N/A';
            document.getElementById('modalEmissorCRIMS').textContent = crims && crims !== 'None' ? crims : 'N/A';
            
            const tbody = document.getElementById('modalTabelaPapeis');
            tbody.innerHTML = '';
            
            if (Object.keys(papeis).length > 0) {
                for (const [papel, consumo] of Object.entries(papeis)) {
                    const tr = document.createElement('tr');
                    
                    const tdPapel = document.createElement('td');
                    tdPapel.textContent = papel;
                    tr.appendChild(tdPapel);
                    
                    const tdConsumo = document.createElement('td');
                    // Converte decimal para porcentagem (1 = 100%, 0.5 = 50%)
                    tdConsumo.textContent = (parseFloat(consumo) * 100).toFixed(0) + '%';
                    tr.appendChild(tdConsumo);
                    
                    tbody.appendChild(tr);
                }
            } else {
                tbody.innerHTML = '<tr><td colspan="2" class="text-muted" style="padding: 16px;">Nenhum papel de consumo associado.</td></tr>';
            }
        });
    }
});
