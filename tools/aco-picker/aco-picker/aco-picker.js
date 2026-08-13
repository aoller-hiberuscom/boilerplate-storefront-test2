import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const { actions } = await DA_SDK;

const familyInput = document.querySelector('#family');
const searchInput = document.querySelector('#search');
const searchBtn = document.querySelector('#searchBtn');
const statusEl = document.querySelector('#status');
const resultsEl = document.querySelector('#results');

familyInput.value = 'main-catalog';

function setStatus(message, isError = false) {
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

function buildCategoryHTML(category, family) {
  const slug = escapeHtml(category.slug || '');
  const name = escapeHtml(category.name || '');
  const safeFamily = escapeHtml(family || '');
  const level = escapeHtml(category.level ?? '');
  const parentSlug = escapeHtml(category.parentSlug || '');

  return `
    <table>
      <tbody>
        <tr>
          <td colspan="2">aco-category</td>
        </tr>
        <tr>
          <td>family</td>
          <td>${safeFamily}</td>
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

function renderResults(categories, family) {
  resultsEl.innerHTML = '';

  if (!categories.length) {
    setStatus('No se han encontrado categorías.');
    return;
  }

  setStatus(`${categories.length} categorías encontradas.`);

  categories.forEach((category) => {
    const li = document.createElement('li');
    li.className = 'aco-picker__result';

    const info = document.createElement('div');

    const title = document.createElement('strong');
    title.textContent = category.name || category.slug;

    const meta = document.createElement('small');
    meta.textContent = [
      category.slug ? `Slug: ${category.slug}` : '',
      category.level !== undefined ? `Level: ${category.level}` : '',
      category.parentSlug ? `Parent: ${category.parentSlug}` : '',
    ].filter(Boolean).join(' | ');

    const insert = document.createElement('button');
    insert.type = 'button';
    insert.textContent = 'Insertar';

    insert.addEventListener('click', () => {
      const html = buildCategoryHTML(category, family);

      actions.sendHTML(html);
      actions.closeLibrary();
    });

    info.append(title, meta);
    li.append(info, insert);
    resultsEl.append(li);
  });
}

async function searchCategories() {
  const term = searchInput.value.trim();
  const family = familyInput.value.trim();

  if (term.length < 3) {
    setStatus('Introduce al menos 3 caracteres para buscar.', true);
    resultsEl.innerHTML = '';
    return;
  }

  searchBtn.disabled = true;
  setStatus('Buscando categorías...');

  try {
    const response = await fetch('/api/aco/categories/search', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        term,
        family: family || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    renderResults(data.items || [], family);
  } catch (error) {
    console.error(error);
    setStatus('Error cargando categorías. Revisa el endpoint /api/aco/categories/search.', true);
    resultsEl.innerHTML = '';
  } finally {
    searchBtn.disabled = false;
  }
}

searchBtn.addEventListener('click', searchCategories);

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchCategories();
  }
});
