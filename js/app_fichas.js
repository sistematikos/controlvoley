import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const _0xa = i => document.getElementById(i);
let _aL = [];

// Deshabilitar inspección
window.addEventListener('keydown', function(e) {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74 || e.keyCode == 67)) || (e.ctrlKey && e.keyCode == 88)) {
        e.preventDefault(); 
        return false;
    }
});

// Lectura de credenciales dinámicas de localStorage
const supaUrl = localStorage.getItem('control_voley_supa_url');
const supaKey = localStorage.getItem('control_voley_supa_key');
const clubID = localStorage.getItem('youcontrol_empresa_id') || localStorage.getItem('control_voley_club_id');
const clubNombre = localStorage.getItem('control_voley_club_nombre');

// Verificación de sesión flexible
if (!supaUrl || !supaKey) {
    console.warn("Faltan credenciales de Supabase. Redirigiendo a activación.");
    window.location.href = 'index.html';
}

// Inicializar cliente Supabase exclusivo del club
const supabase = createClient(supaUrl, supaKey);

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
    const imc = (parseFloat(pesoKg) / Math.pow(parseFloat(estaturaM), 2)).toFixed(1);
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

// Cálculo de Proyección de Talla Dianera / Genética
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
    } else { // Masculino por defecto
        proy = ((padreM + madreM + 0.13) / 2);
    }

    return `${proy.toFixed(2)} m (${Math.round(proy * 100)} cm)`;
};

