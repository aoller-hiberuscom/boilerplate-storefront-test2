import DA_SDK from 'https://da.live/nx/utils/sdk.js';

let actions = null;

try {
  const sdk = await DA_SDK;
  actions = sdk.actions;
  console.log('DA SDK cargado correctamente.', sdk.context);
} catch (error) {
  console.warn(
    'DA SDK no disponible. Abre el picker desde DA.live para insertar contenido.',
    error,
  );
}

/**
 * IMPORTANTE:
 * true  = usa datos falsos para probar que el picker funciona.
 * false = llama al endpoint real /api/aco/categories/search.
 */
const MOCK_MODE = true;

const searchInput = document.querySelector('#search');
const searchBtn = document.querySelector('#searchBtn');
const statusEl = document.querySelector('#status');
const resultsEl = document.querySelector('#results');

const MOCK_CATEGORIES = [
  {
    name: 'Women Shoes',
    slug: 'women/shoes',
    level: 2,
    parentSlug: 'women',
  },
  {
    name: 'Men Shoes',
    slug: 'men/shoes',
    level: 2,
    parentSlug: 'men',
  },
  {
    name: 'Sale Sneakers',
    slug: 'sale/sneakers',
    level: 2,
    parentSlug: 'sale',
  },
  {
    name: 'Running Shoes',
    slug: 'sports/running-shoes',
    level: 3,
    parentSlug: 'sports',
  },
  {
    name: 'Women Dresses',
    slug: 'women/dresses',
    level: 2,
    parentSlug: 'women',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    level: 1,
    parentSlug: '',
  },
];

function setStatus(message, isError = false) {
  if (!statusEl) {
    return;
  }

  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildCategoryHTML(category) {
  const slug = escapeHtml(category.slug || '');
  const name = escapeHtml(category.name || '');
  const level = escapeHtml(category.level ?? '');
  const parentSlug = escapeHtml(category.parentSlug || '');

  return `
    <table>
      <tbody>
        <tr>
          <td colspan="2">aco-category</td>
        </tr>
        <tr>
          <td>slug</td>
          <td>${slug}</td>
        </tr>
        <tr>
          <td>name</td>
          <td>${name}</td>
        </tr>
        <tr>
          <td>level</td>
          <td>${level}</td>
        </tr>
        <tr>
          <td>parentSlug</td>
          <td>${parentSlug}</td>
        </tr>
      </tbody>
    </table>
  `;
}

function renderResults(categories) {
  resultsEl.innerHTML = '';

  if (!categories.length) {
    setStatus('No se han encontrado categorias.');
    return;
  }

  setStatus(`${categories.length} categorias encontradas.`);

  categories.forEach((category) => {
    const li = document.createElement('li');
    li.className = 'aco-picker__result';

    const info = document.createElement('div');
    info.className = 'aco-picker__result-info';

    const title = document.createElement('strong');
    title.textContent = category.name || category.slug;

    const meta = document.createElement('small');

    meta.textContent = [
      category.slug ? `Slug: ${category.slug}` : '',
      category.level !== undefined && category.level !== null ? `Level: ${category.level}` : '',
      category.parentSlug ? `Parent: ${category.parentSlug}` : '',
    ].filter(Boolean).join(' | ');

    const insertButton = document.createElement('button');
    insertButton.type = 'button';
    insertButton.className = 'aco-picker__insert';
    insertButton.textContent = 'Insertar';

    insertButton.addEventListener('click', () => {
      const html = buildCategoryHTML(category);

      console.log('Insertando categoria:', category);
      console.log('HTML generado:', html);

      if (!actions) {
        console.log('Fuera de DA.live: HTML que se insertaría:', html);
        setStatus('Selección correcta. Abre el picker desde DA.live para insertarla.');
        return;
      }

      actions.sendHTML(html);
      actions.closeLibrary();
    });

    info.append(title, meta);
    li.append(info, insertButton);
    resultsEl.append(li);
  });
}

async function getMockCategories(term) {
  const normalizedTerm = term.toLowerCase();

  return MOCK_CATEGORIES.filter((category) => {
    const name = String(category.name || '').toLowerCase();
    const slug = String(category.slug || '').toLowerCase();

    return name.includes(normalizedTerm) || slug.includes(normalizedTerm);
  });
}

async function getRealCategories(term) {
  const response = await fetch('/api/aco/categories/search', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      term,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  return data.items || [];
}

async function searchCategories() {
  console.log('Click en Buscar detectado.');

  const term = searchInput.value.trim();

  if (term.length < 3) {
    setStatus('Introduce al menos 3 caracteres para buscar.', true);
    resultsEl.innerHTML = '';
    return;
  }

  searchBtn.disabled = true;
  setStatus('Buscando categorias...');

  try {
    const categories = MOCK_MODE
      ? await getMockCategories(term)
      : await getRealCategories(term);

    renderResults(categories);
  } catch (error) {
    console.error('Error buscando categorias:', error);
    setStatus('Error cargando categorias. Revisa la consola del navegador.', true);
    resultsEl.innerHTML = '';
  } finally {
    searchBtn.disabled = false;
  }
}

function init() {
  if (!searchInput || !searchBtn || !statusEl || !resultsEl) {
    console.error('ACO Picker: faltan elementos HTML requeridos.', {
      searchInput,
      searchBtn,
      statusEl,
      resultsEl,
    });

    return;
  }

  searchBtn.addEventListener('click', searchCategories);

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchCategories();
    }
  });

  console.log('ACO Picker JS cargado correctamente.');
}

init();
