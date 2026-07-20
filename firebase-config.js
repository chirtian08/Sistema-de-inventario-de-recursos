// ==========================================================================
// PUNTO 1: CONEXIÓN A FIREBASE (Semana 7)
// ==========================================================================
// Importamos únicamente las piezas del SDK que vamos a usar (modular v10+).
// Se cargan directamente desde el CDN de Google, no hay que instalar nada.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// firebaseConfig real de tu proyecto "eventlog-proyecto"
const firebaseConfig = {
  apiKey: "AIzaSyAW6E9qCijESyour8svrtML03f5CUQru3E",
  authDomain: "eventlog-proyecto.firebaseapp.com",
  projectId: "eventlog-proyecto",
  storageBucket: "eventlog-proyecto.firebasestorage.app",
  messagingSenderId: "574966635876",
  appId: "1:574966635876:web:34a485c275e6c6cc2a2e71"
};

// Inicializamos la app y la base de datos Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exportamos "db" para que app.js lo importe con:
// import { db } from './firebase-config.js';
export { db };