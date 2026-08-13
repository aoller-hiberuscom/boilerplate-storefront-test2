/**
 * core/decoration.js — Decoración de secciones y plantillas de página.
 *
 * Capa: core (solo puede importar de vendor y core).
 *
 * NOTA: decorateSections es una variante commerce de la función homónima de
 * aem.js (gestiona el markup `richtext` que produce el backend commerce).
 * Es una divergencia INTENCIONAL respecto al core de Adobe; scripts.js debe
 * usar esta versión.
 */

/**
 * Decorates all sections in a container element.
 * @param {Element} main The container element
 */
export function decorateSections(main) {
  main.querySelectorAll(':scope > div').forEach((/** @type {HTMLElement} */ section) => {
    const wrappers = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      if (e.classList.contains('richtext')) {
        e.removeAttribute('class');
        if (!defaultContent) {
          const wrapper = document.createElement('div');
          wrapper.classList.add('default-content-wrapper');
          wrappers.push(wrapper);
          defaultContent = true;
        }
      } else if (e.tagName === 'DIV' || !defaultContent) {
        const wrapper = document.createElement('div');
        wrappers.push(wrapper);
        defaultContent = e.tagName !== 'DIV';
        if (defaultContent) wrapper.classList.add('default-content-wrapper');
      }
      wrappers[wrappers.length - 1].append(e);
    });
    wrappers.forEach((wrapper) => section.append(wrapper));
    section.classList.add('section');
    section.dataset.sectionStatus = 'initialized';
    section.style.display = 'none';
  });
}

/**
 * Decorates the Columns template on sections with column metadata.
 * @param {Document} doc The document
 */
function buildTemplateColumns(doc) {
  const columns = doc.querySelectorAll('main > div.section[data-column-width]');

  columns.forEach((/** @type {HTMLElement} */ column) => {
    const columnWidth = column.getAttribute('data-column-width');
    const gap = column.getAttribute('data-gap');

    if (columnWidth) {
      column.style.setProperty('--column-width', columnWidth);
      column.removeAttribute('data-column-width');
    }

    if (gap) {
      column.style.setProperty('--gap', `var(--spacing-${gap.toLocaleLowerCase()})`);
      column.removeAttribute('data-gap');
    }
  });
}

/**
 * Applies templates to the document.
 * @param {Document} doc The document
 */
export function applyTemplates(doc) {
  if (doc.body.classList.contains('columns')) {
    buildTemplateColumns(doc);
  }
}
