import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const _ = id => document.getElementById(id);
const empresaID = (localStorage.getItem('youcontrol_empresa_id') || '').trim();
const clubNombre = localStorage.getItem('control_voley_club_nombre') || empresaID || 'Club Voley';

let supaUrl = localStorage.getItem('control_voley_supa_url');
let supaKey = localStorage.getItem('control_voley_supa_key');

if (supaUrl) supaUrl = supaUrl.replace(/[\[\]]/g, '').trim();
if (supaKey) supaKey = supaKey.replace(/[\[\]]/g, '').trim();

if (!empresaID || !supaUrl || !supaKey) {
    alert("Sesión no autorizada o credenciales faltantes.");
    window.location.href = '../index.html';
}

const userEmailEl = _('userEmail');
if (userEmailEl) {
    userEmailEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Club: ${clubNombre}`;
}

const supabase = createClient(supaUrl, supaKey);

let L_Nomina = [];
let Roster = [];
let S = [];
let M = [];
let atletaSeleccionadoKey = null;
let b = null, a = null;
let toastTimeout = null;

const N = {
    'Servicio Bueno S#': 1, 'Ataque Bueno A#': 1, 'Bloqueo Bueno B#': 1, 'Coloque Bueno C#': 1,
    'Servicio Malo S=': -1, 'Ataque Malo A=': -1, 'Bloqueo Malo B=': -1, 'Recepción Mala R=': -1, 
    'Coloque Malo C=': -1, 'Defensa Mala D=': -1
};
const O = { S: 'Servicio', A: 'Ataque', B: 'Bloqueo', R: 'Recepción', C: 'Coloque', D: 'Defensa' };
const P = { b: '#0055FF', r: '#dc2626', o: '#f97316', g: '#10b981' };
const K = { scales: { y: { ticks: { stepSize: 1 } } }, responsive: true, maintainAspectRatio: false };

// FUNCIÓN PARA MOSTRAR MENSAJE TOAST FLOTANTE (Duración 2 segundos)
function mostrarToast(mensaje) {
    const toast = _('toastNotificacion');
    const texto = _('toastTexto');
    texto.textContent = mensaje;

    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    if (toastTimeout) clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, 2000);
}

async function init() {
    const hoy = new Date();
    _('fechaJuegoDisplay').textContent = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    _('equipoLocal').value = localStorage.getItem('vLocal_' + empresaID) || clubNombre;
    _('equipoRival').value = localStorage.getItem('vRival_' + empresaID) || 'Rival';

    _('equipoLocal').oninput = e => localStorage.setItem('vLocal_' + empresaID, e.target.value);
    _('equipoRival').oninput = e => localStorage.setItem('vRival_' + empresaID, e.target.value);

    try {
        const { data: atletas } = await supabase.from('atletas').select('*').order('nroCamiseta', { ascending: true });
        L_Nomina = atletas || [];
        poblaryNominaSelect();
    } catch (err) {
        console.error("Error al cargar atletas:", err);
    }

    Roster = JSON.parse(localStorage.getItem('vRoster_' + empresaID) || '[]');
    S = JSON.parse(localStorage.getItem('vS_' + empresaID) || '[]');
    M = JSON.parse(localStorage.getItem('vM_' + empresaID) || '[]');

    renderRosterCards();
    U();
}

function poblaryNominaSelect() {
    const select = _('selectNomina');
    select.innerHTML = '<option value="">Seleccione de Nómina...</option>';
    L_Nomina.forEach(p => {
        let o = document.createElement('option');
        o.value = p.cedulaIdentidad || p.id;
        o.textContent = `#${p.nroCamiseta || '0'} ${p.nombre} ${p.apellido || ''}`;
        select.appendChild(o);
    });
}

// AGREGAR AL ROSTER
_('btnAgregarNomina').onclick = () => {
    const idKey = _('selectNomina').value;
    if (!idKey) return;
    const atleta = L_Nomina.find(x => (x.cedulaIdentidad || x.id) == idKey);
    if (atleta && !Roster.some(x => x.key == idKey)) {
        Roster.push({
            key: idKey,
            num: atleta.nroCamiseta || '0',
            name: `${atleta.nombre} ${atleta.apellido || ''}`.trim()
        });
        guardarEstado();
        renderRosterCards();
        U();
        mostrarToast('Atleta añadido al Roster');
    }
};

