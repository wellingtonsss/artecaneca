// Solicitação local: nenhuma informação é armazenada ou enviada ao selecionar a foto.
const form = document.getElementById('order-form');
const fields = form.elements;
// O limite fica no HTML; o contador acompanha o mesmo valor.
function updatePhraseCount() {
  const phrase = fields.frase;
  if (phrase.value.length > phrase.maxLength) {
    phrase.value = phrase.value.slice(0, phrase.maxLength);
  }
  document.getElementById('phrase-count').textContent =
    `${phrase.value.length}/${phrase.maxLength}`;
}
fields.frase.addEventListener('input', updatePhraseCount);
window.addEventListener('pageshow', updatePhraseCount);
updatePhraseCount();
const shippingFields = document.getElementById('shipping-fields');
const photoInput = document.getElementById('photo');
const review = document.getElementById('review');
let previewUrl = '';
let orderText = '';
let freightEstimate = null;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Simulação editável, sem consulta aos Correios. Nunca representa cotação real.
function resetFreight() {
  freightEstimate = null;
  document.getElementById('freight-status').textContent = 'Preencha o CEP e clique em simular.';
}
fields.cep.addEventListener('input', resetFreight);
fields.quantidade.addEventListener('input', resetFreight);
document.getElementById('calculate-freight').addEventListener('click', () => {
  if (!fields.cep.reportValidity() || !fields.quantidade.reportValidity()) return;
  const settings = window.ARTE_CANECA?.frete;
  const base = Number(settings?.valorBase);
  const extra = Number(settings?.valorPorCanecaAdicional);
  if (!Number.isFinite(base) || !Number.isFinite(extra) || base < 0 || extra < 0) {
    resetFreight();
    document.getElementById('freight-status').textContent =
      'Simulação indisponível. O frete será confirmado pelo WhatsApp.';
    return;
  }
  freightEstimate = base + (Number(fields.quantidade.value) - 1) * extra;
  document.getElementById('freight-status').textContent =
    `Valor demonstrativo: ${currency.format(freightEstimate)}. Não é uma tarifa dos Correios. Frete real e prazo a confirmar.`;
});

for (const uf of 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(
  ' '
)) {
  fields.uf.add(new Option(uf, uf));
}

// Endereço só é obrigatório quando o cliente escolhe envio.
function updateDelivery() {
  resetFreight();
  const shipping = fields.entrega.value === 'envio';
  shippingFields.hidden = !shipping;
  shippingFields.disabled = !shipping;
  document.getElementById('pickup-note').hidden = shipping;
}
form
  .querySelectorAll('[name="entrega"]')
  .forEach((input) => input.addEventListener('change', updateDelivery));
updateDelivery();

function clearPhoto() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = '';
  photoInput.value = '';
  photoInput.setCustomValidity('');
  document.getElementById('preview-image').removeAttribute('src');
  document.getElementById('photo-preview').hidden = true;
  document.getElementById('photo-status').textContent = '';
}
document.getElementById('remove-photo').addEventListener('click', clearPhoto);
photoInput.addEventListener('change', () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = '';
  document.getElementById('photo-preview').hidden = true;
  photoInput.setCustomValidity('');
  const file = photoInput.files[0];
  const status = document.getElementById('photo-status');
  status.textContent = '';
  if (!file) return;
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  ) {
    clearPhoto();
    status.textContent = 'Escolha uma imagem JPG, PNG ou WebP de até 10 MB.';
    return;
  }
  previewUrl = URL.createObjectURL(file);
  const image = document.getElementById('preview-image');
  image.onerror = () => {
    clearPhoto();
    status.textContent = 'Não foi possível abrir essa imagem. Escolha outra foto.';
  };
  image.src = previewUrl;
  document.getElementById('photo-preview').hidden = false;
  status.textContent = `Selecionada: ${file.name}. Lembre-se de anexá-la no WhatsApp.`;
});

function value(name) {
  return fields[name].value.trim();
}

// O texto inclui apenas o endereço pertinente à opção de entrega atual.
function buildOrder() {
  const photo = photoInput.files[0];
  const lines = [
    '*SOLICITAÇÃO DE PEDIDO — ARTE CANECA*',
    '',
    `Cliente: ${value('cliente')}`,
    `WhatsApp: ${value('telefone')}`,
    '',
    '*PERSONALIZAÇÃO*',
    `Produto: ${fields.produto.selectedOptions[0].textContent}${fields.produto.value === 'outro' ? ' — ' + value('outroProduto') : ''}`,
    `Quantidade: ${value('quantidade')}`,
    `Nome no produto: ${value('nomeCaneca') || 'Sem nome'}`,
    `Frase: ${value('frase') || 'Sem frase'}`,
    `Foto: ${photo ? photo.name + ' (vou anexar nesta conversa)' : 'Sem foto'}`,
    `Detalhes: ${value('observacoes') || 'Nenhum detalhe adicional'}`,
    '',
    '*ENTREGA*',
  ];
  if (fields.entrega.value === 'envio') {
    lines.push(
      'Modalidade: envio pelos Correios',
      `Destinatário: ${value('destinatario')}`,
      `CEP: ${value('cep')}`,
      `Endereço: ${value('rua')}, ${value('numero')}`,
      `Complemento: ${value('complemento') || 'Sem complemento'}`,
      `Bairro: ${value('bairro')}`,
      `Cidade/UF: ${value('cidade')} / ${value('uf')}`,
      ...(freightEstimate === null
        ? []
        : [
            `Simulação demonstrativa de frete: ${currency.format(freightEstimate)} (não é cotação dos Correios)`,
          ]),
      'Frete real: a confirmar pela Arte Caneca',
      'Prazo de transporte após postagem: a confirmar'
    );
  } else {
    lines.push(
      'Modalidade: retirada no local',
      'Frete: não se aplica',
      'Local e horário: a combinar'
    );
  }
  lines.push(
    '',
    'Aguardo a confirmação de aceitação do pedido, valor e dias de produção' +
      (fields.entrega.value === 'envio' ? ', além do frete e prazo estimado de entrega.' : '.')
  );
  return lines.join('\n');
}

