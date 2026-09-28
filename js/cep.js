// Consulta pública ViaCEP: apenas o CEP é enviado ao serviço.
// Integração independente da simulação de frete.
(() => {
  const form = document.getElementById('order-form');
  const fields = form.elements;
  const status = document.getElementById('cep-status');
  const mapping = { rua: 'logradouro', bairro: 'bairro', cidade: 'localidade', uf: 'uf' };
  let controller;
  let timer;
  let sequence = 0;
  let previousCep = fields.cep.value.replace(/\D/g, '');
  let completedCep = '';
  const filled = {};

  function cancel() {
    clearTimeout(timer);
    controller?.abort();
    sequence++;
    fields.cep.removeAttribute('aria-busy');
  }

  async function lookup() {
    const cep = fields.cep.value.replace(/\D/g, '');
    if (fields.entrega.value !== 'envio' || cep.length !== 8 || completedCep === cep) return;
    cancel();
    const request = sequence;
    controller = new AbortController();
    const snapshot = Object.fromEntries(
      Object.keys(mapping).map((key) => [key, fields[key].value])
    );
    fields.cep.setAttribute('aria-busy', 'true');
    status.textContent = 'Buscando endereço…';
    const requestController = controller;
    const timeout = setTimeout(() => requestController.abort(), 8000);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: controller.signal,
        referrerPolicy: 'no-referrer',
        credentials: 'omit',
      });
      if (!response.ok) throw new Error('Consulta indisponível');
      const data = await response.json();
      if (request !== sequence || fields.entrega.value !== 'envio') return;
      if (data.erro) {
        status.textContent =
          'CEP não encontrado. Confira os 8 dígitos ou preencha o endereço manualmente.';
        return;
      }
      if (
        !data.localidade ||
        !Array.from(fields.uf.options).some((option) => option.value === data.uf && option.value)
      )
        throw new Error('Resposta inválida');
      for (const [key, source] of Object.entries(mapping)) {
        // Preserva correções que o cliente fizer durante a consulta.
        if (fields[key].value !== snapshot[key]) continue;
        fields[key].value = typeof data[source] === 'string' ? data[source] : '';
        filled[key] = fields[key].value;
      }
      completedCep = cep;
      status.textContent =
        data.logradouro && data.bairro
          ? 'Endereço encontrado via ViaCEP. Confira os dados e informe o número e o complemento, se houver.'
          : 'CEP geral: complete os campos de rua e bairro que estiverem vazios e informe o número. Confira os demais dados.';
    } catch {
      if (request === sequence)
        status.textContent =
          'Não foi possível consultar o CEP. Preencha manualmente ou clique em buscar novamente.';
    } finally {
      clearTimeout(timeout);
      if (request === sequence) fields.cep.removeAttribute('aria-busy');
    }
  }

  fields.cep.addEventListener('input', () => {
    const cep = fields.cep.value.replace(/\D/g, '').slice(0, 8);
    fields.cep.value = cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
    if (cep === previousCep) return;
    previousCep = cep;
    cancel();
    completedCep = '';
    for (const key of Object.keys(mapping)) {
      if (filled[key] !== undefined && fields[key].value === filled[key]) fields[key].value = '';
      delete filled[key];
    }
    status.textContent =
      cep.length === 8
        ? 'Preparando consulta…'
        : 'Digite os 8 dígitos do CEP para buscar o endereço.';
    if (cep.length === 8) timer = setTimeout(lookup, 350);
  });
  fields.cep.addEventListener('blur', () => {
    if (!fields.cep.hasAttribute('aria-busy')) lookup();
  });
  document.getElementById('lookup-cep').addEventListener('click', () => {
    if (!fields.cep.reportValidity()) return;
    completedCep = '';
    lookup();
  });
  form.querySelectorAll('[name="entrega"]').forEach((input) =>
    input.addEventListener('change', () => {
      cancel();
      status.textContent = 'Digite os 8 dígitos do CEP para buscar o endereço.';
      if (fields.entrega.value === 'envio') {
        completedCep = '';
        lookup();
      }
    })
  );
})();
