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

    if (btnAdicionar && container && template) {
        btnAdicionar.addEventListener('click', function() {
            // Clona o conteúdo do template
            const clone = template.content.cloneNode(true);
            
            // Configura o botão de remover o emissor adicionado
            const btnRemove = clone.querySelector('.remove-emissor-btn');
            if (btnRemove) {
                btnRemove.addEventListener('click', function(e) {
                    e.target.closest('.emissor-block').remove();
                    updateHoldingsDropdowns(); // Atualiza a lista quando um emissor for removido
                });
            }

            // Adiciona listeners para atualizar os dropdowns dinamicamente
            const nameInput = clone.querySelector('input[name="nomeEmissor[]"]');
            const isHoldingSelect = clone.querySelector('select[name="isHolding[]"]');
            
            if (nameInput) {
                nameInput.addEventListener('input', updateHoldingsDropdowns);
            }
            if (isHoldingSelect) {
                isHoldingSelect.addEventListener('change', updateHoldingsDropdowns);
            }

            // Adiciona o novo bloco ao container
            container.appendChild(clone);
            updateHoldingsDropdowns(); // Atualiza os dropdowns para incluir o novo bloco
        });
    }
});
