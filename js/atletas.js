import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const _0xa = i => document.getElementById(i); 
let _aL = [];

// 1. Obtener credenciales y datos del club desde localStorage
const empresaID = localStorage.getItem('youcontrol_empresa_id') || 'YCDEP-CIAR';
const supaUrl = localStorage.getItem('control_voley_supa_url');
const supaKey = localStorage.getItem('control_voley_supa_key');
const supaBucket = localStorage.getItem('control_voley_supa_bucket') || empresaID;

if (!supaUrl || !supaKey) {
    alert("Sesión no autorizada o credenciales faltantes. Por favor, active el sistema nuevamente.");
    window.location.href = 'index.html';
}

const supabase = createClient(supaUrl, supaKey);

// 2. Configuración oficial y definitiva del Firebase Maestro (youcontrolvoley)
const firebaseConfigMaster = {
    apiKey: "AIzaSyCbjqKJHxL5eRBJwg8mT5YK7y7jUMQe2kg", 
    authDomain: "youcontrolvoley.firebaseapp.com",
    projectId: "youcontrolvoley",
    storageBucket: "youcontrolvoley.firebasestorage.app",
    messagingSenderId: "840027639026",
    appId: "1:840027639026:web:d5170253b4b16c1be0146b"
};

const appMaster = initializeApp(firebaseConfigMaster);
const dbMaster = getFirestore(appMaster);

// COMPRESIÓN MÁXIMA Y RECORTE CUADRADO DE FOTO (Reducción a 300x300 px - Peso ~30KB)
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
          if (!blob) {
            reject(new Error('Error al comprimir la imagen'));
            return;
          }
          const compressedFile = new File([blob], `${Date.now()}_atleta.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Cargar Nombre del Club desde Firebase Maestro e Inicializar Atletas desde Supabase
async function inicializarClubYAtletas() {
    try {
        // Consultar el nombre oficial en el proyecto maestro youcontrolvoley -> empresas_config
        const docRef = doc(dbMaster, "empresas_config", empresaID);
        const docSnap = await getDoc(docRef);
        
        let nombreMostrar = empresaID;
        if (docSnap.exists() && docSnap.data().nombre) {
            nombreMostrar = docSnap.data().nombre;
        }

        _0xa('userEmail').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Club: ${nombreMostrar}`;

        // Cargar Atletas desde Supabase ordenados por Cédula
        const { data, error } = await supabase
            .from('atletas')
            .select('*')
            .order('cedulaIdentidad', { ascending: true });

        if (error) throw error;
        _aL = data || [];
        filterNomina();

    } catch (err) {
        console.error("Error al inicializar:", err.message);
        _0xa('userEmail').innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Club: ${empresaID}`;
        _0xa('nTB').innerHTML = `<tr><td colspan="6" class="text-center py-8 text-rose-500 font-bold">Error al conectar con la base de datos de Supabase.</td></tr>`;
    }
}

// Guardar o Actualizar Atleta basado en número de Cédula
_0xa('aForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = _0xa('bS');
    const textoOriginalBtn = btnSubmit.innerHTML;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;

    const id = _0xa('aId').value;
    const cedula = _0xa('cedulaIdentidad').value.trim();
    const inputArchivo = _0xa('fotoAtleta');
    const archivo = inputArchivo.files[0];
    const sedeAtleta = _0xa('sede').value;
    
    let urlFoto = _0xa('fotoUrlActual').value;

    try {
        if (archivo) {
            btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Comprimiendo Foto...`;
            
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
            fotoUrl: urlFoto
        };

        if (id) {
            const { error } = await supabase.from('atletas').update(atletaData).eq('id', id);
            if (error) throw error;
        } else {
            // Verificar duplicados por cédula de identidad
            const { data: existente } = await supabase.from('atletas').select('id').eq('cedulaIdentidad', cedula).maybeSingle();
            if (existente) {
                alert('Ya existe un atleta registrado con la cédula: ' + cedula);
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textoOriginalBtn;
                return;
            }

            const { error } = await supabase.from('atletas').insert([atletaData]);
            if (error) throw error;
        }

        resetForm();
        inicializarClubYAtletas();
        alert('¡Atleta guardado con éxito!');
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
  if (!arr.length) { tb.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-slate-400 italic font-semibold">No hay atletas registrados.</td></tr>'; return; }

  arr.forEach(k => {
    const tr = document.createElement('tr');
    const foto = k.fotoUrl || k.foto_url;
    const nombre = k.nombre || '';
    const apellido = k.apellido || '';
    const cedula = k.cedulaIdentidad || k.cedula_identidad || 'N/A';
    const rep = k.nombreRepresentante || k.nombre_representante || 'N/A';

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
        <button onclick="editAtleta('${k.id}')" class="font-bold text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition shadow-sm">Editar</button>
        <button onclick="deleteAtleta('${k.id}')" class="text-rose-600 hover:text-rose-900 font-bold text-xs bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition shadow-sm">Eliminar</button>
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
    const ci = (x.cedulaIdentidad || x.cedula_identidad || '').toString().toLowerCase();
    const rep = (x.nombreRepresentante || x.nombre_representante || '').toLowerCase();
    const coincideTexto = nom.includes(t) || ci.includes(t) || rep.includes(t);
    return coincideSede && coincideTexto;
  });
  renderTable(f);
};

