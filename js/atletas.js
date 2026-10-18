import { db } from "./config-firebase.js"; // Importa la base de datos dinámica del club (ej. dataciar)
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const _0xa = i => document.getElementById(i); 
let _aL = [];

// Obtener datos del club desde localStorage
const empresaID = localStorage.getItem('youcontrol_empresa_id');
const clubNombre = localStorage.getItem('control_voley_club_nombre') || empresaID;

// Supabase solo se usará para el Storage de Fotos
let supaUrl = localStorage.getItem('control_voley_supa_url');
let supaKey = localStorage.getItem('control_voley_supa_key');
let supaBucket = localStorage.getItem('control_voley_supa_bucket') || 'ycdep-ciar';

if (supaUrl) supaUrl = supaUrl.replace(/[\[\]]/g, '').trim();
if (supaKey) supaKey = supaKey.replace(/[\[\]]/g, '').trim();

const supabase = (supaUrl && supaKey) ? createClient(supaUrl, supaKey) : null;

// Mostrar nombre del club en la interfaz
_0xa('userEmail').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Club: ${clubNombre}`;

// COMPRESIÓN MÁXIMA Y RECORTE CUADRADO DE FOTO PARA SUPABASE
async function comprimirYRecortarImagen(file, size = 300, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Error al comprimir la imagen')); return; }
          const compressedFile = new File([blob], `${Date.now()}_atleta.jpg`, { type: 'image/jpeg' });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// 1. CARGAR ATLETAS DESDE FIRESTORE DEL CLIENTE
async function cargarAtletas() {
    try {
        const querySnapshot = await getDocs(collection(db, "atletas"));
        _aL = [];
        querySnapshot.forEach((docSnap) => {
            _aL.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Ordenar por cédula si existe
        _aL.sort((a, b) => (a.cedulaIdentidad || '').localeCompare(b.cedulaIdentidad || ''));
        filterNomina();
    } catch (err) {
        console.error("Error al cargar atletas de Firestore:", err.message);
        _0xa('nTB').innerHTML = `<tr><td colspan="6" class="text-center py-8 text-rose-500 font-bold">Error al conectar con la base de datos de Firebase del club.</td></tr>`;
    }
}

// 2. GUARDAR O ACTUALIZAR ATLETA EN FIRESTORE DEL CLIENTE
_0xa('aForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = _0xa('bS');
    const textoOriginalBtn = btnSubmit.innerHTML;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando en Firebase...`;

    const cedula = _0xa('cedulaIdentidad').value.trim();
    const inputArchivo = _0xa('fotoAtleta');
    const archivo = inputArchivo.files[0];
    const sedeAtleta = _0xa('sede').value;
    
    let urlFoto = _0xa('fotoUrlActual').value;

    try {
        // Subir foto a Supabase Storage si se seleccionó una nueva
        if (archivo && supabase) {
            btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Subiendo Foto...`;
            const archivoOptimizado = await comprimirYRecortarImagen(archivo, 300, 0.65);
            const sedeLimpia = (sedeAtleta || 'general').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const fileName = `${sedeLimpia}/${cedula}_${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from(supaBucket)
                .upload(fileName, archivoOptimizado, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: publicURLData } = supabase.storage
                .from(supaBucket)
                .getPublicUrl(fileName);

            urlFoto = publicURLData.publicUrl;
        }

        const atletaData = {
            nombre: _0xa('nombre').value.trim(),
            apellido: _0xa('apellido').value.trim(),
            cedulaIdentidad: cedula,
            telefono: _0xa('telefono').value.trim(),
            fechaNacimiento: _0xa('fechaNacimiento').value,
            sede: sedeAtleta,
            categoria: _0xa('categoria').value,
            nroCamiseta: _0xa('nroCamiseta').value.trim(),
            peso: _0xa('peso').value ? parseFloat(_0xa('peso').value) : 0,
            talla: _0xa('talla').value ? parseFloat(_0xa('talla').value) : 0,
            nombreRepresentante: _0xa('nombreRepresentante').value.trim(),
            cedulaRepresentante: _0xa('cedulaRepresentante').value.trim(),
            telefonoRepresentante: _0xa('telefonoRepresentante').value.trim(),
            frecuenciaPago: _0xa('frecuenciaPago').value,
            montoPago: _0xa('montoPago').value ? parseFloat(_0xa('montoPago').value) : 0,
            fechaUltimoPago: _0xa('fechaUltimoPago').value,
            fotoUrl: urlFoto,
            updated_at: new Date().toISOString()
        };

        // Usamos la cédula de identidad como ID del documento en Firestore para evitar duplicados
        const docRef = doc(db, "atletas", cedula);
        await setDoc(docRef, atletaData, { merge: true });

        resetForm();
        cargarAtletas();
        alert('¡Atleta guardado con éxito en el Firebase del club!');
    } catch (err) {
        console.error("Error al guardar:", err);
        alert('Error al guardar el atleta: ' + (err.message || err));
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginalBtn;
    }
});

