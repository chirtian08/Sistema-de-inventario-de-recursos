// ==========================================================================
// NAVEGACIÓN ENTRE SECCIONES (Inicio, Inventario, Eventos, Personal)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Todos los <li> del menú lateral que tienen un data-page
  const opcionesMenu = document.querySelectorAll("nav ul li[data-page]");

  // Todos los bloques de contenido (uno por cada opción del menú)
  const paginas = document.querySelectorAll(".page");

  opcionesMenu.forEach((opcion) => {
    opcion.addEventListener("click", () => {
      const idPagina = opcion.dataset.page; // "inicio", "inventario", etc.
      mostrarPagina(idPagina);
      marcarOpcionActiva(opcion, opcionesMenu);
    });
  });

  function mostrarPagina(idPagina) {
    paginas.forEach((pagina) => {
      // El id de cada div es "page-inicio", "page-inventario", etc.
      const coincide = pagina.id === `page-${idPagina}`;
      pagina.classList.toggle("active", coincide);
    });
  }

  function marcarOpcionActiva(opcionSeleccionada, todasLasOpciones) {
    todasLasOpciones.forEach((op) => op.classList.remove("active"));
    opcionSeleccionada.classList.add("active");
  }
});