fields.telefone.addEventListener('input', () => fields.telefone.setCustomValidity(''));
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const phone = value('telefone').replace(/\D/g, '');
  if (!/^(?:55)?\d{10,11}$/.test(phone)) {
    fields.telefone.setCustomValidity('Informe um telefone com DDD válido.');
    fields.telefone.reportValidity();
    return;
  }
  for (const input of form.querySelectorAll('input[required]')) {
    if (!input.matches(':disabled') && input.type !== 'number' && !input.value.trim()) {
      input.value = '';
      input.reportValidity();
      return;
    }
  }
  if (!form.reportValidity()) return;
  if (!value('nomeCaneca') && !value('frase') && !photoInput.files[0] && !value('observacoes')) {
    const status = document.getElementById('form-status');
    status.textContent = 'Conte sua ideia: preencha um nome, frase, detalhe ou selecione uma foto.';
    status.focus();
    return;
  }
  const seller = String(window.ARTE_CANECA?.whatsapp || '').replace(/\D/g, '');
  if (!/^55\d{10,11}$/.test(seller)) {
    document.getElementById('form-status').textContent =
      'O contato da loja está indisponível. Tente novamente mais tarde.';
    return;
  }
  orderText = buildOrder();
  document.getElementById('order-summary').textContent = orderText;
  document.getElementById('send-whatsapp').href =
    `https://wa.me/${seller}?text=${encodeURIComponent(orderText)}`;
  const reminder = document.getElementById('attachment-reminder');
  reminder.hidden = !photoInput.files[0];
  reminder.textContent = photoInput.files[0]
    ? `Anexe a foto ${photoInput.files[0].name} no WhatsApp depois de enviar a mensagem. A foto não é transferida pelo link.`
    : '';
  form.hidden = true;
  review.hidden = false;
  document.getElementById('review-title').focus();
});

document.getElementById('edit-order').addEventListener('click', () => {
  review.hidden = true;
  form.hidden = false;
  document.getElementById('form-status').textContent = '';
  fields.cliente.focus();
});
document.getElementById('copy-order').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(orderText);
    document.getElementById('send-status').textContent =
      'Pedido copiado. Cole na conversa com a Arte Caneca e anexe a foto, se escolheu uma.';
  } catch {
    document.getElementById('send-status').textContent =
      'Não foi possível copiar automaticamente. Selecione o resumo acima e copie, ou use o botão para abrir o WhatsApp.';
  }
});
document.getElementById('send-whatsapp').addEventListener('click', () => {
  document.getElementById('send-status').textContent =
    'A conversa será aberta em outra aba ou no aplicativo. Confirme o envio no WhatsApp e anexe a foto, se selecionou uma. Seu pedido ainda depende da confirmação da Arte Caneca.';
});

// Cada cartão abre o formulário com o produto correspondente selecionado.
function updateProduct() {
  const other = fields.produto.value === 'outro';
  document.getElementById('other-product-field').hidden = !other;
  fields.outroProduto.disabled = !other;
  fields.outroProduto.required = other;
  document.getElementById('product-help').textContent = other
    ? 'Conte sua ideia abaixo — modelo, medidas e disponibilidade serão confirmados pelo WhatsApp.'
    : 'Modelos, medidas e disponibilidade dos demais produtos serão confirmados pelo WhatsApp.';

  document.getElementById('name-label-text').textContent = other
    ? 'Nome ou texto (se houver)'
    : 'Nome para colocar no produto';

  document.getElementById('phrase-label-text').textContent = other
    ? 'Frase ou personalização desejada (se houver)'
    : 'Frase para colocar no produto';
  fields.frase.maxLength = other ? 300 : 100;
  fields.frase.placeholder = other
    ? 'Se houver um texto, frase ou nome específico, escreva aqui.'
    : 'Escreva a frase exatamente como deseja que apareça.';
  document.getElementById('phrase-help').textContent =
    fields.produto.value === 'caneca'
      ? 'Confirmamos fonte e disposição na arte da caneca.'
      : 'Espaço, fonte e disposição a confirmar conforme o produto.';

  document.getElementById('details-label-text').textContent = other
    ? 'Conte sua ideia com detalhes'
    : 'Outros detalhes';
  fields.observacoes.placeholder = other
    ? 'Formato, tamanho, material, cores, referências... quanto mais detalhes, melhor.'
    : 'Cores, ocasião, referências ou instruções, se pedir mais de um produto.';

  updatePhraseCount();
  resetFreight();
}
const requestedProduct = new URLSearchParams(window.location.search).get('produto');
if (['caneca', 'azulejo', 'squeeze', 'outro'].includes(requestedProduct))
  fields.produto.value = requestedProduct;
fields.produto.addEventListener('change', updateProduct);
updateProduct();
