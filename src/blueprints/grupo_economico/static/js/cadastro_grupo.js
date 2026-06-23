document.addEventListener('DOMContentLoaded', function() {
  const btnAdd = document.getElementById('btnAdicionarEmissor');
  const container = document.getElementById('emissoresContainer');

  btnAdd.addEventListener('click', function() {
    let setorOptionsHtml = '<option value="" disabled selected>Selecione o setor...</option>';
    if (typeof setoresOptions !== 'undefined') {
      setoresOptions.forEach(setor => {
        setorOptionsHtml += `<option value="${setor}">${setor}</option>`;
      });
    }

    const template = `
      <div class="emissor-item border rounded p-3 mb-3 position-relative">
        <button type="button" class="btn-close btn-remover position-absolute top-0 end-0 m-2" aria-label="Close"></button>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label form-label-custom">Razão Social</label>
            <input type="text" class="form-control" name="emissor_razao[]" placeholder="Razão social da empresa">
          </div>
          <div class="col-md-6">
            <label class="form-label form-label-custom">CNPJ <span class="text-danger">*</span></label>
            <input type="text" class="form-control" name="emissor_cnpj[]" required placeholder="00.000.000/0000-00">
          </div>
          <div class="col-md-4">
            <label class="form-label form-label-custom">Setor de Atuação</label>
            <select class="form-select custom-select-icon" name="emissor_setor[]" required>
              ${setorOptionsHtml}
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label form-label-custom">É Holding? <span class="text-danger">*</span></label>
            <select class="form-select custom-select-icon" name="emissor_holding[]" required>
              <option value="" disabled selected>Selecione...</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label form-label-custom">Código OC3</label>
            <input type="text" class="form-control" name="emissor_oc3[]">
          </div>
          <div class="col-md-2">
            <label class="form-label form-label-custom">Código CRIMS</label>
            <input type="text" class="form-control" name="emissor_crims[]">
          </div>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', template);
  });

  container.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-remover')) {
      e.target.closest('.emissor-item').remove();
    }
  });
});
