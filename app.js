// ==========================================================================
// 1. NAVEGACIÓN ENTRE SECCIONES (Inicio, Inventario, Eventos, Personal)
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

  // ==========================================================================
  // 2. LÓGICA DEL INVENTARIO DE RECURSOS (CAPTURA Y TABLA DINÁMICA)
  // ==========================================================================

  // Arreglo en memoria para ir guardando los recursos que agregues
  let inventario = [];

  // Captura de los elementos del formulario mediante sus IDs del HTML
  const inputNombre = document.getElementById("inp-nombre");
  const inputCategoria = document.getElementById("inp-categoria");
  const inputCantidad = document.getElementById("inp-cantidad");
  const inputEstado = document.getElementById("inp-estado");
  const botonAgregar = document.getElementById("btn-agregar");
  const tablaBody = document.getElementById("tabla-recursos-body");

  // Escuchar el clic del botón "Agregar recurso"
  botonAgregar.addEventListener("click", () => {
    // Extraer los valores escritos por el usuario quitando espacios extra
    const nombre = inputNombre.value.trim();
    const categoria = inputCategoria.value;
    const cantidad = parseInt(inputCantidad.value);
    const estado = inputEstado.value;

    // Validación estricta: Que no haya campos vacíos y la cantidad sea lógica
    if (nombre === "" || categoria === "" || isNaN(cantidad) || cantidad < 0) {
      alert("Por favor, completa todos los campos correctamente. La cantidad debe ser mayor o igual a 0.");
      return;
    }

    // Crear el objeto del nuevo recurso con un ID único basado en el tiempo actual
    const nuevoRecurso = {
      id: Date.now(),
      nombre: nombre,
      categoria: categoria,
      cantidad: cantidad,
      estado: estado
    };

    // Meter el recurso dentro de nuestra lista (arreglo)
    inventario.push(nuevoRecurso);

    // Limpiar las cajas del formulario para que queden listas para otro recurso
    limpiarFormulario();

    // Redibujar la tabla con los nuevos datos actualizados
    actualizarTabla();
  });

  // Función para resetear los inputs del formulario
  function limpiarFormulario() {
    inputNombre.value = "";
    inputCategoria.value = "";
    inputCantidad.value = "0"; // Resetea al valor por defecto
    inputEstado.value = "Disponible";
  }

  // Función encargada de borrar la tabla estática y pintar los datos reales
  function actualizarTabla() {
    // Limpiamos el HTML interno de la tabla
    tablaBody.innerHTML = "";

    // Si no hay elementos en el arreglo, volvemos a poner el mensaje por defecto
    if (inventario.length === 0) {
      tablaBody.innerHTML = `
        <tr>
          <td colspan="5">No hay recursos registrados aún.</td>
        </tr>
      `;
      return;
    }

    // Recorrer el arreglo e ir creando una fila (tr) por cada objeto guardado
    inventario.forEach((recurso) => {
      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td><strong>${recurso.nombre}</strong></td>
        <td>${recurso.categoria}</td>
        <td>${recurso.cantidad} u</td>
        <td><span style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${recurso.estado}</span></td>
        <td>
          <button class="btn-eliminar" data-id="${recurso.id}" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Eliminar
          </button>
        </td>
      `;

      tablaBody.appendChild(fila);
    });

    // Activar la escucha de clics para los botones de eliminar recién creados
    asignarEventosEliminar();
  }

  // Función para darle funcionalidad de borrado a cada fila
  function asignarEventosEliminar() {
    const botonesEliminar = document.querySelectorAll(".btn-eliminar");
    botonesEliminar.forEach((boton) => {
      boton.addEventListener("click", () => {
        const idEliminar = parseInt(boton.dataset.id);
        
        // Filtramos el arreglo para dejar por fuera el elemento que queremos borrar
        inventario = inventario.filter((recurso) => recurso.id !== idEliminar);
        
        // Volvemos a actualizar la tabla visual
        actualizarTabla();
      });
    });
  }
});