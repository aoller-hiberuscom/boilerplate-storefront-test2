export default function decorate(block) {
  const valueCell = block.querySelector(':scope > div > div');

  if (!valueCell) return;

  const categoryId = valueCell.textContent.trim();

  const info = document.createElement('div');
  info.className = 'aco-category-info';

  const label = document.createElement('strong');
  label.textContent = 'Categoría seleccionada: ';

  const value = document.createElement('span');
  value.textContent = categoryId || 'Ninguna';

  info.append(label, value);

  block.append(info);
}