// Cargar atletas desde Supabase
async function cargarFichas() {
    _0xa('userEmail').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Club: ${clubNombre || clubID || 'Activo'}`;

    try {
        const { data, error } = await supabase
            .from('atletas')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;
        _aL = data || [];
        _rL(_aL);
    } catch (err) {
        console.error("Error al obtener atletas:", err.message);
        _0xa('aLc').innerHTML = `
            <div class="col-span-full text-center py-12 glass-card rounded-2xl border border-rose-200">
                <i class="fas fa-exclamation-triangle text-3xl text-rose-500 mb-2"></i>
                <p class="text-rose-600 font-bold text-sm">Error al conectar con Supabase (${err.message}).</p>
            </div>`;
    }
}

// Renderizar Tarjetas de Ficha Completas
function _rL(p) {
    const c = _0xa('aLc');
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
        const fechaNac = k.fechaNacimiento || k.fecha_nacimiento;
        const age = calcularEdad(fechaNac);
        const foto = k.fotoUrl || k.foto_url;
        const cedula = k.cedulaIdentidad || k.cedula_identidad || k.cedula;
        const nombre = k.nombre || '';
        const apellido = k.apellido || '';
        const genero = k.genero || k.sexo || 'Masculino';
        const posicion = k.posicion || 'N/A';
        
        // Medidas corporales
        const estatura = k.estatura || k.altura || 0;
        const peso = k.peso || 0;
        const imcObj = calcularIMC(peso, estatura);
        
        // Saltabilidad y Alcances
        const alcRemate = k.alcanceRemate || k.alcance_remate || 'N/A';
        const alcBloqueo = k.alcanceBloqueo || k.alcance_bloqueo || 'N/A';

        // Proyección de Talla
        const estPadre = k.estaturaPadre || k.estatura_padre;
        const estMadre = k.estaturaMadre || k.estatura_madre;
        const proyeccionTalla = calcularProyeccionTalla(estPadre, estMadre, genero);
        
        const avatar = foto 
            ? `<img src="${foto}" class="w-24 h-24 rounded-full object-cover shadow-electric border-2 border-brand-cyan mx-auto mb-2">` 
            : `<div class="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-electric to-brand-cyan text-white flex items-center font-black justify-center text-2xl mx-auto mb-2 shadow-electric border-2 border-white">${(nombre[0]||'')+(apellido[0]||'')}</div>`;

        const card = document.createElement('div');
        card.className = "glass-card rounded-3xl p-5 sm:p-6 card-hover-effect border border-slate-200/80 hover:border-brand-electric/50 hover:shadow-electric flex flex-col justify-between group relative overflow-hidden cursor-pointer";
        
        card.innerHTML = `
            <div class="absolute top-0 right-0 w-24 h-24 bg-brand-electric/5 rounded-bl-full transition-all group-hover:scale-110 group-hover:bg-brand-electric/10"></div>
            
            <div>
                <!-- CABECERA DE LA FICHA -->
                <div class="text-center mb-4">
                    ${avatar}
                    <h4 class="text-lg font-black text-slate-900 leading-tight group-hover:text-brand-electric transition-colors mb-1">${nombre} ${apellido}</h4>
                    <div class="flex items-center justify-center gap-2">
                        <span class="px-2.5 py-0.5 bg-brand-50 text-brand-electric rounded-full font-extrabold text-[11px] border border-brand-electric/20">${k.categoria || 'Sin Categoría'}</span>
                        <span class="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-extrabold text-[11px] border border-slate-200">${posicion}</span>
                    </div>
                </div>

                <!-- BLOQUE BIOMÉTRICO (IMC Y PROYECCIÓN) -->
                <div class="grid grid-cols-2 gap-2.5 mb-3">
                    <!-- TARJETA IMC -->
                    <div class="p-2.5 rounded-2xl border bg-white/80 text-center shadow-sm">
                        <span class="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Métrica IMC</span>
                        <span class="text-base font-black text-slate-900">${imcObj.val}</span>
                        <span class="block text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border mt-0.5 ${imcObj.color}">${imcObj.diag}</span>
                    </div>

                    <!-- TARJETA PROYECCIÓN TALLA -->
                    <div class="p-2.5 rounded-2xl border border-brand-electric/20 bg-brand-50/50 text-center shadow-sm">
                        <span class="block text-[10px] font-extrabold text-brand-electric uppercase tracking-wider"><i class="fas fa-chart-line"></i> Talla Dianera</span>
                        <span class="text-xs font-black text-slate-900 mt-1 block">${proyeccionTalla}</span>
                        <span class="block text-[9px] font-bold text-slate-400 mt-0.5">Genética Estimada</span>
                    </div>
                </div>

                <!-- DETALLES TÉCNICOS Y MEDIDAS -->
                <div class="text-xs text-slate-600 space-y-2 text-left bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 font-semibold mb-2">
                    <div class="flex justify-between border-b border-slate-200/60 pb-1">
                        <span class="text-slate-400">Cédula:</span>
                        <span class="font-black text-slate-800">${cedula || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-200/60 pb-1">
                        <span class="text-slate-400">Edad / Género:</span>
                        <span class="font-black text-slate-800">${age} años (${genero})</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-200/60 pb-1">
                        <span class="text-slate-400">Estatura / Peso:</span>
                        <span class="font-black text-slate-800">${estatura ? estatura + ' m' : 'N/A'} / ${peso ? peso + ' kg' : 'N/A'}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-200/60 pb-1">
                        <span class="text-slate-400">Alc. Remate / Bloqueo:</span>
                        <span class="font-black text-slate-800">${alcRemate} / ${alcBloqueo}</span>
                    </div>
                    <div class="flex justify-between items-center pt-0.5">
                        <span class="text-slate-400">Sede / Club:</span>
                        <span class="font-black text-brand-electric truncate max-w-[130px]">${k.sede || clubNombre || 'Lara'}</span>
                    </div>
                </div>
            </div>
            
            <div class="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-black text-brand-electric group-hover:text-brand-cyan transition-colors">
                <span class="uppercase tracking-wider">Ver Ficha Completa</span>
                <i class="fas fa-arrow-right transform group-hover:translate-x-1.5 transition-transform"></i>
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = 'index_datos.html?id=' + k.id;
        });

        c.appendChild(card);
    });
}

// Búsqueda en tiempo real
window.fAl = () => {
    const t = _0xa('sAi').value.toLowerCase();
    const f = _aL.filter(x => {
        const nom = (x.nombre + ' ' + x.apellido).toLowerCase();
        const ci = (x.cedulaIdentidad || x.cedula_identidad || x.cedula || '').toString();
        const pos = (x.posicion || '').toLowerCase();
        return nom.includes(t) || ci.includes(t) || pos.includes(t);
    });
    _rL(f);
};

// Event listener para el campo de búsqueda
document.getElementById('sAi').addEventListener('keyup', window.fAl);

// Cerrar Sesión
document.getElementById('btnLogout').addEventListener('click', () => {
    if (confirm("¿Deseas salir del menú del club?")) {
        localStorage.removeItem('control_voley_licencia_validada');
        window.location.href = 'index.html';
    }
});

// Inicializar la carga al renderizar
cargarFichas();
