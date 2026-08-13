import DA_SDK from 'https://da.live/nx/utils/sdk.js';

let actions = null;

/**
 * Inicializamos el SDK de DA.
 *
 * Si abrimos la herramienta directamente desde el navegador
 * no tendremos contexto de DA, pero podremos seguir probando
 * las búsquedas contra ACO.
 */
try {
  const sdk = await DA_SDK;

  actions = sdk.actions;

  console.log(
    'DA SDK cargado correctamente.',
    sdk.context,
  );
} catch (error) {
  console.warn(
    'DA SDK no disponible. Abre el picker desde DA.live para insertar contenido.',
    error,
  );
}

/**
 * Config
 */
const CONFIG_URL = '/config.json';
const PAGE_SIZE = 20;

/**
 * DOM
 */
const searchInput = document.querySelector('#search');
const searchBtn = document.querySelector('#searchBtn');
const statusEl = document.querySelector('#status');
const resultsEl = document.querySelector('#results');

let acoConfigPromise;

/**
 * Status
 */
function setStatus(message, isError = false) {
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

/**
 * Escapamos valores antes de meterlos en HTML.
 */
function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * HTML que insertaremos dentro de DA.live.
 *
 * Esto acabará siendo un bloque:
 *
 * aco-category
 * ----------------
 * slug
 * name
 * level
 * parentSlug
 */
function buildCategoryHTML(category) {
  const slug = escapeHtml(category.slug || '');
  const name = escapeHtml(category.name || '');
  const level = escapeHtml(category.level ?? '');
  const parentSlug = escapeHtml(
    category.parentSlug || '',
  );

  return `
    <table>
      <tbody>

        <tr>
          <td colspan="2">
            aco-category
          </td>
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

/**
 * Soporta:
 *
 * {
 *   "public": {
 *     "default": {
 *        ...
 *     }
 *   }
 * }
 *
 * y también configuraciones más simples.
 */
function getPublicConfig(config) {
  if (config?.public?.default) {
    return config.public.default;
  }

  if (config?.default) {
    return config.default;
  }

  return config;
}

/**
 * Leemos el config.json del storefront.
 *
 * De esta forma el picker utiliza EXACTAMENTE
 * el mismo ACO que utiliza el storefront.
 */
async function loadAcoConfig() {
  const response = await fetch(CONFIG_URL, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `No se ha podido cargar ${CONFIG_URL}: HTTP ${response.status}`,
    );
  }

  const rawConfig = await response.json();

  const config = getPublicConfig(rawConfig);

  const endpoint =
    config?.['commerce-endpoint'];

  const headers =
    config?.headers?.cs || {};

  if (!endpoint) {
    throw new Error(
      'Falta commerce-endpoint en config.json',
    );
  }

  const viewId =
    headers['ac-view-id']
    || headers['AC-View-ID'];

  if (!viewId) {
    throw new Error(
      'Falta AC-View-ID en headers.cs de config.json',
    );
  }

  console.log('ACO configurado:', {
    endpoint,
    viewId,
    headers,
  });

  return {
    endpoint,
    headers,
  };
}

/**
 * Cacheamos la config.
 */
function getAcoConfig() {
  if (!acoConfigPromise) {
    acoConfigPromise = loadAcoConfig();
  }

  return acoConfigPromise;
}

/**
 * Cliente GraphQL genérico.
 */
async function graphqlRequest(
  query,
  variables,
) {
  const {
    endpoint,
    headers,
  } = await getAcoConfig();

  console.log(
    'ACO request:',
    endpoint,
    variables,
  );

  const response = await fetch(
    endpoint,
    {
      method: 'POST',

      headers: {
        ...headers,
        'content-type': 'application/json',
      },

      body: JSON.stringify({
        query,
        variables,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `ACO HTTP ${response.status} ${response.statusText}`,
    );
  }

  const payload =
    await response.json();

  console.log(
    'ACO response:',
    payload,
  );

  if (payload.errors?.length) {
    const message = payload.errors
      .map((error) => error.message)
      .filter(Boolean)
      .join(' | ');

    throw new Error(
      `ACO GraphQL: ${
        message || 'Error desconocido'
      }`,
    );
  }

  return payload.data;
}

/**
 * Buscar categorías reales en ACO.
 */
async function getRealCategories(term) {
  const query = `
    query SearchCategories(
      $searchTerm: String!
      $pageSize: Int
      $currentPage: Int
    ) {

      searchCategory(
        searchTerm: $searchTerm
        pageSize: $pageSize
        currentPage: $currentPage
      ) {

        items {
          slug
          name
          level
          parentSlug
          childrenSlugs
        }

        totalCount

        pageInfo {
          currentPage
          pageSize
          totalPages
        }

      }
    }
  `;

  const data = await graphqlRequest(
    query,
    {
      searchTerm: term,
      pageSize: PAGE_SIZE,
      currentPage: 1,
    },
  );

  const result =
    data?.searchCategory;

  if (!result) {
    throw new Error(
      'ACO no ha devuelto searchCategory',
    );
  }

  return result;
}

/**
 * Pintamos los resultados.
 */
function renderResults(result) {
  const categories =
    result.items || [];

  resultsEl.innerHTML = '';

  if (!categories.length) {
    setStatus(
      'No se han encontrado categorías.',
    );

    return;
  }

  const total =
    result.totalCount
    ?? categories.length;

  const visible =
    categories.length;

  setStatus(
    total > visible
      ? `Mostrando ${visible} de ${total} categorías.`
      : `${total} categorías encontradas.`,
  );

  categories.forEach((category) => {
    const li =
      document.createElement('li');

    li.className =
      'aco-picker__result';

    /**
     * Info
     */
    const info =
      document.createElement('div');

    info.className =
      'aco-picker__result-info';

    /**
     * Nombre
     */
    const title =
      document.createElement('strong');

    title.textContent =
      category.name
      || category.slug;

    /**
     * Metadata
     */
    const meta =
      document.createElement('small');

    meta.textContent = [
      category.slug
        ? `Slug: ${category.slug}`
        : '',

      category.level !== undefined
      && category.level !== null
        ? `Level: ${category.level}`
        : '',

      category.parentSlug
        ? `Parent: ${category.parentSlug}`
        : '',
    ]
      .filter(Boolean)
      .join(' | ');

    /**
     * Botón insertar
     */
    const insertButton =
      document.createElement('button');

    insertButton.type =
      'button';

    insertButton.className =
      'aco-picker__insert';

    insertButton.textContent =
      'Insertar';

    insertButton.addEventListener(
      'click',
      () => {
        const html =
          buildCategoryHTML(category);

        console.log(
          'Insertando categoría:',
          category,
        );

        console.log(
          'HTML generado:',
          html,
        );

        /**
         * Si lo estamos abriendo directamente
         * en navegador, no tenemos acciones DA.
         */
        if (!actions) {
          console.log(
            'Fuera de DA.live: HTML que se insertaría:',
            html,
          );

          setStatus(
            'Selección correcta. Abre el picker desde DA.live para insertarla.',
          );

          return;
        }

        /**
         * Insertamos el bloque en DA.
         */
        actions.sendHTML(html);

        /**
         * Cerramos Library.
         */
        actions.closeLibrary();
      },
    );

    info.append(
      title,
      meta,
    );

    li.append(
      info,
      insertButton,
    );

    resultsEl.append(li);
  });
}

/**
 * Ejecutar búsqueda.
 */
async function searchCategories() {
  console.log(
    'Click en Buscar detectado.',
  );

  const term =
    searchInput.value.trim();

  /**
   * ACO searchCategory necesita
   * mínimo 3 caracteres.
   */
  if (term.length < 3) {
    setStatus(
      'Introduce al menos 3 caracteres para buscar.',
      true,
    );

    resultsEl.innerHTML = '';

    return;
  }

  searchBtn.disabled = true;

  setStatus(
    'Buscando categorías en ACO...',
  );

  try {
    const result =
      await getRealCategories(term);

    renderResults(result);
  } catch (error) {
    console.error(
      'Error buscando categorías en ACO:',
      error,
    );

    setStatus(
      error.message
      || 'Error cargando categorías de ACO.',
      true,
    );

    resultsEl.innerHTML = '';
  } finally {
    searchBtn.disabled = false;
  }
}

/**
 * Init.
 */
async function init() {
  if (
    !searchInput
    || !searchBtn
    || !statusEl
    || !resultsEl
  ) {
    console.error(
      'ACO Picker: faltan elementos HTML requeridos.',
      {
        searchInput,
        searchBtn,
        statusEl,
        resultsEl,
      },
    );

    return;
  }

  /**
   * Botón buscar
   */
  searchBtn.addEventListener(
    'click',
    searchCategories,
  );

  /**
   * Enter
   */
  searchInput.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Enter') {
        searchCategories();
      }
    },
  );

  /**
   * Probamos que ACO esté configurado.
   */
  try {
    await getAcoConfig();

    setStatus(
      'ACO conectado. Busca una categoría.',
    );

    console.log(
      'ACO Picker conectado al endpoint real.',
    );
  } catch (error) {
    console.error(
      'No se ha podido inicializar ACO:',
      error,
    );

    setStatus(
      error.message
      || 'No se ha podido cargar la configuración ACO.',
      true,
    );
  }
}

init();
