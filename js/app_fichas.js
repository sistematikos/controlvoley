import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const _0xa = i => document.getElementById(i);
let _aL = [];
let atletaSeleccionado = null;

// Credenciales del Supabase Maestro (licencias_clubes)
const MASTER_SUPA_URL = "https://ajdimbptzoeqzrrioywt.supabase.co";
const MASTER_SUPA_KEY = "sb_publishable_aVydbrj88elb7XVq1yopFw_2U4MHgHv";

// Deshabilitar inspección
window.addEventListener('keydown', function(e) {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74 || e.keyCode == 67)) || (e.ctrlKey && e.keyCode == 88)) {
        e.preventDefault(); 
        return false;
    }
});

const clubID = localStorage.getItem('youcontrol_empresa_id') || localStorage.getItem('control_voley_club_id') || 'YCDEP-CIAR';

let supabaseClub = null;
let clubInfo = null;

// Cálculo de edad exacta
const calcularEdad = (fecha) => {
    if (!fecha) return 'N/A';
    const a = new Date(fecha), o = new Date();
    let s = o.getFullYear() - a.getFullYear();
    if (o.getMonth() < a.getMonth() || (o.getMonth() === a.getMonth() && o.getDate() < a.getDate())) s--;
    return isNaN(s) ? 'N/A' : s;
};

