export default function decorate(block) {
  const valueCell = block.querySelector(':scope > div > div');

  if (!valueCell) return;

  // Primero recuperamos el valor generado por DA.
  const categoryId = valueCell.textContent.trim();

  const info = document.createElement('div');
  info.className = 'aco-category-info';

  const label = document.createElement('strong');
  label.textContent = 'Categoría seleccionada: ';

  const value = document.createElement('span');
  value.textContent = categoryId || 'Ninguna';

  info.append(label, value);

  // Eliminamos la estructura original del bloque
  // y dejamos únicamente el HTML decorado.
  block.replaceChildren(info);
}
