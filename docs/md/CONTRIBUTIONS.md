# GUÍA DE CONTRIBUCIONES

Bienvenido al proyecto **Weekbox**. Esta guía te proporciona los estándares y mejores prácticas para contribuir al proyecto de manera consistente y segura.

## Indice

1. [Estructura de Archivos](#estructura-de-archivos)
2. [Convenciones de Nombres](#convenciones-de-nombres)
3. [Proceso de Formato](#proceso-de-formato)
4. [Estándares de CSS](#estándares-de-css)
5. [Estándares de JavaScript](#estándares-de-javascript)
6. [Estructura de Componentes](#estructura-de-componentes)
7. [Seguridad](#seguridad)
8. [Principios de Modularización](#principios-de-modularización)
9. [Documentación](#documentación)

---

## ESTRUCTURA DE ARCHIVOS

El proyecto sigue una estructura organizada que separa la lógica del UI, backend y configuración:

```
app/src/
├── ui/
│   ├── js/              # Lógica JavaScript
│   ├── css/             # Estilos CSS modularizados
│   ├── html/            # Plantillas HTML
│   └── utils/
│       ├── componentes/      # Web Components reutilizables
│       └── helpers/          # Funciones utilitarias
├── backend/
│   ├── api/             # Endpoints y lógica de API
│   ├── config/          # Configuración del proyecto
│   └── native/          # Integraciones nativas del SO
```

### DIRECTORIOS PRINCIPALES

- **`app/ui/js/`**: Contiene la lógica JavaScript, controladores y handlers
- **`app/ui/css/`**: Estilos modularizados y organizados jerárquicamente
- **`app/ui/html/`**: Plantillas HTML (templates)
- **`app/ui/utils/componentes/`**: Web Components reutilizables
- **`app/ui/utils/helpers/`**: Funciones auxiliares y transformadores
- **`app/backend/api/`**: Servicios y endpoints de API
- **`app/backend/config/`**: Configuración de motores, fuentes y descubrimiento
- **`app/backend/native/`**: Integraciones específicas del SO (PC, Mac, Linux)

---

## CONVENCIONES DE NOMBRES

Todos los archivos y directorios deben seguir el formato **kebab-case** (texto-con-guiones):

### EJEMPLOS CORRECTOS

```
✓ archivo-principal.js
✓ componente-boton.js
✓ utilidad-descarga.js
✓ estilos-base.css
✓ modal-confirmacion.html
✓ gestor-almacenamiento.js
```

### EJEMPLOS INCORRECTOS

```
✗ archivoPrincipal.js          (camelCase)
✗ ComponenteBoton.js           (PascalCase)
✗ UTILIDAD_DESCARGA.js         (SCREAMING_SNAKE_CASE)
✗ estilos_base.css             (snake_case)
```

---

## PROCESO DE FORMATO

Antes de enviar un pull request, **todos los archivos deben estar formateados correctamente**.

### FORMATEAR TODOS LOS ARCHIVOS

```bash
npm run format
```

Este comando aplicará:
- Formatos de indentación consistentes
- Espacios y saltos de línea según estándares
- Consistencia en comillas y puntuación

### VERIFICACIÓN ANTES DE PUSH

```bash
# Revisar qué archivos necesitan formato
npm run format:check

# Formatear automáticamente
npm run format

# Hacer commit
git add .
git commit -m "feat: descripcion-del-cambio"
git push
```

### ⚠️ IMPORTANTE

**No hagas push sin ejecutar `npm run format` primero.** Los archivos sin formato serán rechazados en la revisión.

---

## ESTÁNDARES DE CSS

Seguimos un enfoque modular y seguro para los estilos, organizados jerárquicamente por responsabilidad.

### ESTRUCTURA JERÁRQUICA DE CSS

Los estilos se organizan en carpetas temáticas, donde cada carpeta representa un conjunto de funcionalidades relacionadas, p.ej::

```
app/src/ui/css/
├── variables.css           # Variables globales (colores, espaciado, tipografía)
├── index.css               # Entry point - imports de estructuras principales y estilos globales
├── reset/
│   ├── reset.css
│   └── normalize.css
├── base/
│   ├── base.css
│   └── tipografia.css
├── menu/
│   ├── menu.css            # Import principal del menú
│   ├── grid.css            # Grid específica del menú
│   ├── navegacion.css
│   └── responsive.css
├── modal/
│   ├── modal.css
│   ├── animaciones.css
│   └── variantes.css
├── componentes/
│   ├── boton.css
│   ├── formulario.css
│   └── tarjeta.css
└── utilidades/
    ├── espaciado.css
    ├── tipografia.css
    └── animaciones.css
```

### FLUJO DE IMPORTS EN CSS

**Regla**: Cada nivel solo importa lo que necesita de abajo hacia arriba.

#### 1. `app/ui/css/index.css` (Entry Point)

```css
/* Imports de configuración y estilos globales */
@import url('./variables.css');
@import url('./reset/reset.css');
@import url('./base/base.css');

/* Imports de estructuras principales */
@import url('./menu/menu.css');
@import url('./modal/modal.css');
@import url('./componentes/boton.css');
@import url('./utilidades/espaciado.css');

* {
  box-sizing: border-box;
}

body {
  font-family: var(--fuente-principal);
  color: var(--color-texto-primario);
  background-color: var(--color-fondo);
}
```

#### 2. `app/ui/css/variables.css` (Variables Globales)

```css
/* ============================================
   VARIABLES GLOBALES EJEMPLO - COLORES  (distintos temas)
   ============================================ */
:root {
  --color-primario: #007bff;
  --color-primario-hover: #0056b3;
  --color-primario-light: #e7f1ff;
  
  --color-secundario: #6c757d;
  --color-peligro: #dc3545;
  --color-exito: #28a745;
  --color-advertencia: #ffc107;
  
  --color-texto-primario: #1a1a1a;
  --color-texto-secundario: #666666;
  --color-texto-invertido: #ffffff;
  
  --color-fondo: #ffffff;
  --color-fondo-secundario: #f5f5f5;
  --color-borde: #e0e0e0;
}

/* ============================================
   VARIABLES GLOBALES - ESPACIADO
   ============================================ */
:root {
  --espacio-xs: 4px;
  --espacio-sm: 8px;
  --espacio-md: 16px;
  --espacio-lg: 24px;
  --espacio-xl: 32px;
  --espacio-xxl: 48px;
}

/* ============================================
   VARIABLES GLOBALES - TIPOGRAFÍA
   ============================================ */
:root {
  --fuente-principal: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  --fuente-monoespaciada: 'Courier New', monospace;
  
  --tamaño-xs: 12px;
  --tamaño-sm: 14px;
  --tamaño-md: 16px;
  --tamaño-lg: 18px;
  --tamaño-xl: 20px;
  --tamaño-2xl: 24px;
  
  --peso-ligero: 300;
  --peso-normal: 400;
  --peso-medio: 500;
  --peso-semibold: 600;
  --peso-bold: 700;
  
  --altura-linea-compacta: 1.2;
  --altura-linea-normal: 1.5;
  --altura-linea-relajada: 1.8;
}

/* ============================================
   VARIABLES GLOBALES - BORDES
   ============================================ */
:root {
  --radio-sm: 4px;
  --radio-md: 8px;
  --radio-lg: 12px;
  --radio-redondo: 50%;
}

/* ============================================
   VARIABLES GLOBALES - SOMBRAS
   ============================================ */
:root {
  --sombra-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --sombra-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --sombra-lg: 0 10px 25px rgba(0, 0, 0, 0.15);
}

/* ============================================
   VARIABLES GLOBALES - TRANSICIONES
   ============================================ */
:root {
  --transicion-rapida: all 0.15s ease-out;
  --transicion-normal: all 0.3s ease-out;
  --transicion-lenta: all 0.5s ease-out;
}
```

#### 3. `app/ui/css/menu/menu.css` (Estructura Compleja)

```css
/* Menu - Import principal que agrupa submódulos */
@import url('./grid.css');
@import url('./navegacion.css');
@import url('./responsive.css');
@import url('./animaciones.css');

/* ============================================
   COMPONENTE MENÚ - ESTILOS PRINCIPALES
   ============================================ */

.menu {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--espacio-md);
  padding: var(--espacio-lg);
  background-color: var(--color-fondo);
  border-bottom: 1px solid var(--color-borde);
}

.menu__item {
  padding: var(--espacio-sm) var(--espacio-md);
  border-radius: var(--radio-md);
  cursor: pointer;
  transition: var(--transicion-normal);
}

.menu__item:hover {
  background-color: var(--color-fondo-secundario);
}

.menu__item--activo {
  background-color: var(--color-primario-light);
  color: var(--color-primario);
  font-weight: var(--peso-semibold);
}
```

#### 4. `app/ui/css/menu/grid.css` (Submódulo)

```css
/* Menu - Sistema de Grid */

.menu__grid-contenedor {
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-gap: var(--espacio-md);
  align-items: center;
}

.menu__grid-item {
  padding: var(--espacio-sm);
}

@media (max-width: 768px) {
  .menu__grid-contenedor {
    grid-template-columns: 1fr;
  }
}
```

#### 5. `app/ui/css/menu/navegacion.css` (Submódulo)

```css
/* Menu - Navegación */

.menu__enlace {
  color: var(--color-texto-primario);
  text-decoration: none;
  transition: var(--transicion-normal);
}

.menu__enlace:hover {
  color: var(--color-primario);
}

.menu__enlace--activo {
  border-bottom: 2px solid var(--color-primario);
}
```

#### 6. `app/ui/css/menu/responsive.css` (Submódulo)

```css
/* Menu - Diseño Responsivo */

@media (max-width: 768px) {
  .menu {
    flex-direction: column;
    padding: var(--espacio-md);
  }

  .menu__item {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .menu {
    padding: var(--espacio-sm);
    gap: var(--espacio-sm);
  }
}
```

### CSS SCOPED Y BEM

Utiliza **CSS Scoped** combinado con **BEM** (Block Element Modifier) para evitar conflictos de estilos:

```css
/* ✓ CORRECTO: BEM con prefijo del componente */
.componente-boton {
  padding: 8px 16px;
  border-radius: var(--radio-md);
}

.componente-boton__icono {
  margin-right: var(--espacio-sm);
}

.componente-boton--primario {
  background-color: var(--color-primario);
  color: white;
}

.componente-boton--primario:hover {
  background-color: var(--color-primario-hover);
}

/* ✗ INCORRECTO: Nombres genéricos sin scope */
.boton {
  padding: 8px 16px;
}

.boton.primario {
  background-color: #007bff;
}
```

### CONVENCIONES CSS OBLIGATORIAS

```css
/* ✓ Usar variables globales SIEMPRE */
color: var(--color-texto-primario);
padding: var(--espacio-md);
font-family: var(--fuente-principal);

/* ✗ NO usar colores hardcodeados */
color: #1a1a1a;

/* ✓ Usar transiciones globales */
transition: var(--transicion-normal);

/* ✗ NO usar !important a menos que sea absolutamente necesario */
color: red !important;

/* ✓ Dividir CSS complejos en archivos separados por responsabilidad */
/* ✗ NO tener archivos CSS de más de 300 líneas */

/* ✓ Usar @import url para incluir dependencias */
@import url('./submódulo.css');

/* ✗ NO usar estilos inline en HTML */
/* ✗ NO usar !important sin justificación (en caso de usarlo, especificar por que) */
```

---

## ESTÁNDARES DE JAVASCRIPT

### SIN INNERHTML

**Nunca uses `innerHTML` para insertar contenido.** Esto expone el proyecto a vulnerabilidades XSS.

```javascript
/* ✗ INCORRECTO y peligroso */
element.innerHTML = `<div>${datosDelUsuario}</div>`;

/* ✓ CORRECTO: Usar textContent para texto */
element.textContent = datosDelUsuario;

/* ✓ CORRECTO: Usar templates HTML */
// Ver sección "Estructura de Componentes"
```

### SIN CREACIÓN DE HTML DESDE JAVASCRIPT

**No crear elementos HTML mediante string concatenation o DOM manipulation directo.**

```javascript
/* ✗ INCORRECTO */
const html = `
  <div class="modal">
    <h1>${titulo}</h1>
    <p>${contenido}</p>
  </div>
`;
element.innerHTML = html;

/* ✓ CORRECTO: Usar templates en app/ui/html/ */
// Ver sección "Estructura de Componentes - Templates HTML"
```

### CONVENCIONES DE NOMBRES EN JAVASCRIPT

```javascript
/* Constantes en UPPER_SNAKE_CASE */
const API_BASE_URL = 'https://api.example.com';
const TIMEOUT_MILISEGUNDOS = 5000;

/* Variables y funciones en camelCase */
let usuarioActual = null;
function obtenerDatosDelServidor() { }
const calcularTotal = (items) => { };

/* Clases en PascalCase */
class GestorDescarga { }
class ModalConfirmacion { }
```

---

## ESTRUCTURA DE COMPONENTES

### WEB COMPONENTS

Todos los componentes de UI deben ser **Web Components** _(o la mayor parte)_.

### ARCHIVO DE COMPONENTE

Cada componente debe tener esta estructura:

```
app/ui/utils/components/
├── componente-nombre/
│   ├── componente-nombre.js      # Lógica del componente
│   ├── componente-nombre.css     # Estilos scoped
│   └── componente-nombre.html    # Plantilla
```

### EJEMPLO DE COMPONENTE: componente-boton.js

```javascript
/**
 * Componente de Botón Reutilizable
 * 
 * Componente Web Component con API pública accesible desde HTML.
 * Limpia automáticamente event listeners en disconnectedCallback para evitar memory leaks.
 * 
 * @class ComponenteBoton
 * @extends HTMLElement
 * 
 * @example
 * <!-- Uso básico -->
 * <componente-boton tipo="primario" deshabilitado="false">
 *   Haz clic aquí
 * </componente-boton>
 * 
 * <!-- Uso con data- attributes -->
 * <componente-boton data-tipo="primario" data-deshabilitado="false">
 *   Botón configurado
 * </componente-boton>
 * 
 * <!-- Acceso desde JavaScript -->
 * <script>
 *   const boton = document.querySelector('componente-boton');
 *   boton.tipo = 'secundario';
 *   boton.deshabilitado = true;
 *   boton.addEventListener('componente-boton:click', (e) => {
 *     console.log('Botón presionado:', e.detail);
 *   });
 * </script>
 * 
 * @property {string} tipo - Tipo de botón: 'primario', 'secundario', 'peligro'
 * @property {boolean} deshabilitado - Si el botón está deshabilitado
 * @property {string} icono - Nombre del icono a mostrar (opcional)
 * 
 * @fires componente-boton:click - Evento personalizado disparado al hacer clic
 */
class ComponenteBoton extends HTMLElement {
  /**
   * Atributos observados por el componente
   * @static
   * @type {string[]}
   */
  static get observedAttributes() {
    return ['tipo', 'deshabilitado', 'icono'];
  }

  /**
   * Constructor del componente
   * Inicializa el Shadow DOM
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.eventListeners = [];
  }

  /**
   * Se ejecuta cuando el elemento es insertado en el DOM
   * Carga la plantilla, aplica estilos e inicializa data- attributes
   * @private
   */
  connectedCallback() {
    this.initializeFromDataAttributes();
    this.renderTemplate();
    this.setupEventListeners();
  }

  /**
   * Se ejecuta cuando el elemento es removido del DOM
   * Limpia event listeners y referencias para evitar memory leaks
   * @private
   */
  disconnectedCallback() {
    this.destroy();
  }

  /**
   * Se ejecuta cuando un atributo observado cambia
   * @param {string} nombreAtributo - Nombre del atributo que cambió
   * @param {string} valorAnterior - Valor anterior del atributo
   * @param {string} valorNuevo - Nuevo valor del atributo
   * @private
   */
  attributeChangedCallback(nombreAtributo, valorAnterior, valorNuevo) {
    if (valorAnterior === valorNuevo) return;
    this.renderTemplate();
  }

  /**
   * Renderiza la plantilla y aplica estilos
   * @private
   */
  async renderTemplate() {
    try {
      const template = await this.loadTemplate();
      this.shadowRoot.innerHTML = '';
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this.applyStyles();
    } catch (error) {
      console.error('Error al renderizar componente-boton:', error);
    }
  }

  /**
   * Carga la plantilla HTML del componente
   * @private
   * @returns {Promise<HTMLTemplateElement>}
   */
  async loadTemplate() {
    const response = await fetch('/app/ui/utils/componentes/componente-boton/componente-boton.html');
    const html = await response.text();
    const template = document.createElement('template');
    template.innerHTML = html;
    return template;
  }

  /**
   * Aplica los estilos scoped al componente
   * @private
   */
  async applyStyles() {
    const style = document.createElement('style');
    const css = await fetch('/app/ui/utils/componentes/componente-boton/componente-boton.css')
      .then(res => res.text());
    style.textContent = css;
    this.shadowRoot.appendChild(style);
  }

  /**
   * Configura los event listeners del componente
   * Registra listeners para limpiarlos en destroy()
   * @private
   */
  setupEventListeners() {
    const boton = this.shadowRoot.querySelector('button');
    if (boton) {
      const clickHandler = (e) => this.handleClick(e);
      boton.addEventListener('click', clickHandler);
      this.eventListeners.push({ target: boton, event: 'click', handler: clickHandler });
    }
  }

  /**
   * Inicializa propiedades desde data- attributes
   * Permite configurar el componente directamente en HTML
   * @private
   */
  initializeFromDataAttributes() {
    if (this.dataset.tipo) {
      this.tipo = this.dataset.tipo;
    }
    if (this.dataset.deshabilitado !== undefined) {
      this.deshabilitado = this.dataset.deshabilitado === 'true';
    }
    if (this.dataset.icono) {
      this.setAttribute('icono', this.dataset.icono);
    }
  }

  /**
   * Destruye el componente y limpia recursos
   * Remueve todos los event listeners para evitar memory leaks
   * @public
   */
  destroy() {
    this.eventListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = '';
    }
  }

  /**
   * Manejador del evento click
   * @private
   * @param {MouseEvent} evento
   */
  handleClick(evento) {
    if (this.deshabilitado) {
      evento.preventDefault();
      return;
    }
    
    this.dispatchEvent(new CustomEvent('componente-boton:click', {
      detail: { tipo: this.tipo },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Getter para el atributo deshabilitado
   * @returns {boolean}
   */
  get deshabilitado() {
    return this.hasAttribute('deshabilitado');
  }

  /**
   * Setter para el atributo deshabilitado
   * @param {boolean} valor
   */
  set deshabilitado(valor) {
    if (valor) {
      this.setAttribute('deshabilitado', '');
    } else {
      this.removeAttribute('deshabilitado');
    }
  }

  /**
   * Getter para el tipo de botón
   * @returns {string}
   */
  get tipo() {
    return this.getAttribute('tipo') || 'secundario';
  }

  /**
   * Setter para el tipo de botón
   * @param {string} valor
   */
  set tipo(valor) {
    this.setAttribute('tipo', valor);
  }

  /**
   * API PÚBLICA DEL COMPONENTE
   * 
   * Métodos públicos disponibles para interacción desde JavaScript:
   * 
   * - destroy(): Limpia recursos y event listeners
   * - tipo (getter/setter): Obtiene o establece el tipo de botón
   * - deshabilitado (getter/setter): Obtiene o establece si está deshabilitado
   * 
   * Data- attributes soportados (se sincronizan automáticamente):
   * - data-tipo: Tipo de botón
   * - data-deshabilitado: Si el botón está deshabilitado ("true" o "false")
   * - data-icono: Nombre del icono
   * 
   * Y entre otros que el componente amerite
   */
}

// Registrar el componente
customElements.define('componente-boton', ComponenteBoton);
```

### PLANTILLA HTML: componente-boton.html

```html
<template id="plantilla-componente-boton">
  <button class="componente-boton" part="boton">
    <slot></slot>
  </button>
</template>

<script>
  // Exportar para uso en módulos
  export const plantillaComponenteBoton = document.getElementById('plantilla-componente-boton');
</script>
```

### ESTILOS: componente-boton.css

```css
/* ✓ Importar variables globales en cada componente */
@import url('../../css/variables.css');

/* Estilos scoped del componente boton */
:host {
  display: inline-block;
}

.componente-boton {
  padding: var(--espacio-sm) var(--espacio-md);
  border: none;
  border-radius: var(--radio-md);
  cursor: pointer;
  font-family: var(--fuente-principal);
  font-size: var(--tamaño-md);
  font-weight: var(--peso-medio);
  transition: var(--transicion-normal);
  outline: none;
}

/* Variante primaria */
:host([tipo="primario"]) .componente-boton {
  background-color: var(--color-primario);
  color: var(--color-texto-invertido);
}

:host([tipo="primario"]) .componente-boton:hover:not(:disabled) {
  background-color: var(--color-primario-hover);
  transform: translateY(-2px);
  box-shadow: var(--sombra-md);
}

/* Variante secundaria */
:host([tipo="secundario"]) .componente-boton {
  background-color: transparent;
  color: var(--color-primario);
  border: 1px solid var(--color-primario);
}

:host([tipo="secundario"]) .componente-boton:hover:not(:disabled) {
  background-color: var(--color-primario-light);
}

/* Estado deshabilitado */
:host([deshabilitado]) .componente-boton {
  opacity: 0.5;
  cursor: not-allowed;
}

:host([deshabilitado]) .componente-boton:hover {
  transform: none;
  background-color: inherit;
}
```

### API PÚBLICA Y DATA- ATTRIBUTES

Todos los componentes deben exponer una API pública clara y soportar configuración mediante `data-` attributes en HTML.

#### GESTIÓN DE RECURSOS (MEMORY LEAKS)

```javascript
/**
 * Constructor - Inicializa el array para rastrear event listeners
 */
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
  this.eventListeners = [];  // Array para almacenar referencias
}

/**
 * disconnectedCallback - Limpia automáticamente cuando se remueve del DOM
 * ✓ SIEMPRE implementar para evitar memory leaks
 */
disconnectedCallback() {
  this.destroy();  // Llama al método de limpieza
}

/**
 * destroy() - Limpia event listeners y referencias a objetos
 * @public - Método público para limpieza manual si es necesario
 */
destroy() {
  this.eventListeners.forEach(({ target, event, handler }) => {
    target.removeEventListener(event, handler);
  });
  this.eventListeners = [];

  if (this.shadowRoot) {
    this.shadowRoot.innerHTML = '';
  }
}
```

#### REGISTRAR EVENT LISTENERS CORRECTAMENTE

```javascript
setupEventListeners() {
  const boton = this.shadowRoot.querySelector('button');
  if (boton) {
    // Crear referencia al handler
    const clickHandler = (e) => this.handleClick(e);
    
    // Agregar listener
    boton.addEventListener('click', clickHandler);
    
    // Registrar en array para cleanup
    this.eventListeners.push({
      target: boton,
      event: 'click',
      handler: clickHandler
    });
  }
}
```

#### USAR DATA- ATTRIBUTES

```javascript
/**
 * initializeFromDataAttributes() - Inicializa desde data- en HTML
 * Permite configurar el componente directamente en el markup
 * @private
 */
initializeFromDataAttributes() {
  if (this.dataset.tipo) {
    this.tipo = this.dataset.tipo;
  }
  if (this.dataset.deshabilitado !== undefined) {
    this.deshabilitado = this.dataset.deshabilitado === 'true';
  }
  if (this.dataset.icono) {
    this.setAttribute('icono', this.dataset.icono);
  }
}
```

#### USO EN HTML

```html
<!-- Opción 1: Atributos estándar -->
<componente-boton tipo="primario" deshabilitado="false">
  Botón Simple
</componente-boton>

<!-- Opción 2: Data- attributes (se sincronizan automáticamente) -->
<componente-boton data-tipo="primario" data-deshabilitado="false">
  Botón Configurado
</componente-boton>

<!-- Opción 3: JavaScript con API pública -->
<script>
  const boton = document.querySelector('componente-boton');
  
  // Acceso a getters/setters públicos
  boton.tipo = 'secundario';
  boton.deshabilitado = true;
  
  // Event listeners personalizados
  boton.addEventListener('componente-boton:click', (e) => {
    console.log('Evento:', e.detail);
  });
  
  // Limpiar manualmente si es necesario
  // boton.destroy();
</script>
```

#### CHECKLIST PARA COMPONENTES

- [ ] ✅ Tengo `eventListeners = []` en constructor
- [ ] ✅ Implementé `disconnectedCallback()` que llama a `destroy()`
- [ ] ✅ Implementé método `destroy()` público
- [ ] ✅ Registro todos los listeners en `setupEventListeners()`
- [ ] ✅ Tengo `initializeFromDataAttributes()` en `connectedCallback()`
- [ ] ✅ Expongo getters y setters públicos para configuración
- [ ] ✅ Disparo eventos personalizados (`CustomEvent`)
- [ ] ✅ Documenté la API pública en JSDoc
- [ ] ✅ Probé que no haya memory leaks (DevTools → Memory)

---

## SEGURIDAD

### PREVENCIÓN DE XSS (CROSS-SITE SCRIPTING)

**Nunca uses `innerHTML` con datos dinámicos:**

```javascript
/* ✗ PELIGROSO */
const usuario = { nombre: '<img src=x onerror="alert(\'XSS\')">' };
elemento.innerHTML = `<h1>${usuario.nombre}</h1>`;

/* ✓ SEGURO */
const usuario = { nombre: '<img src=x onerror="alert(\'XSS\')">' };
elemento.textContent = usuario.nombre;
```

### SANITIZACIÓN DE DATOS

Si necesitas renderizar HTML, sanitiza los datos:

```javascript
/**
 * Sanitiza una cadena para evitar inyecciones XSS
 * @param {string} html - HTML a sanitizar
 * @returns {string} HTML sanitizado
 */
function sanitizarHTML(html) {
  const element = document.createElement('div');
  element.textContent = html;
  return element.innerHTML;
}
```

### VALIDACIÓN DE DATOS EXTERNOS

```javascript
/**
 * Valida y filtra datos de APIs externas
 * @param {Object} datos - Datos a validar
 * @returns {Object} Datos validados
 */
function validarDatosAPI(datos) {
  if (!datos || typeof datos !== 'object') {
    throw new Error('Datos inválidos');
  }

  return {
    nombre: String(datos.nombre || '').trim(),
    url: validarURL(datos.url),
    descripcion: String(datos.descripcion || '').trim()
  };
}

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {string} URL validada
 * @throws {Error} Si la URL no es válida
 */
function validarURL(url) {
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Protocolo no permitido');
    }
    return urlObj.href;
  } catch (error) {
    throw new Error(`URL inválida: ${error.message}`);
  }
}
```

---

## PRINCIPIOS DE MODULARIZACIÓN

Seguimos el principio de **Separation of Concerns (SoC)** para mantener el código modular y mantenible.

### CAPAS DE LA APLICACIÓN

```
API (Datos)
    ↓
Lógica de Negocio (Servicios)
    ↓
UI (Componentes)
    ↓
Utilidades (Helpers)
```

### EJEMPLO: GESTOR DE DESCARGAS

#### 1. CAPA DE API: `app/backend/api/servicio-descarga.js`

```javascript
/**
 * Servicio para manejar descargas
 * @module ServicioDescarga
 */

/**
 * Inicia una descarga desde la API
 * @param {string} urlArchivo - URL del archivo a descargar
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {Promise<Object>} Estado de la descarga
 */
export async function iniciarDescarga(urlArchivo, nombreArchivo) {
  try {
    const respuesta = await fetch(urlArchivo, { method: 'GET' });
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    return {
      exito: true,
      datos: await respuesta.blob(),
      nombreArchivo
    };
  } catch (error) {
    console.error('Error en iniciarDescarga:', error);
    return {
      exito: false,
      error: error.message
    };
  }
}
```

#### 2. CAPA DE LÓGICA: `app/ui/js/gestor-descargas.js`

```javascript
/**
 * Gestor de Descargas
 * Coordina entre la API y la UI
 * @module GestorDescargas
 */

import { iniciarDescarga } from '../../backend/api/servicio-descarga.js';
import { mostrarToastDescarga } from '../utils/helpers/descarga-toast.js';

/**
 * Descarga un archivo y lo guarda localmente
 * @param {string} urlArchivo - URL del archivo
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {Promise<void>}
 */
export async function descargarArchivo(urlArchivo, nombreArchivo) {
  mostrarToastDescarga('Iniciando descarga...', 'info');

  const resultado = await iniciarDescarga(urlArchivo, nombreArchivo);

  if (resultado.exito) {
    guardarArchivoLocal(resultado.datos, resultado.nombreArchivo);
    mostrarToastDescarga('Descarga completada', 'exito');
  } else {
    mostrarToastDescarga(`Error: ${resultado.error}`, 'error');
  }
}

/**
 * Guarda un archivo localmente
 * @private
 * @param {Blob} blob - Datos del archivo
 * @param {string} nombreArchivo - Nombre del archivo
 */
function guardarArchivoLocal(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
```

#### 3. CAPA DE UI: `app/ui/utils/componentes/componente-descarga/componente-descarga.js`

```javascript
/**
 * Componente de Descarga
 * @class ComponenteDescarga
 * @extends HTMLElement
 */
class ComponenteDescarga extends HTMLElement {
  static get observedAttributes() {
    return ['url', 'nombre'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const boton = this.shadowRoot.querySelector('button');
    boton?.addEventListener('click', () => this.handleDescargar());
  }

  /**
   * Maneja el evento de descarga
   * @private
   */
  async handleDescargar() {
    const { descargarArchivo } = await import('../../../js/gestor-descargas.js');
    await descargarArchivo(this.url, this.nombre);
  }

  get url() {
    return this.getAttribute('url') || '';
  }

  get nombre() {
    return this.getAttribute('nombre') || 'descarga';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <button class="componente-descarga__boton">Descargar</button>
    `;
  }
}

customElements.define('componente-descarga', ComponenteDescarga);
```

#### 4. UTILIDADES: `app/ui/utils/helpers/descarga-toast.js`

```javascript
/**
 * Utilidad para mostrar notificaciones de descarga
 * @module DescargaToast
 */

/**
 * Muestra un toast de descarga
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo: 'info', 'exito', 'error'
 * @returns {void}
 */
export function mostrarToastDescarga(mensaje, tipo = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${tipo}`;
  toast.textContent = mensaje;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}
```

---

## DOCUMENTACIÓN

### COMENTARIOS JSDOC

Todos los archivos JavaScript deben incluir documentación completa usando **JSDoc**. Los comentarios simples como `//` solo están permitidos para eliminar logs temporales.

### ESTRUCTURA DE JSDOC

```javascript
/**
 * Descripción breve de la función
 * 
 * Descripción más detallada si es necesaria. Explica el propósito,
 * comportamiento especial, o consideraciones importantes.
 * 
 * @param {type} nombreParametro - Descripción del parámetro
 * @param {type} [nombreParametroOpcional] - Parámetro opcional
 * @param {type} [nombreConDefecto="valor"] - Parámetro con defecto
 * 
 * @returns {type} Descripción del valor retornado
 * 
 * @throws {Error} Descripción de cuándo se lanza el error
 * 
 * @example
 * // Uso básico
 * const resultado = funcionEjemplo('entrada');
 * console.log(resultado);
 * 
 * @see {@link ../otro-archivo.js} para funciones relacionadas
 * 
 * @deprecated Usar {@link nuevaFuncion} en su lugar
 */
function funcionEjemplo(parametro) {
  // Implementación
}
```

### EJEMPLO COMPLETO CON JSDOC (preferiblemente en ingles)

```javascript
/**
 * Obtiene el usuario actual del almacenamiento local
 * 
 * Carga el usuario desde localStorage y valida su estructura.
 * Si el usuario es inválido o no existe, retorna null.
 * 
 * @function obtenerUsuarioActual
 * @returns {Object|null} Objeto con propiedades del usuario o null
 * @returns {string} returns.id - ID único del usuario
 * @returns {string} returns.nombre - Nombre del usuario
 * @returns {string} returns.email - Email del usuario
 * 
 * @throws {Error} Si hay error al parsear JSON corrompido
 * 
 * @example
 * const usuario = obtenerUsuarioActual();
 * if (usuario) {
 *   console.log(`Bienvenido, ${usuario.nombre}`);
 * } else {
 *   console.log('No hay usuario autenticado');
 * }
 * 
 * @see {@link ./gestor-autenticacion.js}
 */
export function obtenerUsuarioActual() {
  try {
    const datosUsuario = localStorage.getItem('usuario');
    if (!datosUsuario) return null;

    const usuario = JSON.parse(datosUsuario);
    
    if (!usuario.id || !usuario.nombre) {
      return null;
    }

    return usuario;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
}
```

### DOCUMENTAR CLASES

```javascript
/**
 * Gestor de Estado de la Aplicación
 * 
 * Mantiene el estado central de la aplicación y notifica a los
 * suscriptores cuando hay cambios.
 * 
 * @class GestorEstado
 * 
 * @example
 * const gestor = new GestorEstado({ usuario: null });
 * 
 * gestor.subscribe('usuario', (nuevoUsuario) => {
 *   console.log('Usuario actualizado:', nuevoUsuario);
 * });
 * 
 * gestor.actualizar('usuario', { nombre: 'Juan' });
 */
export class GestorEstado {
  /**
   * Constructor del gestor de estado
   * @param {Object} estadoInicial - Estado inicial de la aplicación
   */
  constructor(estadoInicial = {}) {
    this.estado = estadoInicial;
    this.suscriptores = new Map();
  }

  /**
   * Suscribe una función a cambios en una clave del estado
   * @param {string} clave - Clave del estado a observar
   * @param {Function} callback - Función a ejecutar cuando cambie
   * @returns {Function} Función para desuscribirse
   */
  subscribe(clave, callback) {
    if (!this.suscriptores.has(clave)) {
      this.suscriptores.set(clave, []);
    }
    
    this.suscriptores.get(clave).push(callback);

    return () => {
      const callbacks = this.suscriptores.get(clave);
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    };
  }

  /**
   * Actualiza una clave del estado y notifica suscriptores
   * @param {string} clave - Clave a actualizar
   * @param {*} valor - Nuevo valor
   * @throws {Error} Si la clave no existe en el estado
   */
  actualizar(clave, valor) {
    if (!(clave in this.estado)) {
      throw new Error(`Clave "${clave}" no existe en el estado`);
    }

    this.estado[clave] = valor;
    this.notificar(clave);
  }

  /**
   * Notifica a todos los suscriptores de una clave
   * @private
   * @param {string} clave - Clave que cambió
   */
  notificar(clave) {
    const callbacks = this.suscriptores.get(clave) || [];
    callbacks.forEach(callback => {
      try {
        callback(this.estado[clave]);
      } catch (error) {
        console.error('Error en suscriptor de estado:', error);
      }
    });
  }
}
```

### NO USAR COMENTARIOS `//` PARA EXPLICAR CÓDIGO

```javascript
/* ✗ INCORRECTO */
// Obtener el usuario del estado
const usuario = estado.usuario;
// Si existe usuario
if (usuario) {
  // Mostrar su nombre
  console.log(usuario.nombre);
}

/* ✓ CORRECTO: El código debe ser auto-explicativo */
const usuario = obtenerUsuarioDelEstado();
if (usuario) {
  mostrarNombreDeUsuario(usuario.nombre);
}

/* ✓ CORRECTO: Si necesitas comentarios, usa JSDoc */
/**
 * Obtiene el usuario actual del estado global
 * @returns {Object|null}
 */
function obtenerUsuarioDelEstado() {
  return estado.usuario;
}
```

### COMENTARIOS `//` SOLO PARA LOGS TEMPORALES

```javascript
// TODO: Implementar validación de email
function registrarUsuario(email) {
  // console.log('Debug: email recibido', email);
  return guardarEnBaseDatos(email);
}
```

---

## CHECKLIST DE CONTRIBUCIÓN

Antes de hacer un pull request, verifica:

### GENERAL
- [ ] He seguido la estructura de carpetas definida
- [ ] Todos los archivos están en kebab-case
- [ ] He ejecutado `npm run format` en mis cambios
- [ ] He documentado con JSDoc todas las funciones y clases
- [ ] No tengo comentarios `//` innecesarios (solo para quitar logs de debug temporales)

### JAVASCRIPT
- [ ] Mi código no contiene `innerHTML`
- [ ] He validado datos externos antes de usarlos
- [ ] He aplicado SoC en mi código
- [ ] Las funciones son pequeñas y tienen una única responsabilidad
- [ ] He usado camelCase para variables y funciones
- [ ] He usado UPPER_SNAKE_CASE para constantes
- [ ] He mantenido el codigo modular en todo momento y escalable

### CSS
- [ ] Mis CSS están divididos por responsabilidades
- [ ] He usado variables de `app/ui/css/variables.css` en todos mis estilos
- [ ] Mi CSS complejo está dividido en archivos separados con @import
- [ ] Los estilos CSS usan BEM y están scoped
- [ ] No tengo `!important` sin justificación
- [ ] No tengo estilos inline en HTML

### COMPONENTES WEB COMPONENTS (Si aplica)
- [ ] He usado Web Components para nuevos componentes de UI
- [ ] He implementado `destroy()` para limpiar event listeners
- [ ] He implementado `disconnectedCallback()` que llama a `destroy()`
- [ ] Registro todos los event listeners en array para cleanup
- [ ] He implementado `initializeFromDataAttributes()`
- [ ] Tengo getters y setters públicos para la API
- [ ] Disparo eventos personalizados (`CustomEvent`)
- [ ] La estructura es: `componente-nombre/` con `.js`, `.css`, `.html`
- [ ] He documentado la API pública en JSDoc con examples
- [ ] He probado que no hay memory leaks (DevTools Memory)

---

## CONTACTO

Si tienes preguntas sobre estas convenciones, abre un issue o contacta a los mantenedores del proyecto.

¡Gracias por contribuir! 🎉
