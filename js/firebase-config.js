import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuración por defecto (Proyecto Principal / Maestro - youcontrolvoley)
const defaultConfig = {
    apiKey: "AIzaSyCbjqKJHxL5eRBJwg8mT5YK7yJUMqe2kg", 
    authDomain: "youcontrolvoley.firebaseapp.com",
    projectId: "youcontrolvoley",
    storageBucket: "youcontrolvoley.firebasestorage.app",
    messagingSenderId: "840027639026",
    appId: "1:840027639026:web:d5170253b4b16c1be0146b"
};

const empresaID = (localStorage.getItem('youcontrol_empresa_id') || '').trim();
let activeConfig = defaultConfig;

// Función para inicializar app segura de manera aislada por tenant
function obtenerDbPersonalizada(configParaUsar, identificadorApp) {
    const existingApps = getApps();
    let app = existingApps.find(a => a.name === identificadorApp);
    if (!app) {
        app = initializeApp(configParaUsar, identificadorApp);
    }
    return getFirestore(app);
}

let db;

// Inicialización síncrona basada en caché local para velocidad inmediata
if (empresaID) {
    const cacheKey = `youcontrol_tenant_config_${empresaID}`;
    let tenantConfigStr = localStorage.getItem(cacheKey);

    if (tenantConfigStr) {
        try {
            activeConfig = JSON.parse(tenantConfigStr);
            console.log("🔌 Usando configuración independiente desde caché para:", empresaID);
            db = obtenerDbPersonalizada(activeConfig, `app_${empresaID}`);
        } catch (e) {
            console.error("Error leyendo caché tenant:", e);
            db = obtenerDbPersonalizada(defaultConfig, '[DEFAULT]');
        }
    } else {
        // Si no está en caché, inicializamos con la maestra y buscamos en segundo plano
        db = obtenerDbPersonalizada(defaultConfig, '[DEFAULT]');
        
        (async () => {
            try {
                const mainApp = getApps().find(a => a.name === '[DEFAULT]') || initializeApp(defaultConfig, '[DEFAULT]');
                const mainDb = getFirestore(mainApp);
                const docSnap = await getDoc(doc(mainDb, "empresas_config", empresaID));
                
                if (docSnap.exists() && docSnap.data().firebaseConfig) {
                    const nuevaConfig = docSnap.data().firebaseConfig;
                    localStorage.setItem(cacheKey, JSON.stringify(nuevaConfig));
                    console.log("☁️ Configuración independiente descargada de la nube y guardada en caché para:", empresaID);
                }
            } catch (e) {
                console.error("Error consultando configuración en la nube de forma asíncrona:", e);
            }
        })();
    }
} else {
    db = obtenerDbPersonalizada(defaultConfig, '[DEFAULT]');
}

export { db };