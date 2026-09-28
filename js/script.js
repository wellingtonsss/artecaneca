// Inspirações exibidas na galeria.
const inspirations = [
  {
    title: 'Afeto em forma de presente',
    description: 'Para transformar um gesto simples em uma lembrança especial.',
    image: 'images/canecas.webp',
    position: '50% 50%',
    scale: '1',
  },
  {
    title: 'Um nome, um presente único',
    description: 'Canecas com nomes para deixar cada pausa com a sua identidade.',
    image: 'images/canecas-nomes.webp',
    position: '50% 50%',
    scale: '1',
  },
  {
    title: 'Amor em cada detalhe',
    description: 'Um conjunto para celebrar o amor e os momentos compartilhados.',
    image: 'images/canecas-casal.webp',
    position: '50% 50%',
    scale: '1',
  },
  {
    title: 'Hoje é dia de celebrar',
    description: 'Uma inspiração de aniversário para presentear com alegria e carinho.',
    image: 'images/caneca-aniversario.webp',
    position: '50% 50%',
    scale: '1',
  },
];
// Navegação circular entre as inspirações.
let current = 0;
function showSlide(step) {
  current = (current + step + inspirations.length) % inspirations.length;
  const item = inspirations[current];
  document.getElementById('slide-title').textContent = item.title;
  document.getElementById('slide-description').textContent = item.description;
  document.getElementById('slide-count').textContent =
    `${String(current + 1).padStart(2, '0')} / ${String(inspirations.length).padStart(2, '0')}`;
  const img = document.getElementById('slide-image');
  img.src = item.image;
  img.style.objectPosition = item.position;
  img.style.transform = `scale(${item.scale})`;
  img.alt = `${item.title}: conceito ilustrativo de caneca personalizada`;
}
// Sincroniza imagem e contador com os dados da galeria.
showSlide(0);

document.getElementById('previous').addEventListener('click', () => showSlide(-1));
document.getElementById('next').addEventListener('click', () => showSlide(1));
// Ano do rodapé.
document.getElementById('year').textContent = new Date().getFullYear();
// Dados da empresa definidos em config.js.
const config = window.ARTE_CANECA;
if (config) {
  const phone = String(config.whatsapp).replace(/\D/g, '');
  const link = `https://wa.me/${phone}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre as canecas personalizadas da Arte Caneca.')}`;
  document.querySelectorAll('.whatsapp').forEach((a) => (a.href = link));
  document.getElementById('story-title').textContent = config.historiaTitulo;
  document.getElementById('story-text').textContent = config.historia;
}

// Evita que o cabeçalho cubra as seções ao navegar pelos links do menu.
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const updateHeaderHeight = () => {
    document.documentElement.style.setProperty('--header-height', `${siteHeader.offsetHeight}px`);
  };
  updateHeaderHeight();
  if ('ResizeObserver' in window) new ResizeObserver(updateHeaderHeight).observe(siteHeader);
  else window.addEventListener('resize', updateHeaderHeight);
}
