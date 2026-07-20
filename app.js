// ==========================================================================
// PUNTO 1: CONEXIÓN A FIREBASE (Semana 7)
// ==========================================================================
import { db } from './firebase-config.js';
import { 
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    setDoc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    sendEmailVerification // 👈 Agrega esta función aquí arriba
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const auth = getAuth(); // Inicializamos la autenticación

// --- ELEMENTOS DE LA INTERFAZ DE LOGIN ---
const loginSeccion = document.getElementById('login-seccion');
const appContenido = document.getElementById('app-contenido');
const btnIngresar = document.getElementById('btn-ingresar');
const btnRegistrar = document.getElementById('btn-registrar');
const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
const txtError = document.getElementById('login-error');

let usuarioActualId = null; // Guardará el ID del usuario logueado
let equipoActualId = null;  // Guardará el ID del equipo/empresa (compartido entre compañeros)
let limpiarEscuchaRecursos = null; // Para apagar la sincronización al cerrar sesión
const recursosRef = collection(db, "recursos");

// Referencias a las colecciones de Eventos y Personal
const eventosRef = collection(db, "eventos");
const personalRef = collection(db, "personal");

// ==========================================================================
// 1. NAVEGACIÓN ENTRE SECCIONES (Inicio, Inventario, Eventos, Personal)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  const opcionesMenu = document.querySelectorAll("nav ul li[data-page]");
  const paginas = document.querySelectorAll(".page");

  opcionesMenu.forEach((opcion) => {
    opcion.addEventListener("click", () => {
      const idPagina = opcion.dataset.page;
      mostrarPagina(idPagina);
      marcarOpcionActiva(opcion, opcionesMenu);
    });
  });

  function mostrarPagina(idPagina) {
    paginas.forEach((pagina) => {
      const coincide = pagina.id === `page-${idPagina}`;
      pagina.classList.toggle("active", coincide);
    });
  }

  function marcarOpcionActiva(opcionSeleccionada, todasLasOpciones) {
    todasLasOpciones.forEach((op) => op.classList.remove("active"));
    opcionSeleccionada.classList.add("active");
  }

  // ==========================================================================
  // 2. LÓGICA DEL INVENTARIO DE RECURSOS (CAPTURA Y ENVÍO A FIRESTORE)
  // ==========================================================================
  let inventario = [];

  const inputNombre = document.getElementById("inp-nombre");
  const inputCategoria = document.getElementById("inp-categoria");
  const inputCantidad = document.getElementById("inp-cantidad");
  const inputEstado = document.getElementById("inp-estado");
  const botonAgregar = document.getElementById("btn-agregar");
  const tablaBody = document.getElementById("tabla-recursos-body");

  botonAgregar.addEventListener("click", async () => {
    const nombre = inputNombre.value.trim();
    const categoria = inputCategoria.value;
    const cantidad = parseInt(inputCantidad.value);
    const estado = inputEstado.value;

    if (nombre === "" || categoria === "" || isNaN(cantidad) || cantidad < 0) {
      alert("Por favor, completa todos los campos correctamente. La cantidad debe ser mayor o igual a 0.");
      return;
    }

    const nuevoRecurso = {
      nombre: nombre,
      categoria: categoria,
      cantidad: cantidad,
      estado: estado,
      userId: usuarioActualId,
      equipoId: equipoActualId
    };

    try {
      botonAgregar.disabled = true;
      botonAgregar.textContent = "Guardando...";

      await addDoc(recursosRef, nuevoRecurso);
      limpiarFormulario();
      
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      alert("No se pudo guardar el recurso. Revisa tu conexión a internet.");
    } finally {
      botonAgregar.disabled = false;
      botonAgregar.textContent = "Agregar recurso";
    }
  });

  function limpiarFormulario() {
    inputNombre.value = "";
    inputCategoria.value = "";
    inputCantidad.value = "0";
    inputEstado.value = "Disponible";
    inputNombre.focus();
  }

  function getBadgeEstado(estado) {
    if (estado === 'Disponible') return 'badge-disponible';
    if (estado === 'En uso')     return 'badge-en-uso';
    if (estado === 'Dañado')     return 'badge-danado';
    return 'badge-disponible';
  }

  function actualizarTabla() {
    tablaBody.innerHTML = "";

    if (inventario.length === 0) {
      tablaBody.innerHTML = `
        <tr>
          <td colspan="5">No hay recursos registrados aún.</td>
        </tr>
      `;
      return;
    }

    inventario.forEach((recurso) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td><strong>${recurso.nombre}</strong></td>
        <td>${recurso.categoria}</td>
        <td>${recurso.cantidad} u</td>
        <td><span class="badge-estado ${getBadgeEstado(recurso.estado)}">${recurso.estado}</span></td>
        <td>
          <button class="btn-eliminar" data-id="${recurso.id}" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Eliminar
          </button>
        </td>
      `;
      tablaBody.appendChild(fila);
    });

    asignarEventosEliminar();
  }

  function asignarEventosEliminar() {
    const botonesEliminar = document.querySelectorAll(".btn-eliminar");
    botonesEliminar.forEach((boton) => {
      boton.addEventListener("click", async () => {
        const idEliminar = boton.dataset.id;
        try {
          boton.disabled = true;
          boton.textContent = "...";
          await deleteDoc(doc(db, "recursos", idEliminar));
        } catch (error) {
          console.error("Error al eliminar en Firestore:", error);
          alert("No se pudo eliminar el recurso. Revisa tu conexión.");
          boton.disabled = false;
          boton.textContent = "Eliminar";
        }
      });
    });
  }

  function actualizarEstadisticas() {
    const total = inventario.reduce((acumulado, recurso) => acumulado + (Number(recurso.cantidad) || 0), 0);
    const disponibles = inventario.filter(r => r.estado === 'Disponible').reduce((acumulado, recurso) => acumulado + (Number(recurso.cantidad) || 0), 0);
    const enUso = inventario.filter(r => r.estado === 'En uso').reduce((acumulado, recurso) => acumulado + (Number(recurso.cantidad) || 0), 0);
    const danados = inventario.filter(r => r.estado === 'Dañado' || r.estado === 'Dañada').reduce((acumulado, recurso) => acumulado + (Number(recurso.cantidad) || 0), 0);

    const totalEl = document.getElementById('total-recursos') || document.getElementById('stat-total');
    const disponiblesEl = document.getElementById('recursos-disponibles') || document.getElementById('stat-disponibles');
    const enUsoEl = document.getElementById('recursos-en-uso') || document.getElementById('stat-en-uso');
    const danadosEl = document.getElementById('recursos-danados') || document.getElementById('stat-danados');

    if (totalEl) totalEl.textContent = total;
    if (disponiblesEl) disponiblesEl.textContent = disponibles;
    if (enUsoEl) enUsoEl.textContent = enUso;
    if (danadosEl) danadosEl.textContent = danados;
  }

  // ==========================================================================
  // PUNTO 5: ESCUCHA EN TIEMPO REAL CON FILTRO PRIVADO
  // ==========================================================================
  function escucharRecursosEnTiempoReal() {
    if (!equipoActualId) return;

    const consultaFiltrada = query(recursosRef, where("equipoId", "==", equipoActualId));

    limpiarEscuchaRecursos = onSnapshot(
      consultaFiltrada,
      (snapshot) => {
        snapshot.docChanges().forEach((cambio) => {
          const datosDoc = cambio.doc.data();
          
          if (cambio.type === "added") {
            registrarActividad("agregar", { nombre: datosDoc.nombre, cantidad: datosDoc.cantidad });
          }
          if (cambio.type === "removed") {
            registrarActividad("eliminar", { nombre: datosDoc.nombre, cantidad: datosDoc.cantidad });
          }
        });

        inventario = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data()
        }));

        actualizarTabla();
        actualizarEstadisticas();
      },
      (error) => {
        console.error("Error en la escucha en tiempo real (onSnapshot):", error);
      }
    );
  }

  window.registrarActividad = async function(tipo, detallePersonalizado = null) {
    const uid = auth.currentUser ? auth.currentUser.uid : null;
    if (!uid) {
        console.warn("No hay un usuario autenticado para registrar la actividad.");
        return;
    }

    let detalle = "";
    if (detallePersonalizado && detallePersonalizado.nombre) {
      if (tipo === "agregar") {
        detalle = `Se agregó el recurso "${detallePersonalizado.nombre}" con un stock de ${detallePersonalizado.cantidad} u.`;
      } else if (tipo === "eliminar") {
        detalle = `Se eliminó el recurso "${detallePersonalizado.nombre}" permanentemente de la lista.`;
      }
    } else if (typeof detallePersonalizado === "string") {
      detalle = detallePersonalizado;
    } else if (detallePersonalizado && detallePersonalizado.detalle) {
      detalle = detallePersonalizado.detalle;
    }

    try {
      await addDoc(collection(db, "actividades"), {
        tipo: tipo,
        detalle: detalle,
        fecha: new Date().toLocaleString(),
        fechaRegistro: new Date().toISOString(),
        userId: uid,
        equipoId: equipoActualId
      });
    } catch (error) {
      console.error("Error crítico al registrar actividad en Firestore:", error);
    }
  }

  // ==========================================================================
  // SECCIÓN SECUNDARIA: GESTIÓN DE EVENTOS (TIEMPO REAL)
  // ==========================================================================
  let eventos = [];

  function escucharEventosEnTiempoReal() {
    if (!equipoActualId) return;

    const qEventos = query(eventosRef, where("equipoId", "==", equipoActualId));
    onSnapshot(qEventos, (snapshot) => {
      eventos = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data()
      }));
      actualizarTablaEventos();
    }, (error) => {
      console.error("Error en la escucha en tiempo real de eventos:", error);
    });
  }

  // ==========================================================================
  // SECCIÓN DE ACTIVIDADES RECIENTES (TIEMPO REAL)
  // ==========================================================================
  let actividades = [];
  function escucharActividadesEnTiempoReal() {
    if (!equipoActualId) return;

    const qActividades = query(
        collection(db, "actividades"),
        where("equipoId", "==", equipoActualId)
    );

    onSnapshot(qActividades, (snapshot) => {
        actividades = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.fechaRegistro || "").localeCompare(a.fechaRegistro || ""));
        actualizarHistorialInicio();
      }, (error) => {
        console.error("Error al escuchar actividades:", error);
    });
  }

  function actualizarHistorialInicio() {
    const listaHistorial = document.getElementById("historial-lista"); 
    if (!listaHistorial) return;

    listaHistorial.innerHTML = "";

    if (actividades.length === 0) {
      listaHistorial.innerHTML = `<div style="color: #94a3b8; text-align: center; padding: 20px;" class="estado-vacio">No hay actividad reciente.</div>`;
      return;
    }

    actividades.forEach((act) => {
      const item = document.createElement("div");
      item.className = "historial-item";
      item.style.padding = "12px";
      item.style.borderBottom = "1px solid #1e293b";
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";

      let icono = "📝";
      if (act.tipo === "agregar") icono = "➕";
      if (act.tipo === "eliminar" || act.tipo.includes("eliminado")) icono = "🗑️";

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="historial-icono">${icono}</span>
          <div class="historial-texto" style="color: #f1f5f9;">${act.detalle || "Actividad registrada"}</div>
        </div>
        <div class="historial-hora" style="color: #64748b; font-size: 0.85rem;">${act.fecha || ""}</div>
      `;
      listaHistorial.appendChild(item);
    });
  }

  function actualizarTablaEventos() {
    const tablaEventosBody = document.getElementById("tabla-events-body") || document.getElementById("tabla-eventos-body"); 
    if (!tablaEventosBody) return;

    tablaEventosBody.innerHTML = "";

    if (eventos.length === 0) {
      tablaEventosBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center;">No hay eventos registrados aún.</td>
        </tr>
      `;
      return;
    }

    eventos.forEach((evento) => {
      const fila = document.createElement("tr");
      const estadoClase = evento.estado ? getBadgeEstado(evento.estado) : 'estado-pendiente';
      const estadoTexto = evento.estado || 'Pendiente';

      fila.innerHTML = `
        <td><strong>${evento.nombre || evento.nombreEvento || 'Sin Nombre'}</strong></td>
        <td>${evento.fecha || 'Sin Fecha'}</td>
        <td>${evento.lugar || 'Sin Lugar'}</td>
        <td>${evento.tipo || 'Sin Tipo'}</td>
        <td><span class="badge-estado ${estadoClase}">${estadoTexto}</span></td>
        <td>
          <button class="btn-eliminar-evento" data-id="${evento.id}" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
            Eliminar
          </button>
        </td>
      `;
      tablaEventosBody.appendChild(fila);
    });

    asignarEventosEliminarEventos();
  }

  function asignarEventosEliminarEventos() {
    const botones = document.querySelectorAll(".btn-eliminar-evento");
    botones.forEach((boton) => {
      boton.onclick = async (e) => {
        const idEliminar = e.target.closest("button").getAttribute("data-id");
        if (!idEliminar) return;

        const confirmar = confirm("¿Estás seguro de que deseas eliminar este evento?");
        if (!confirmar) return;

        try {
          e.target.closest("button").disabled = true;
          await deleteDoc(doc(db, "eventos", idEliminar));
          registrarActividad("evento", { detalle: "Se eliminó un evento de la lista." });
          alert("¡Evento eliminado correctamente!");
        } catch (error) {
          console.error("Error al eliminar el evento en Firestore:", error);
          e.target.closest("button").disabled = false;
        }
      };
    });
  }

  // ==========================================================================
  // SECCIÓN TERCERA: GESTIÓN DE PERSONAL (TIEMPO REAL)
  // ==========================================================================
  let personal = [];
  const tablaPersonalBody = document.getElementById("tabla-personal-body");

  function actualizarTablaPersonal() {
    if (!tablaPersonalBody) return;
    tablaPersonalBody.innerHTML = "";

    if (personal.length === 0) {
      tablaPersonalBody.innerHTML = `<tr><td colspan="6">No hay personal registrado aún.</td></tr>`;
      return;
    }

    personal.forEach((p) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td><strong>${p.nombre}</strong></td>
        <td>${p.rol}</td>
        <td>${p.telefono}</td>
        <td>${p.evento || 'Ninguno'}</td>
        <td><span class="badge-estado">${p.estado}</span></td>
        <td>
          <button class="btn-eliminar-personal" data-id="${p.id}" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Eliminar
          </button>
        </td>
      `;
      tablaPersonalBody.appendChild(fila);
    });

    document.querySelectorAll(".btn-eliminar-personal").forEach((boton) => {
      boton.addEventListener("click", async () => {
        const idEliminar = boton.dataset.id;
        try {
          boton.disabled = true;
          await deleteDoc(doc(db, "personal", idEliminar));
          registrarActividad("personal", { detalle: "Se eliminó a una persona de la lista." });
        } catch (error) {
          console.error("Error al eliminar el personal en Firestore:", error);
          boton.disabled = false;
        }
      });
    });
  }

  function escucharPersonalEnTiempoReal() {
    if (!equipoActualId) return;
    const qPersonal = query(personalRef, where("equipoId", "==", equipoActualId));
    onSnapshot(qPersonal, (snapshot) => {
        personal = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data()
        }));
        actualizarTablaPersonal();
      },
      (error) => {
        console.error("Error en la escucha en tiempo real de personal:", error);
      }
    );
  }

  // ==========================================================================
  // LOGICA DE GESTION DE EVENTOS (AGREGAR A FIRESTORE)
  // ==========================================================================
  const inputEventoNombre = document.getElementById("inp-evento-nombre");
  const inputEventoFecha = document.getElementById("inp-evento-fecha");
  const inputEventoLugar = document.getElementById("inp-evento-lugar");
  const inputEventoTipo = document.getElementById("inp-evento-tipo");
  const inputEventoEstado = document.getElementById("inp-evento-estado");
  const botonEventoAgregar = document.getElementById("btn-evento-agregar");

  if (botonEventoAgregar) {
    botonEventoAgregar.addEventListener("click", async () => {
      const nombre = inputEventoNombre.value.trim();
      const fecha = inputEventoFecha.value;
      const lugar = inputEventoLugar.value.trim();
      const tipo = inputEventoTipo.value;
      const estado = inputEventoEstado.value;

      if (nombre === "" || fecha === "" || lugar === "" || tipo === "") {
        alert("Por favor, completa todos los campos del evento.");
        return;
      }

      const nuevoEvento = {
        nombre: nombre,
        fecha: fecha,
        lugar: lugar,
        tipo: tipo,
        estado: estado,
        userId: usuarioActualId,
        equipoId: equipoActualId
      };

      try {
        botonEventoAgregar.disabled = true;
        botonEventoAgregar.textContent = "Guardando...";
        await addDoc(eventosRef, nuevoEvento);
        registrarActividad("evento", { detalle: `Se registró el evento "${nombre}" programado para el ${fecha}.` });
        
        inputEventoNombre.value = "";
        inputEventoFecha.value = "";
        inputEventoLugar.value = "";
        inputEventoTipo.value = "";
        inputEventoEstado.value = "Programado";
        
        alert("¡Evento agregado con éxito!");
      } catch (error) {
        console.error("Error al guardar el evento:", error);
        alert("No se pudo guardar el evento.");
      } finally {
        botonEventoAgregar.disabled = false;
        botonEventoAgregar.textContent = "Agregar evento";
      }
    });
  }

  // ==========================================================================
  // LOGICA DE GESTION DE PERSONAL (AGREGAR A FIRESTORE)
  // ==========================================================================
  const inputPersonalNombre = document.getElementById("inp-personal-nombre");
  const inputPersonalRol = document.getElementById("inp-personal-rol");
  const inputPersonalTelefono = document.getElementById("inp-personal-telefono");
  const inputPersonalEvento = document.getElementById("inp-personal-evento");
  const inputPersonalEstado = document.getElementById("inp-personal-estado");
  const botonPersonalAgregar = document.getElementById("btn-personal-agregar");

  if (botonPersonalAgregar) {
    botonPersonalAgregar.addEventListener("click", async () => {
      const nombre = inputPersonalNombre.value.trim();
      const rol = inputPersonalRol.value.trim();
      const telefono = inputPersonalTelefono.value.trim();
      const eventoAsignado = inputPersonalEvento.value.trim();
      const estado = inputPersonalEstado.value;

      if (nombre === "" || rol === "" || telefono === "") {
        alert("Por favor, completa el nombre, rol y teléfono de la persona.");
        return;
      }

      const nuevoPersonal = {
        nombre: nombre,
        rol: rol,
        telefono: telefono,
        evento: eventoAsignado || "Ninguno",
        estado: estado,
        userId: usuarioActualId,
        equipoId: equipoActualId
      };

      try {
        botonPersonalAgregar.disabled = true;
        botonPersonalAgregar.textContent = "Guardando...";
        await addDoc(personalRef, nuevoPersonal);
        registrarActividad("personal", { detalle: `Se registró al personal "${nombre}" con rol de "${rol}".` });
        
        inputPersonalNombre.value = "";
        inputPersonalRol.value = "";
        inputPersonalTelefono.value = "";
        inputPersonalEvento.value = "";
        inputPersonalEstado.value = "Disponible";
        
        alert("¡Personal registrado con éxito!");
      } catch (error) {
        console.error("Error al guardar personal:", error);
        alert("No se pudo registrar al personal.");
      } finally {
        botonPersonalAgregar.disabled = false;
        botonPersonalAgregar.textContent = "Agregar personal";
      }
    });
  }

  // ========================================================
  // ESCUCHADOR PARA EL BOTÓN DE BUSCAR EN INICIO
  // ========================================================
  const btnBuscarInicio = document.getElementById('btn-buscar-inicio');
  if (btnBuscarInicio) {
    btnBuscarInicio.addEventListener('click', () => {
        const input = document.getElementById('busqueda-inventario').value.toLowerCase().trim();
        const resultadoDiv = document.getElementById('resultado-busqueda');
        
        if (input === "") {
            resultadoDiv.innerHTML = "<p style='color: #ffc107; margin-top: 10px;'>Por favor, escribe el nombre de un recurso.</p>";
            return;
        }

        const encontrados = inventario.filter(r => r.nombre.toLowerCase().includes(input));

        if (encontrados.length > 0) {
            resultadoDiv.innerHTML = encontrados.map(r => {
                let colorEstado = '#28a745'; // Disponible
                if (r.estado === 'En uso') colorEstado = '#17a2b8'; // Azul
                if (r.estado === 'Dañado') colorEstado = '#dc3545'; // Rojo

                return `<div style="background: rgba(255,255,255,0.1); padding: 12px; margin-top: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${colorEstado};">
                        <div>
                            <strong style="font-size: 16px; color: #fff;">${r.nombre}</strong> 
                            <span style="font-size: 13px; color: #ccc; margin-left: 5px;">(${r.categoria})</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="background: rgba(255,255,255,0.15); padding: 4px 8px; border-radius: 4px; font-size: 13px; color: white;">${r.cantidad} u.</span>
                            <span style="margin-left: 5px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: ${colorEstado}; color: white;">${r.estado}</span>
                        </div>
                    </div>`;
            }).join('');
        } else {
            resultadoDiv.innerHTML = "<p style='color: #dc3545; margin-top: 10px;'>No se encontraron recursos con ese nombre.</p>";
        }
    });
  }

  // ==========================================================================
  // ARRANCAR LAS ESCUCHAS AL VALIDAR EL VIGILANTE DE SESIÓN
  // ==========================================================================
  onAuthStateChanged(auth, async (user) => {
    if (user) {
        await user.reload(); 
        
        if (user.emailVerified) {
            // Buscamos a qué equipo pertenece esta cuenta
            const perfilSnap = await getDoc(doc(db, "usuarios", user.uid));
            if (!perfilSnap.exists()) {
                txtError.innerText = "No se encontró el perfil de tu cuenta. Contacta al administrador.";
                txtError.style.display = 'block';
                signOut(auth);
                return;
            }
            equipoActualId = perfilSnap.data().equipoId;

            txtError.style.display = 'none';
            usuarioActualId = user.uid;
            loginSeccion.style.display = 'none';
            appContenido.style.display = 'block';
            
            escucharRecursosEnTiempoReal();
            escucharEventosEnTiempoReal();
            escucharPersonalEnTiempoReal();
            escucharActividadesEnTiempoReal();
        } else {
            txtError.innerText = "Debes verificar tu correo electrónico antes de ingresar.";
            txtError.style.display = 'block';
            
            usuarioActualId = null;
            equipoActualId = null;
            loginSeccion.style.display = 'block';
            appContenido.style.display = 'none';
            
            if (limpiarEscuchaRecursos) limpiarEscuchaRecursos();
            signOut(auth);
        }
    } else {
        usuarioActualId = null;
        equipoActualId = null;
        loginSeccion.style.display = 'block';
        appContenido.style.display = 'none';
        
        if (limpiarEscuchaRecursos) limpiarEscuchaRecursos();
    }
  });

}); // Fin del DOMContentLoaded