window.editAtleta = (id) => {
  const k = _aL.find(x => x.id === id);
  if (!k) return;
  _0xa('aId').value = k.id;
  _0xa('nombre').value = k.nombre || '';
  _0xa('apellido').value = k.apellido || '';
  _0xa('cedulaIdentidad').value = k.cedulaIdentidad || k.cedula_identidad || '';
  _0xa('telefono').value = k.telefono || '';
  _0xa('fechaNacimiento').value = k.fechaNacimiento || k.fecha_nacimiento || '';
  _0xa('sede').value = k.sede || '';
  _0xa('categoria').value = k.categoria || '';
  _0xa('nroCamiseta').value = k.nroCamiseta || k.nro_camiseta || '';
  _0xa('peso').value = k.peso || '';
  _0xa('talla').value = k.talla || '';
  _0xa('nombreRepresentante').value = k.nombreRepresentante || k.nombre_representante || '';
  _0xa('cedulaRepresentante').value = k.cedulaRepresentante || k.cedula_representante || '';
  _0xa('telefonoRepresentante').value = k.telefonoRepresentante || k.telefono_representante || '';
  _0xa('frecuenciaPago').value = k.frecuenciaPago || k.frecuencia_pago || 'mensual';
  _0xa('montoPago').value = k.montoPago || k.monto_pago || '';
  _0xa('fechaUltimoPago').value = k.fechaUltimoPago || k.fecha_ultimo_pago || '';
  _0xa('fotoUrlActual').value = k.fotoUrl || k.foto_url || '';
  _0xa('fT').innerHTML = '<i class="fas fa-user-pen text-brand-electric"></i> Editar Atleta';
  _0xa('bS').innerText = 'Actualizar Atleta';
  _0xa('bC').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteAtleta = async (id) => {
  if (confirm('¿Seguro que deseas eliminar este atleta?')) {
    try {
      const { error } = await supabase.from('atletas').delete().eq('id', id);
      if (error) throw error;
      inicializarClubYAtletas();
    } catch (e) { 
      console.error(e); 
      alert('Error al eliminar: ' + e.message); 
    }
  }
};

window.resetForm = () => {
  _0xa('aForm').reset();
  _0xa('aId').value = '';
  _0xa('fotoUrlActual').value = '';
  _0xa('fT').innerHTML = '<i class="fas fa-user-plus text-brand-electric"></i> Registrar Nuevo Atleta';
  _0xa('bS').innerText = 'Guardar Atleta';
  _0xa('bC').classList.add('hidden');
};

document.getElementById('btnLogout').addEventListener('click', () => {
    if (confirm("¿Deseas cerrar la sesión activa?")) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
});

inicializarClubYAtletas();