_('btnAgregarManual').onclick = () => {
    const num = _('manualNum').value.trim();
    const nom = _('manualNom').value.trim();
    if (!num || !nom) { alert("Ingresa número y nombre."); return; }

    const key = 'MANUAL_' + num + '_' + Date.now();
    Roster.push({ key: key, num: num, name: nom });

    _('manualNum').value = '';
    _('manualNom').value = '';

    guardarEstado();
    renderRosterCards();
    U();
    mostrarToast('Atleta invitado añadido');
};

// RENDERIZAR TARJETAS DEL ROSTER
function renderRosterCards() {
    const container = _('rosterCardsGrid');
    _('countRoster').textContent = Roster.length;

    if (!Roster.length) {
        container.innerHTML = '<div class="col-span-full text-center py-4 text-xs text-slate-400 italic">No hay atletas en el roster del partido.</div>';
        _('atletaSeleccionadoBadge').classList.add('hidden');
        atletaSeleccionadoKey = null;
        return;
    }

    container.innerHTML = '';
    Roster.forEach(p => {
        const card = document.createElement('div');
        const isSelected = (atletaSeleccionadoKey === p.key);
        
        card.className = `relative p-3 rounded-2xl border transition-all cursor-pointer bg-white flex flex-col justify-between hover:border-brand-electric shadow-sm ${isSelected ? 'card-atleta-selected' : 'border-slate-200'}`;
        
        card.onclick = () => seleccionarAtleta(p.key, p.num, p.name);

        card.innerHTML = `
            <button type="button" class="absolute top-1 right-2 text-slate-300 hover:text-rose-600 font-bold text-xs z-10" onclick="event.stopPropagation(); quitarDeRoster('${p.key}')">&times;</button>
            <div class="text-center py-1">
                <span class="inline-block px-2 py-0.5 rounded-lg bg-brand-50 text-brand-electric font-black text-sm mb-1">#${p.num}</span>
                <div class="font-extrabold text-slate-800 text-xs truncate max-w-full">${p.name}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

function seleccionarAtleta(key, num, name) {
    atletaSeleccionadoKey = key;
    _('atletaSeleccionadoBadge').classList.remove('hidden');
    _('nombreAtletaSel').textContent = `#${num} ${name}`;
    renderRosterCards();
}

window.quitarDeRoster = (key) => {
    Roster = Roster.filter(x => x.key !== key);
    if (atletaSeleccionadoKey === key) {
        atletaSeleccionadoKey = null;
        _('atletaSeleccionadoBadge').classList.add('hidden');
    }
    guardarEstado();
    renderRosterCards();
    U();
};

// REGISTRAR ACCIÓN AL TOCAR BOTÓN DE JUGADA
window.registrarAccionDirecta = (accion) => {
    if (!atletaSeleccionadoKey) {
        alert("Por favor selecciona un atleta del roster primero (Paso 1).");
        return;
    }

    let l = { playerKey: atletaSeleccionadoKey, action: accion };
    M.push(l);
    S.push(l);
    guardarEstado();
    U();
    
    // Mostrar Toast de éxito que dura 2 segundos
    mostrarToast(`Registrado: ${accion}`);
};

function guardarEstado() {
    localStorage.setItem('vRoster_' + empresaID, JSON.stringify(Roster));
    localStorage.setItem('vS_' + empresaID, JSON.stringify(S));
    localStorage.setItem('vM_' + empresaID, JSON.stringify(M));
}

// BOTÓN DESHACER / ELIMINAR JUGADA ANTERIOR
_('btnDeshacer').onclick = () => {
    if (!S.length && !M.length) {
        alert("No hay jugadas registradas para deshacer.");
        return;
    }

    if (confirm("¿Deseas eliminar la última jugada registrada por error?")) {
        // Remover última jugada del set actual y del partido total
        S.pop();
        M.pop();
        guardarEstado();
        U();
        mostrarToast("Última jugada eliminada");
    }
};

// ACTUALIZAR RENDERIZADO Y GRÁFICAS
function U() {
    const s = _('st');
    s.innerHTML = '';

    let d = {};
    Roster.forEach(p => {
        d[p.key] = { p: 0, n: 0, a: {}, name: p.name, num: p.num };
    });

    S.forEach(l => {
        let k = d[l.playerKey];
        if (k) {
            let v = N[l.action], t = l.action.charAt(l.action.length - 2);
            v > 0 ? k.p++ : k.n++;
            if (!k.a[t]) k.a[t] = { p: 0, n: 0 };
            v > 0 ? k.a[t].p++ : k.a[t].n++;
        }
    });

    if (!Roster.length) {
        s.innerHTML = '<p class="text-center text-slate-400 text-xs py-3">Agrega atletas al Roster para iniciar el registro.</p>';
    } else {
        Object.values(d).forEach(k => {
            let dt = '';
            Object.keys(k.a).forEach(x => dt += `<span class="mr-2 font-mono">${x}: <span class="text-emerald-600 font-bold">${k.a[x].p}</span>|<span class="text-rose-600 font-bold">${k.a[x].n}</span></span>`);
            s.innerHTML += `
                <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <div class="flex justify-between font-black text-slate-800">
                        <span>#${k.num} ${k.name}</span>
                        <span class="px-2 py-0.5 rounded-lg ${k.p - k.n >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">Dif: ${k.p - k.n}</span>
                    </div>
                    <div class="text-[10px] text-slate-500 mt-1">${dt || '<span class="italic text-slate-400">Sin jugadas registradas en este set</span>'}</div>
                </div>`;
        });
    }

    // Gráficas Chart.js
    const x1 = _('c1').getContext('2d'), x2 = _('c2').getContext('2d'), l = Object.values(O);
    let v1 = { p: [0,0,0,0,0,0], n: [0,0,0,0,0,0] }, v2 = { p: [0,0,0,0,0,0], n: [0,0,0,0,0,0] }, tp = 0, tn = 0;

    const keys = Object.keys(O);
    keys.forEach((k, idx) => {
        let p = 0, n = 0, ap = 0, an = 0;
        S.forEach(z => { if (z.action.charAt(z.action.length - 2) === k) N[z.action] > 0 ? p++ : n++; });
        M.forEach(z => { 
            if (z.action.charAt(z.action.length - 2) === k) {
                if (N[z.action] > 0) { ap++; tp++; } else { an++; tn++; }
            }
        });
        v1.p[idx] = p; v1.n[idx] = n;
        v2.p[idx] = ap; v2.n[idx] = an;
    });

    if (b) b.destroy();
    b = new Chart(x1, { type: 'bar', data: { labels: l, datasets: [{ label: 'Positivo (+)', data: v1.p, backgroundColor: P.b }, { label: 'Negativo (-)', data: v1.n, backgroundColor: P.o }] }, options: { ...K, plugins: { title: { display: true, text: 'SET ACTUAL' } } } });
    
    const loc = _('equipoLocal').value || 'Local';
    const riv = _('equipoRival').value || 'Rival';
    _('sum').innerHTML = `${loc} vs ${riv} — Positivos: <span class="text-emerald-600 font-bold">${tp}</span> | Negativos: <span class="text-rose-600 font-bold">${tn}</span>`;
    
    if (a) a.destroy();
    a = new Chart(x2, { type: 'bar', data: { labels: l, datasets: [{ label: 'Positivo (+)', data: v2.p, backgroundColor: P.g }, { label: 'Negativo (-)', data: v2.n, backgroundColor: P.o }] }, options: { ...K, plugins: { title: { display: true, text: 'TOTAL PARTIDO' } } } });
}

// REINICIAR SET
_('rs').onclick = () => {
    if (confirm('¿Desea limpiar los datos del set actual?')) { S = []; guardarEstado(); U(); mostrarToast('Set limpiado'); }
};

// ELIMINAR JUEGO (REINICIAR TODO)
_('ra').onclick = () => {
    if (confirm('¿Seguro que deseas ELIMINAR EL JUEGO? Se blanqueará el Roster, se borrarán las estadísticas y se reiniciarán los datos.')) {
        localStorage.removeItem('vRoster_' + empresaID);
        localStorage.removeItem('vS_' + empresaID);
        localStorage.removeItem('vM_' + empresaID);
        localStorage.removeItem('vLocal_' + empresaID);
        localStorage.removeItem('vRival_' + empresaID);
        Roster = []; S = []; M = []; atletaSeleccionadoKey = null;
        _('equipoLocal').value = clubNombre;
        _('equipoRival').value = 'Rival';
        _('atletaSeleccionadoBadge').classList.add('hidden');
        renderRosterCards();
        U();
        mostrarToast('Juego eliminado y reiniciado');
    }
};

init();
