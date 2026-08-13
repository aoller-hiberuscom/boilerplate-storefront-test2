# ACO Category Block

Bloque de Adobe Edge Delivery Services para almacenar y mostrar una categoría seleccionada desde Universal Editor.

## Estructura

```text
blocks/
└── aco-category/
    ├── aco-category.js
    ├── aco-category.css
    ├── _aco-category.json
    └── README.md
```

## Objetivo

En esta primera versión el bloque es deliberadamente simple.

Permite:

* Insertar el bloque desde Universal Editor.
* Introducir manualmente un `categoryId`.
* Guardar el valor en el contenido de DA.live.
* Mostrar el valor seleccionado en el storefront.
* Validar la comunicación entre Universal Editor, DA.live y EDS antes de integrar el ACO Category Picker.

El flujo es:

```text
Universal Editor
      ↓
Category ID
      ↓
DA.live
      ↓
ACO Category Block
      ↓
Storefront
```

## Estructura de contenido

El bloque utiliza una única celda:

```text
| ACO Category |
|--------------|
| 123          |
```

Donde `123` representa el identificador de la categoría.

## Configuración de Universal Editor

El bloque define su modelo e instrumentación en:

```text
blocks/aco-category/_aco-category.json
```

En esta primera versión, Universal Editor representa `categoryId` mediante un campo de texto normal.

```text
ACO Category

Category ID
┌───────────────────────┐
│ 123                   │
└───────────────────────┘
```

## Registrar el bloque

El bloque debe añadirse a los componentes disponibles de las sections en:

```text
models/_section.json
```

## Generar la configuración de Universal Editor

Después de añadir o modificar la configuración del bloque, ejecutar:

```bash
npm run build:json
```

Esto actualiza:

```text
component-definition.json
component-models.json
component-filters.json
```

## Prueba

Desde Universal Editor:

1. Abrir una página.
2. Añadir un nuevo bloque.
3. Seleccionar `ACO Category`.
4. Seleccionar el bloque.
5. Introducir un valor en `Category ID`, por ejemplo `123`.
6. Comprobar que el bloque muestra la categoría seleccionada.
7. Guardar los cambios.
8. Verificar que el valor también queda almacenado en DA.live.

## Siguiente evolución

Una vez validado el funcionamiento básico, el campo de texto de `categoryId` se sustituirá por un selector personalizado conectado con ACO.

El flujo final será:

```text
ACO Category
      ↓
Category
      ↓
[ Seleccionar categoría ]
      ↓
ACO Category Picker
      ↓
Gear
 ├── Bags
 ├── Watches
 └── Fitness
      ↓
categoryId
      ↓
DA.live
```

La primera versión del bloque tiene como objetivo validar correctamente:

```text
Universal Editor
      ↓
DA.live
      ↓
EDS Block
```

La integración con ACO y el selector visual de categorías se añadirá posteriormente.
