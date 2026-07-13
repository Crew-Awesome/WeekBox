# Roadmap de reorganización y mejora continua

## Principio guía

No te enfoques en hacer muchas cosas a la vez.
Es mejor completar 2 o 3 mejoras bien hechas y verificadas por día, que dejar 10 cambios incompletos o a medias.

Reglas:
- Priorizar calidad sobre cantidad.
- Hacer cambios pequeños, medibles y verificables.
- Cada mejora debe dejar el proyecto más estable, más legible y más fácil de mantener.

---

## Cambios Diarios

### Cada día se debe cumplir al menos lo siguiente:

- [ ] Revisar el flujo principal del launcher: seleccionar engine, elegir versión, descargar, instalar, lanzar.
- [ ] Verificar que el proyecto sigue arrancando sin errores nuevos.
- [ ] Mejorar solo una parte concreta del código, no reescribir módulos completos sin necesidad.
- [ ] Hacer una validación mínima del cambio realizado: no asumir que funciona solo porque “se ve bien”.
- [ ] Documentar lo que se aprendió o lo que quedó pendiente para la siguiente sesión.
- [ ] Evitar dejar cambios sin terminar.

### Regla de productividad

- 1 tarea bien hecha + 1 validación real = mejor resultado que 5 tareas a medias.
- Si una mejora requiere más de una sesión entera, dividirla en subtareas pequeñas.

---

## Checklist por archivo

### [public/launcher/src/core/scripts.js](public/launcher/src/core/scripts.js)

- [ ] Mantener el bootstrap inicial simple y legible.
- [ ] Revisar si la carga de módulos sigue teniendo un orden claro y estable.
- [ ] Evitar añadir más lógica de negocio aquí.
- [ ] Si se cambia el sistema de carga, hacerlo con un cambio incremental y verificable.
- [ ] Confirmar que no se rompe el arranque de la app al mover o añadir módulos.

### [public/launcher/src/core/scripts.jsonc](public/launcher/src/core/scripts.jsonc)

- [ ] Reducir dependencia de órdenes manuales cuando sea posible.
- [ ] Mantener una lista de carga mínima y ordenada.
- [ ] Documentar el motivo de cada módulo añadido.
- [ ] Eliminar entradas obsoletas o duplicadas.
- [ ] Verificar que el orden de carga sigue siendo determinista.

### [public/launcher/src/core/router.js](public/launcher/src/core/router.js)

- [ ] Asegurar que la navegación entre vistas no rompa el estado de la app.
- [ ] Mejorar manejo de errores y mensajes de carga.
- [ ] Reducir acoplamiento entre el router y el resto de componentes.
- [ ] Mantener el flujo de navegación simple y predecible.
- [ ] Añadir validaciones si una vista no existe o falla al cargar.

### [public/launcher/src/ui/sidebar.js](public/launcher/src/ui/sidebar.js)

- [ ] Separar mejor la lógica de selección de engine de la manipulación visual del sidebar.
- [ ] Hacer más robusta la carga de engines y versiones.
- [ ] Eliminar lógica duplicada o repetida.
- [ ] Comprobar el estado de loading y error cuando una engine no carga.
- [ ] Mejorar el feedback visual cuando el usuario hace clic.

### [public/launcher/src/ui/engines/index.js](public/launcher/src/ui/engines/index.js)

- [ ] Mejorar el manejo de versión seleccionada.
- [ ] Reducir el número de responsabilidades mezcladas en una sola vista.
- [ ] Separar la lógica de descarga, dropdown y notas de release.
- [ ] Añadir mensajes de error más claros cuando no hay una descarga compatible.
- [ ] Validar que el estado del botón cambia correctamente durante descarga e instalación.

### [public/launcher/src/utils/FS.js](public/launcher/src/utils/FS.js)

- [ ] Mejorar el flujo completo de descarga e instalación.
- [ ] Añadir manejo de reintentos y fallos más claros.
- [ ] Validar el archivo antes de considerar la instalación correcta.
- [ ] Mejorar la extracción de ZIP con control de errores.
- [ ] Exponer más feedback al usuario para que se vea el progreso real.
- [ ] Revisar rutas, nombres de archivo y compatibilidad por sistema operativo.

### [public/launcher/src/API/gamebanana.js](public/launcher/src/API/gamebanana.js)