// Cálculo de IMC y Diagnóstico
const calcularIMC = (pesoKg, estaturaM) => {
    if (!pesoKg || !estaturaM || estaturaM <= 0) return { val: 'N/A', diag: 'N/A', color: 'bg-slate-100 text-slate-600' };
    
    let altM = parseFloat(estaturaM);
    if (altM > 3) altM = altM / 100;

    const imc = (parseFloat(pesoKg) / Math.pow(altM, 2)).toFixed(1);
    let diag = 'Normal';
    let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';

    if (imc < 18.5) {
        diag = 'Bajo Peso';
        color = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (imc >= 25 && imc < 29.9) {
        diag = 'Sobrepeso';
        color = 'bg-amber-100 text-amber-800 border-amber-300';
    } else if (imc >= 30) {
        diag = 'Obesidad';
        color = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return { val: imc, diag, color };
};

// Proyección de Talla Genética
const calcularProyeccionTalla = (estaturaPadre, estaturaMadre, genero) => {
    const pad = parseFloat(estaturaPadre);
    const mad = parseFloat(estaturaMadre);

    if (!pad || !mad || isNaN(pad) || isNaN(mad)) return 'Sin Datos Padres';

    let proy = 0;
    const gen = (genero || '').toLowerCase();

    const padreM = pad > 3 ? pad / 100 : pad;
    const madreM = mad > 3 ? mad / 100 : mad;

    if (gen === 'femenino' || gen === 'f' || gen === 'femenina') {
        proy = ((padreM + madreM - 0.13) / 2);
    } else {
        proy = ((padreM + madreM + 0.13) / 2);
    }

    return `${proy.toFixed(2)} m (${Math.round(proy * 100)} cm)`;
};

async function inicializarModuloFichas() {
    try {
        const supabaseMaster = createClient(MASTER_SUPA_URL, MASTER_SUPA_KEY);

        const { data: licenciaData } = await supabaseMaster
            .from('licencias')
            .select('*')
            .eq('id', clubID)
            .single();

        let supaUrl = localStorage.getItem('control_voley_supa_url');
        let supaKey = localStorage.getItem('control_voley_supa_key');

        if (licenciaData) {
            clubInfo = licenciaData;
            supaUrl = licenciaData.supabase_url || supaUrl;
            supaKey = licenciaData.supabase_key || supaKey;
            
            localStorage.setItem('control_voley_supa_url', supaUrl);
            localStorage.setItem('control_voley_supa_key', supaKey);
            localStorage.setItem('control_voley_club_nombre', licenciaData.nombre || clubID);
        }

        if (!supaUrl || !supaKey) {
            alert("No se encontraron credenciales de Supabase para el club: " + clubID);
            window.location.href = 'index.html';
            return;
        }

        supabaseClub = createClient(supaUrl, supaKey);

        const nombreMostrar = (clubInfo && clubInfo.nombre) ? clubInfo.nombre : (localStorage.getItem('control_voley_club_nombre') || clubID);
        _0xa('userEmail').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Club: ${nombreMostrar}`;

        await cargarAtletasClub();

    } catch (err) {
        console.error("Error al cargar módulo de fichas:", err.message);
        _0xa('aLc').innerHTML = `
            <div class="col-span-full text-center py-12 glass-card rounded-2xl border border-rose-200">
                <i class="fas fa-exclamation-triangle text-3xl text-rose-500 mb-2"></i>
                <p class="text-rose-600 font-bold text-sm">Error al cargar la licencia (${err.message}).</p>
            </div>`;
    }
}

async function cargarAtletasClub() {
    try {
        const { data, error } = await supabaseClub
            .from('atletas')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;
        _aL = data || [];
        
        const urlParams = new URLSearchParams(window.location.search);
        const atletaIdUrl = urlParams.get('id');
        if (atletaIdUrl) {
            const encontrado = _aL.find(x => x.id === atletaIdUrl);
            if (encontrado) {
                mostrarFichaGrande(encontrado);
                return;
            }
        }

        _rL(_aL);
    } catch (err) {
        console.error("Error al obtener atletas:", err.message);
        _0xa('aLc').innerHTML = `
            <div class="text-center py-12 glass-card rounded-2xl border border-rose-200">
                <i class="fas fa-exclamation-triangle text-3xl text-rose-500 mb-2"></i>
                <p class="text-rose-600 font-bold text-sm">Error al conectar con la tabla de atletas (${err.message}).</p>
            </div>`;
    }
}

function _rL(p) {
    const c = _0xa('aLc');
    _0xa('seccionBusqueda').style.display = 'flex';
    c.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
    c.innerHTML = '';
    
    if (!p.length) {
        c.innerHTML = `
            <div class="col-span-full text-center py-12 glass-card rounded-2xl">
                <i class="fas fa-folder-open text-3xl text-slate-300 mb-2"></i>
                <p class="text-slate-400 font-bold text-sm">No se encontraron registros de atletas.</p>
            </div>`;
        return;
    }

    p.forEach(k => {
        const nombre = k.nombre || '';
        const apellido = k.apellido || '';
        const foto = k.fotoUrl;
        const cedula = k.cedulaIdentidad || 'N/A';

        const avatar = foto 
            ? `<img src="${foto}" class="w-20 h-20 rounded-full object-cover shadow-electric border-2 border-brand-cyan mx-auto mb-3">` 
            : `<div class="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-electric to-brand-cyan text-white flex items-center font-black justify-center text-xl mx-auto mb-3 shadow-electric border-2 border-white">${(nombre[0]||'')+(apellido[0]||'')}</div>`;

        const card = document.createElement('div');
        card.className = "glass-card rounded-3xl p-6 card-hover-effect border border-slate-200/80 hover:border-brand-electric/50 hover:shadow-electric text-center flex flex-col justify-between cursor-pointer group";
        
        card.innerHTML = `
            <div>
                ${avatar}
                <h4 class="text-lg font-black text-slate-900 group-hover:text-brand-electric transition-colors mb-1">${nombre} ${apellido}</h4>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3"><i class="fas fa-id-card text-brand-electric"></i> C.I: ${cedula}</p>
                <div class="flex justify-center gap-2 mb-2">
                    <span class="px-2.5 py-0.5 bg-brand-50 text-brand-electric rounded-full font-extrabold text-[11px] border border-brand-electric/20">${k.categoria || 'Sin Categoría'}</span>
                </div>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-black text-brand-electric group-hover:text-brand-cyan">
                <span class="uppercase tracking-wider">Ver Ficha Grande</span>
                <i class="fas fa-arrow-right transform group-hover:translate-x-1.5 transition-transform"></i>
            </div>
        `;

        card.addEventListener('click', () => {
            mostrarFichaGrande(k);
        });

        c.appendChild(card);
    });
}

function mostrarFichaGrande(k) {
    atletaSeleccionado = k;
    const c = _0xa('aLc');
    _0xa('seccionBusqueda').style.display = 'none';
    c.className = "max-w-4xl mx-auto";

    const nombre = k.nombre || '';
    const apellido = k.apellido || '';
    const foto = k.fotoUrl;
    const cedula = k.cedulaIdentidad || 'N/A';
    const age = calcularEdad(k.fechaNacimiento);
    const genero = k.genero || 'Masculino';
    const estatura = k.talla || k.estatura || 0;
    const peso = k.peso || 0;
    const imcObj = calcularIMC(peso, estatura);
    const proyeccionTalla = calcularProyeccionTalla(k.estaturaPadre, k.estaturaMadre, genero);
    const camiseta = k.nroCamiseta ? `#${k.nroCamiseta}` : 'S/N';

    const avatar = foto 
        ? `<img src="${foto}" class="w-36 h-36 rounded-3xl object-cover shadow-2xl border-4 border-brand-cyan mx-auto">` 
        : `<div class="w-36 h-36 rounded-3xl bg-gradient-to-tr from-brand-electric to-brand-cyan text-white flex items-center font-black justify-center text-4xl mx-auto shadow-2xl border-4 border-white">${(nombre[0]||'')+(apellido[0]||'')}</div>`;

    c.innerHTML = `
        <div class="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xl relative overflow-hidden">
            <!-- Botón Regresar al Listado Superior -->
            <button onclick="window.regresarListado()" class="mb-6 px-4 py-2 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-electric font-bold rounded-xl text-xs border border-slate-200 transition flex items-center gap-2 shadow-sm">
                <i class="fas fa-arrow-left"></i> Volver a la Lista de Atletas
            </button>

            <!-- Cabecera de la Ficha -->
            <div class="flex flex-col md:flex-row items-center gap-6 border-b border-slate-200 pb-6 mb-6">
                <div>${avatar}</div>
                <div class="text-center md:text-left">
                    <span class="text-xs font-black px-3 py-1 bg-brand-50 text-brand-electric rounded-full border border-brand-electric/20 uppercase tracking-widest inline-block mb-2">Expediente Oficial</span>
                    <h3 class="text-2xl sm:text-3xl font-black text-slate-900">${nombre} ${apellido}</h3>
                    <p class="text-sm font-bold text-slate-500 mt-1">Cédula: <span class="text-slate-800">${cedula}</span> | Camiseta: <span class="text-brand-electric font-black">${camiseta}</span></p>
                    <div class="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                        <span class="px-3 py-1 bg-slate-900 text-white rounded-xl font-extrabold text-xs">Categoría: ${k.categoria || 'N/A'}</span>
                        <span class="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl font-extrabold text-xs border">Sede: ${k.sede || 'Lara'}</span>
                    </div>
                </div>
            </div>

            <!-- TARJETAS DESTACADAS: IMC Y TALLA GENÉTICA -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <!-- Métrica IMC -->
                <div class="p-5 rounded-2xl border bg-white/90 shadow-sm flex items-center justify-between">
                    <div>
                        <span class="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Índice de Masa Corporal (IMC)</span>
                        <span class="text-2xl font-black text-slate-900">${imcObj.val}</span>
                        <span class="inline-block text-xs font-extrabold px-2.5 py-0.5 rounded-lg border mt-1 ${imcObj.color}">${imcObj.diag}</span>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-brand-50 text-brand-electric flex items-center justify-center text-xl font-bold">
                        <i class="fas fa-heart-pulse"></i>
                    </div>
                </div>

                <!-- Proyección Talla Genética -->
                <div class="p-5 rounded-2xl border border-brand-electric/20 bg-brand-50/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span class="block text-xs font-extrabold text-brand-electric uppercase tracking-wider"><i class="fas fa-chart-line"></i> Proyección Talla Genética</span>
                        <span class="text-xl font-black text-slate-900 mt-1 block">${proyeccionTalla}</span>
                        <span class="block text-[11px] font-bold text-slate-500 mt-0.5">Método Khamis-Roche (Talla Objetivo)</span>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-xl font-bold shadow-electric">
                        <i class="fas fa-ruler-vertical"></i>
                    </div>
                </div>
            </div>

            <!-- DETALLES TÉCNICOS COMPLETOS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/80 p-6 rounded-3xl border border-slate-200/70">
                <div class="space-y-3">
                    <h4 class="text-xs font-black text-brand-electric uppercase tracking-widest border-b border-slate-200 pb-2"><i class="fas fa-user-shield"></i> Datos Biométricos & Personales</h4>
                    <div class="flex justify-between text-xs font-semibold py-1 border-b border-slate-200/50">
                        <span class="text-slate-400">Edad Actual:</span>
                        <span class="font-black text-slate-800">${age} años</span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold py-1 border-b border-slate-200/50">
                        <span class="text-slate-400">Género:</span>
                        <span class="font-black text-slate-800">${genero}</span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold py-1 border-b border-slate-200/50">
                        <span class="text-slate-400">Estatura Actual:</span>
                        <span class="font-black text-slate-800">${estatura ? estatura + ' m' : 'N/A'}</span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold py-1">
                        <span class="text-slate-400">Peso Corporal:</span>
                        <span class="font-black text-slate-800">${peso ? peso + ' kg' : 'N/A'}</span>
                    </div>
                </div>

                <div class="space-y-3">
                    <h4 class="text-xs font-black text-brand-electric uppercase tracking-widest border-b border-slate-200 pb-2"><i class="fas fa-phone-alt"></i> Datos de Contacto & Representante</h4>
                    <div class="flex justify-between text-xs font-semibold py-1 border-b border-slate-200/50">
                        <span class="text-slate-400">Teléfono Atleta:</span>
                        <span class="font-black text-slate-800">${k.telefono || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold py-1 border-b border-slate-200/50">
                        <span class="text-slate-400">Representante:</span>
                        <span class="font-black text-slate-800">${k.nombreRepresentante || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold py-1 border-b border-slate-200/50">
                        <span class="text-slate-400">Cédula Representante:</span>
                        <span class="font-black text-slate-800">${k.cedulaRepresentante || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold py-1">
                        <span class="text-slate-400">Teléfono Representante:</span>
                        <span class="font-black text-slate-800">${k.telefonoRepresentante || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.regresarListado = () => {
    _rL(_aL);
};

window.fAl = () => {
    const t = _0xa('sAi').value.toLowerCase();
    const f = _aL.filter(x => {
        const nom = (x.nombre + ' ' + x.apellido).toLowerCase();
        const ci = (x.cedulaIdentidad || '').toString();
        const cat = (x.categoria || '').toLowerCase();
        return nom.includes(t) || ci.includes(t) || cat.includes(t);
    });
    _rL(f);
};

document.getElementById('sAi').addEventListener('keyup', window.fAl);

document.getElementById('btnLogout').addEventListener('click', () => {
    if (confirm("¿Deseas salir del menú del club?")) {
        localStorage.removeItem('control_voley_licencia_validada');
        window.location.href = 'index.html';
    }
});

inicializarModuloFichas();