// ==========================================
// EVENTOS DE BOTONES PARA ACCESO (INTERFAZ)
// ==========================================
btnIngresar.addEventListener('click', () => {
    const correo = document.getElementById('login-correo').value.trim();
    const contrasena = document.getElementById('login-contrasena').value;

    signInWithEmailAndPassword(auth, correo, contrasena)
        .catch((error) => {
            console.error(error);
            txtError.innerText = "Error al ingresar: Revisa tus credenciales.";
            txtError.style.display = 'block';
        });
});

function generarCodigoEquipo() {
    const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos (O/0, I/1)
    let codigo = "EVT-";
    for (let i = 0; i < 5; i++) {
        codigo += letras[Math.floor(Math.random() * letras.length)];
    }
    return codigo;
}

btnRegistrar.addEventListener('click', () => {
    const correo = document.getElementById('login-correo').value.trim();
    const contrasena = document.getElementById('login-contrasena').value;
    const codigoIngresado = document.getElementById('registro-codigo-equipo').value.trim().toUpperCase();

    if (contrasena.length < 6) {
        txtError.innerText = "La contraseña debe tener mínimo 6 caracteres.";
        txtError.style.display = 'block';
        return;
    }

    createUserWithEmailAndPassword(auth, correo, contrasena)
        .then(async (userCredential) => {
            // Si escribiste un código, te unes a ese equipo. Si lo dejaste vacío,
            // se crea un equipo nuevo con un código generado automáticamente.
            const equipoId = codigoIngresado !== "" ? codigoIngresado : generarCodigoEquipo();

            await setDoc(doc(db, "usuarios", userCredential.user.uid), {
                email: correo,
                equipoId: equipoId,
                creadoEn: new Date().toISOString()
            });

            sendEmailVerification(userCredential.user)
                .then(() => {
                    if (codigoIngresado === "") {
                        alert(`¡Cuenta creada! Verifica tu correo antes de ingresar.\n\nTu código de equipo es: ${equipoId}\n\nCompártelo con tus compañeros para que se unan al mismo equipo (deben escribirlo en el campo "Código de equipo" al registrarse).`);
                    } else {
                        alert(`¡Cuenta creada! Te uniste al equipo "${equipoId}". Verifica tu correo antes de ingresar.`);
                    }
                    signOut(auth);
                });
            txtError.style.display = 'none';
        })
        .catch(error => {
            console.error(error);
            txtError.innerText = "Error: El correo ya existe o es inválido.";
            txtError.style.display = 'block';
        });
});

if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', () => {
        signOut(auth);
    });
}

const userDisplay = document.getElementById('user-display');
const dropdownMenu = document.getElementById('dropdown-menu');

if (userDisplay) {
    userDisplay.addEventListener('click', () => {
        const isVisible = dropdownMenu.style.display === 'block';
        dropdownMenu.style.display = isVisible ? 'none' : 'block';
    });
}