- [ ] Centralizar la normalización de respuestas externas.
- [ ] Mejorar el manejo de errores cuando GameBanana responde mal o tarda demasiado.
- [ ] Reducir la cantidad de lógica de transformación mezclada con el fetch.
- [ ] Añadir validaciones para evitar datos vacíos o corruptos.
- [ ] Preparar el módulo para reutilizarse en más pantallas del proyecto.

### [public/launcher/src/ui/home/index.js](public/launcher/src/ui/home/index.js)

- [ ] Mejorar el ciclo de vida de la vista home.
- [ ] Asegurar que el scroll, carousel y grid se destruyen o recrean correctamente.
- [ ] Reducir dependencia de eventos globales innecesarios.
- [ ] Revisar que el estado de la home se restaure bien al volver de otra vista.

### [public/launcher/src/ui/home/search.js](public/launcher/src/ui/home/search.js)

- [ ] Mejorar el debounce y el comportamiento de input.
- [ ] Evitar búsquedas redundantes en secuencia.
- [ ] Dar feedback claro cuando la búsqueda no devuelve resultados.
- [ ] Mantener la lógica simple y fácil de probar.

### [public/launcher/src/ui/home/modal/index.js](public/launcher/src/ui/home/modal/index.js)

- [ ] Mejorar el estado del modal al abrirlo/cerrarlo.
- [ ] Reducir riesgo de manipulación de DOM frágil.
- [ ] Verificar que el contenido cargado se actualiza correctamente cada vez.
- [ ] Mantener el modal en un estado consistente cuando falla la carga de datos.

### [public/launcher/src/ui/home/modal/carousel.js](public/launcher/src/ui/home/modal/carousel.js)

- [ ] Revisar el autoplay y el estado de visualización.
- [ ] Evitar fugas de intervalos o listeners duplicados.
- [ ] Mantener la lógica del carrusel separada y estable.

### [public/launcher/src/ui/home/grid.js](public/launcher/src/ui/home/grid.js)

- [ ] Mejorar la renderización de cards y paginación.
- [ ] Hacer el estado de búsqueda y filtros más consistente.
- [ ] Reducir lógica muy acoplada a la UI.
- [ ] Validar que los items renderizados tengan datos completos.

### [public/launcher/src/ui/home/carousel.js](public/launcher/src/ui/home/carousel.js)

- [ ] Mejorar el comportamiento del carrusel en resize y cambio de estado.
- [ ] Evitar errores al inicializar varias veces.
- [ ] Dejar un comportamiento claro para autoplay y manual interaction.

### [public/launcher/src/ui/home/searchDropdown.js](public/launcher/src/ui/home/searchDropdown.js)

- [ ] Mejorar el historial y la visibilidad del dropdown.
- [ ] Validar que las búsquedas recientes no se dupliquen.
- [ ] Evitar comportamientos raros al cerrar o abrir la búsqueda.

---

## Hoja de ruta priorizada

### Fase 1: estabilizar el flujo de usuario

- [ ] Hacer que descargar e instalar sea confiable.
- [ ] Mejorar mensajes de error y tiempos de espera.
- [ ] Asegurar que la versión seleccionada se aplique bien en la UI.

### Fase 2: reducir acoplamiento

- [ ] Separar lógica de negocio de manipulación del DOM.
- [ ] Evitar que cada archivo dependa de demasiados globals.
- [ ] Crear pequeñas piezas reutilizables donde haya lógica repetida.

### Fase 3: mejorar seguridad y robustez

- [ ] Sanitizar contenido externo antes de renderizarlo.
- [ ] Validar URLs de descarga y rutas de archivo.
- [ ] Revisar comandos de extracción y ejecución local.

### Fase 4: preparar la arquitectura futura

- [ ] Pasar gradualmente a un structure más mantenible.
- [ ] Reducir dependencia de carga manual de scripts.
- [ ] Introducir módulos con responsabilidades más claras.

---

## Criterio de éxito diario

Cada día se considera exitoso si:

- [ ] se hizo al menos una mejora útil en un archivo real,
- [ ] esa mejora quedó validada,
- [ ] la app sigue funcionando sin introducir regresiones evidentes,
- [ ] el código quedó más claro que antes.

> Si una sesión solo logra una mejora bien hecha y estable, ya es una buena sesión. No hace falta “hacer mucho”. Lo importante es hacer bien lo que afecta al usuario y al mantenimiento del proyecto.