function renderTable(arr) {
  const tb = _0xa('nTB'); tb.innerHTML = '';
  if (!arr.length) { tb.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-slate-400 italic font-semibold">No hay atletas registrados en este club.</td></tr>'; return; }

  arr.forEach(k => {
    const tr = document.createElement('tr');
    const foto = k.fotoUrl;
    const nombre = k.nombre || '';
    const apellido = k.apellido || '';
    const cedula = k.cedulaIdentidad || 'N/A';
    const rep = k.nombreRepresentante || 'N/A';

    const avatar = foto 
      ? `<img src="${foto}" class="w-10 h-10 rounded-full object-cover shadow-sm border border-brand-cyan">` 
      : `<div class="w-10 h-10 rounded-full bg-brand-50 text-brand-electric flex items-center font-black justify-center text-xs border border-brand-electric/20">${(nombre[0]||'')+(apellido[0]||'')}</div>`;

    tr.innerHTML = `
      <td class="px-4 py-3 flex items-center space-x-3">
        ${avatar}
        <div>
          <div class="font-bold text-slate-900">${nombre} ${apellido}</div>
        </div>
      </td>
      <td class="px-4 py-3 text-slate-600 font-semibold">${k.sede || 'N/A'}</td>
      <td class="px-4 py-3 text-brand-electric font-bold">${cedula}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 bg-brand-50 text-brand-electric rounded-lg font-extrabold text-xs border border-brand-electric/20">${k.categoria || 'N/A'}</span></td>
      <td class="px-4 py-3 text-slate-600">${rep}</td>
      <td class="px-4 py-3 text-center space-x-2">
        <button onclick="editAtleta('${k.cedulaIdentidad}')" class="font-bold text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition shadow-sm">Editar</button>
        <button onclick="deleteAtleta('${k.cedulaIdentidad}')" class="text-rose-600 hover:text-rose-900 font-bold text-xs bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition shadow-sm">Eliminar</button>
      </td>`;
    tb.appendChild(tr);
  });
}

window.filterNomina = () => {
  const t = _0xa('sAt').value.toLowerCase();
  const sedeFiltro = _0xa('filtroSede').value;
  
  const f = _aL.filter(x => {
    const coincideSede = (sedeFiltro === 'todos' || x.sede === sedeFiltro);
    const nom = ((x.nombre || '') + ' ' + (x.apellido || '')).toLowerCase();
    const ci = (x.cedulaIdentidad || '').toString().toLowerCase();
    const rep = (x.nombreRepresentante || '').toLowerCase();
    const coincideTexto = nom.includes(t) || ci.includes(t) || rep.includes(t);
    return coincideSede && coincideTexto;
  });
  renderTable(f);
};

window.editAtleta = (cedula) => {
  const k = _aL.find(x => x.cedulaIdentidad === cedula);
  if (!k) return;
  _0xa('nombre').value = k.nombre || '';
  _0xa('apellido').value = k.apellido || '';
  _0xa('cedulaIdentidad').value = k.cedulaIdentidad || '';
  _0xa('telefono').value = k.telefono || '';
  _0xa('fechaNacimiento').value = k.fechaNacimiento || '';
  _0xa('sede').value = k.sede || '';
  _0xa('categoria').value = k.categoria || '';
  _0xa('nroCamiseta').value = k.nroCamiseta || '';
  _0xa('peso').value = k.peso || '';
  _0xa('talla').value = k.talla || '';
  _0xa('nombreRepresentante').value = k.nombreRepresentante || '';
  _0xa('cedulaRepresentante').value = k.cedulaRepresentante || '';
  _0xa('telefonoRepresentante').value = k.telefonoRepresentante || '';
  _0xa('frecuenciaPago').value = k.frecuenciaPago || 'mensual';
  _0xa('montoPago').value = k.montoPago || '';
  _0xa('fechaUltimoPago').value = k.fechaUltimoPago || '';
  _0xa('fotoUrlActual').value = k.fotoUrl || '';
  _0xa('fT').innerHTML = '<i class="fas fa-user-pen text-brand-electric"></i> Editar Atleta';
  _0xa('bS').innerText = 'Actualizar Atleta';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteAtleta = async (cedula) => {
  if (confirm('¿Seguro que deseas eliminar este atleta de la base de datos del club?')) {
    try {
      await deleteDoc(doc(db, "atletas", cedula));
      cargarAtletas();
    } catch (e) { 
      console.error(e); 
      alert('Error al eliminar: ' + e.message); 
    }
  }
};

window.resetForm = () => {
  _0xa('aForm').reset();
  _0xa('fotoUrlActual').value = '';
  _0xa('fT').innerHTML = '<i class="fas fa-user-plus text-brand-electric"></i> Registrar Nuevo Atleta';
  _0xa('bS').innerText = 'Guardar Atleta';
};

document.getElementById('btnLogout').addEventListener('click', () => {
    if (confirm("¿Deseas cerrar la sesión activa?")) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
});

cargarAtletas();
