/**
 * core/error.js — Páginas de error.
 *
 * Capa: core (solo puede importar de vendor y core).
 */

/**
 * Loads and displays an error page (e.g., 418) by replacing the current page
 * content. If the code is a 404, we redirect to a non-existent page which
 * causes the 404.html from this repo to be loaded.
 * @param {number} [code] - The HTTP error code for the error page
 */
export async function loadErrorPage(code = 404) {
  if (code === 404) {
    window.location.replace('/notfound');
    return;
  }
  const htmlText = await fetch(`/${code}.html`).then((response) => {
    if (response.ok) {
      return response.text();
    }
    throw new Error(`Error getting ${code} page`);
  });
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  document.body.innerHTML = doc.body.innerHTML;
  // get dropin styles
  document.head.querySelectorAll('style[data-dropin]').forEach((style) => {
    doc.head.appendChild(style);
  });
  document.head.innerHTML = doc.head.innerHTML;

  // When moving script tags via innerHTML, they are not executed. They need to be re-created.
  const notImportMap = (c) => c.textContent && c.type !== 'importmap';
  Array.from(document.head.querySelectorAll('script'))
    .filter(notImportMap)
    .forEach((c) => c.remove());
  Array.from(doc.head.querySelectorAll('script'))
    .filter(notImportMap)
    .forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(({ name, value }) => {
        newScript.setAttribute(name, value);
      });
      const scriptText = document.createTextNode(oldScript.innerHTML);
      newScript.appendChild(scriptText);
      document.head.appendChild(newScript);
    });
}
