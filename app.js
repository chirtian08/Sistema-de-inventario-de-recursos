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

// ==========================================================================
// INVENTARIO — AGREGAR RECURSOS
// ==========================================================================
const btnAgregar = document.getElementById('btn-agregar');
let recursos = [];
btnAgregar.addEventListener('click', function() {
  const nombre    = document.getElementById('inp-nombre').value.trim();
  const categoria = document.getElementById('inp-categoria').value;
  const cantidad  = document.getElementById('inp-cantidad').value;
  const estado    = document.getElementById('inp-estado').value;

  // Validar que nombre y cantidad no estén vacíos
  if (!nombre || !cantidad || !categoria) {
    alert('Por favor completa todos los campos.');
    return;
  }

  // Crear el objeto recurso y guardarlo en el arreglo
  const recurso = {
    id:        Date.now(),
    nombre:    nombre,
    categoria: categoria,
    cantidad:  parseInt(cantidad),
    estado:    estado
  };

  recursos.push(recurso);

  // Mostrar en la tabla
  renderTabla();

  // Limpiar el formulario
  document.getElementById('inp-nombre').value   = '';
  document.getElementById('inp-cantidad').value = '';
});

function renderTabla() {
  const tbody = document.getElementById('tabla-recursos-body');

  if (recursos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No hay recursos registrados aún.</td></tr>';
    return;
  }

  let filas = '';
  recursos.forEach(function(r) {
    filas += '<tr>' +
      '<td>' + r.nombre + '</td>' +
      '<td>' + r.categoria + '</td>' +
      '<td>' + r.cantidad + '</td>' +
      '<td>' + r.estado + '</td>' +
      '<td><button onclick="eliminarRecurso(' + r.id + ')">Eliminar</button></td>' +
    '</tr>';
  });

  tbody.innerHTML = filas;
}

function eliminarRecurso(id) {
  recursos = recursos.filter(function(r) {
    return r.id !== id;
  });

  renderTabla();
}
