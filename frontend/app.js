// =====================================================
//  UTILIDADES
// =====================================================
const $ = id => document.getElementById(id);
const fmt = (n, d = 4) => Number(n).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
const dinero = n => '$' + fmt(n, 2);   // siempre 2 decimales
const LETRA_PERIODO = { '1': 'A', '2': 'S', '3': 'C', '4': 'T', '6': 'B', '12': 'M' };

// Lee un campo numérico y lanza un error con mensaje claro si no es válido
function leerNumero(id, nombre, { entero = false, permitirCero = false, max = null } = {}) {
    const raw = $(id).value.trim();
    if (raw === '') throw new Error(`Completa el campo "${nombre}".`);
    const n = Number(raw);
    if (!isFinite(n)) throw new Error(`"${nombre}" debe ser un número.`);
    if (permitirCero ? n < 0 : n <= 0) {
        throw new Error(permitirCero ? `"${nombre}" no puede ser negativo.` : `"${nombre}" debe ser mayor que 0.`);
    }
    if (entero && !Number.isInteger(n)) throw new Error(`"${nombre}" debe ser un número entero (sin decimales).`);
    if (max !== null && n > max) throw new Error(`"${nombre}" no puede ser mayor que ${max.toLocaleString('es-CO')}.`);
    return n;
}

function cajaError(box) {
    let e = $(box.id + '-error');
    if (!e) {
        e = document.createElement('div');
        e.id = box.id + '-error';
        e.className = 'resultado-box error hidden';
        box.parentNode.insertBefore(e, box);
    }
    return e;
}
// Oculta resultado anterior y error anterior
function limpiar(box) { box.classList.add('hidden'); cajaError(box).classList.add('hidden'); }
function mostrarError(box, msg) {
    box.classList.add('hidden');             // nunca dejar un resultado viejo visible
    const e = cajaError(box);
    e.textContent = '⚠️ ' + msg;
    e.classList.remove('hidden');
}
function mostrarResultado(box, html) { box.innerHTML = html; box.classList.remove('hidden'); }

async function llamarApi(url, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    let data;
    try { data = await response.json(); }
    catch { throw new Error('El servidor respondió de forma inesperada.'); }
    if (!data.exito) throw new Error(data.error || 'No se pudo calcular.');
    return data;
}

async function ejecutar(box, fn) {
    limpiar(box);
    try { await fn(); }
    catch (e) {
        mostrarError(box, e instanceof TypeError ? 'No se pudo conectar con el servidor.' : e.message);
    }
}

// =====================================================
//  PESTAÑAS
// =====================================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        $(btn.getAttribute('data-target')).classList.add('active');
    });
});

// =====================================================
//  TOGGLES DE FORMULARIOS
// =====================================================
const mostrar = (id, display) => { $(id).style.display = display; };

function toggleSimpleFields() {
    const c = $('simple-calcular').value;
    ['group-simple-vp', 'group-simple-vf', 'group-simple-tasa', 'group-simple-tiempo'].forEach(i => mostrar(i, 'none'));
    if (c === 'interes' || c === 'vf') { mostrar('group-simple-vp', 'block'); mostrar('group-simple-tasa', 'flex'); mostrar('group-simple-tiempo', 'flex'); }
    else if (c === 'vp') { mostrar('group-simple-vf', 'block'); mostrar('group-simple-tasa', 'flex'); mostrar('group-simple-tiempo', 'flex'); }
    else if (c === 'tasa') { mostrar('group-simple-vp', 'block'); mostrar('group-simple-vf', 'block'); mostrar('group-simple-tiempo', 'flex'); }
    else if (c === 'tiempo') { mostrar('group-simple-vp', 'block'); mostrar('group-simple-vf', 'block'); mostrar('group-simple-tasa', 'flex'); }
}

function toggleCompuestoFields() {
    const c = $('comp-calcular').value;
    ['group-comp-monto', 'group-comp-vp', 'group-comp-vf', 'group-comp-tasa', 'group-comp-tiempo', 'group-comp-res-tasa'].forEach(i => mostrar(i, 'none'));
    if (c === 'vf' || c === 'vp') {
        mostrar('group-comp-monto', 'block');
        $('lbl-comp-monto').innerText = c === 'vf' ? 'Capital Inicial / Valor Presente ($):' : 'Monto Final / Valor Futuro ($):';
        mostrar('group-comp-tasa', 'flex'); mostrar('group-comp-tiempo', 'flex');
    } else if (c === 'tasa') {
        mostrar('group-comp-vp', 'block'); mostrar('group-comp-vf', 'block'); mostrar('group-comp-tiempo', 'flex'); mostrar('group-comp-res-tasa', 'flex');
    } else if (c === 'tiempo') {
        mostrar('group-comp-vp', 'block'); mostrar('group-comp-vf', 'block'); mostrar('group-comp-tasa', 'flex');
    }
}

function toggleAnualidadFields() {
    const c = $('anu-calcular').value;
    const pideValor = c === 'pago_vp' || c === 'pago_vf';
    mostrar('group-anu-pago', pideValor ? 'none' : 'block');
    mostrar('group-anu-valor', pideValor ? 'block' : 'none');
    $('lbl-anu-valor').innerText = c === 'pago_vf' ? 'Valor Futuro ($):' : 'Valor Presente ($):';
    const esVP = c === 'vp' || c === 'pago_vp';
    mostrar('group-anu-dif', esVP ? 'block' : 'none');
    if (!esVP) $('anu-diferimiento').value = 0;
}

// Con pago anticipado la gracia solo puede ser con interés capitalizado
function toggleGracia() {
    const anticipado = $('pres-tipo-pago').value === 'anticipado';
    $('pres-tipo-gracia').disabled = anticipado;
    if (anticipado) $('pres-tipo-gracia').value = 'total';
}

window.addEventListener('DOMContentLoaded', () => {
    toggleSimpleFields();
    toggleCompuestoFields();
    toggleAnualidadFields();
    toggleGracia();
});

// =====================================================
//  CONVERSIÓN DE TASAS
// =====================================================
function simularTasa() {
    const box = $('resultado-tasas');
    return ejecutar(box, async () => {
        const origenValor = leerNumero('tasas-origen-valor', 'Valor de la tasa', { max: 1000 });
        const destinoTipo = $('tasas-destino-tipo').value;
        const destinoPeriodo = $('tasas-destino-periodo').value;
        const destinoModalidad = $('tasas-destino-modalidad').value;
        const data = await llamarApi('/api/tasas', {
            origen_valor: origenValor, origen_tipo: $('tasas-origen-tipo').value,
            origen_periodo: $('tasas-origen-periodo').value, origen_modalidad: $('tasas-origen-modalidad').value,
            destino_tipo: destinoTipo, destino_periodo: destinoPeriodo, destino_modalidad: destinoModalidad
        });
        const etiqueta = (destinoTipo === 'efectiva' ? 'E' : 'N') + LETRA_PERIODO[destinoPeriodo] + (destinoModalidad === 'vencida' ? 'V' : 'A');
        mostrarResultado(box, `
            <strong>Resultado:</strong> <br>
            Tasa Destino: <b>${fmt(data.tasa_destino)}% ${etiqueta}</b> <br>
            <small>Equivalente a una tasa Efectiva Anual Vencida (EA) del ${fmt(data.tasa_ea * 100)}%</small>`);
    });
}

// =====================================================
//  INTERÉS SIMPLE
// =====================================================
function simularSimple() {
    const calcular = $('simple-calcular').value;
    const box = $('resultado-simple');
    return ejecutar(box, async () => {
        const body = { calcular };
        const tiempo = () => { body.tiempo = leerNumero('simple-tiempo', 'Tiempo'); body.tiempo_unidad = $('simple-tiempo-unidad').value; };
        const tasa = () => { body.tasa = leerNumero('simple-tasa', 'Tasa de interés', { max: 1000 }); body.tasa_unidad = $('simple-tasa-unidad').value; };
        if (calcular === 'interes' || calcular === 'vf') { body.vp = leerNumero('simple-vp', 'Capital inicial'); tasa(); tiempo(); }
        else if (calcular === 'vp') { body.vf = leerNumero('simple-vf', 'Monto final'); tasa(); tiempo(); }
        else if (calcular === 'tasa') { body.vp = leerNumero('simple-vp', 'Capital inicial'); body.vf = leerNumero('simple-vf', 'Monto final'); tiempo(); }
        else if (calcular === 'tiempo') { body.vp = leerNumero('simple-vp', 'Capital inicial'); body.vf = leerNumero('simple-vf', 'Monto final'); tasa(); }

        const data = await llamarApi('/api/simple', body);
        if (data.tipo_calc === 'tasa') mostrarResultado(box, `<strong>Tasa Calculada (anual):</strong> <br> <b>${fmt(data.resultado)}% anual</b>`);
        else if (data.tipo_calc === 'tiempo') mostrarResultado(box, `<strong>Tiempo Calculado:</strong> <br> <b>${fmt(data.resultado)} Años</b>`);
        else if (data.tipo_calc === 'interes') mostrarResultado(box, `<strong>Interés Generado:</strong> <br> <b>${dinero(data.resultado)}</b>`);
        else mostrarResultado(box, `<strong>${calcular === 'vf' ? 'Valor Futuro' : 'Valor Presente'}:</strong> <br> <b>${dinero(data.resultado)}</b>`);
    });
}

// =====================================================
//  INTERÉS COMPUESTO
// =====================================================
function etiquetaTasaResultado() {
    const tipo = $('comp-res-tipo').value === 'efectiva' ? 'E' : 'N';
    return `${tipo}${LETRA_PERIODO[$('comp-res-periodo').value]}V`;
}

function simularCompuesto() {
    const calcular = $('comp-calcular').value;
    const box = $('resultado-compuesto');
    return ejecutar(box, async () => {
        const body = { calcular };
        const tasa = () => {
            body.tasa = leerNumero('comp-tasa', 'Tasa de interés', { max: 1000 });
            body.tasa_tipo = $('comp-tipo').value; body.tasa_periodo = $('comp-periodo').value; body.tasa_modalidad = $('comp-modalidad').value;
        };
        const tiempo = () => { body.tiempo = leerNumero('comp-tiempo', 'Tiempo'); body.tiempo_unidad = $('comp-tiempo-unidad').value; };
        if (calcular === 'vf' || calcular === 'vp') { body.monto = leerNumero('comp-monto', 'Monto'); tasa(); tiempo(); }
        else if (calcular === 'tasa') {
            body.vp = leerNumero('comp-vp', 'Capital inicial'); body.vf = leerNumero('comp-vf', 'Monto final'); tiempo();
            body.res_tipo = $('comp-res-tipo').value; body.res_periodo = $('comp-res-periodo').value;
        } else if (calcular === 'tiempo') { body.vp = leerNumero('comp-vp', 'Capital inicial'); body.vf = leerNumero('comp-vf', 'Monto final'); tasa(); }

        const data = await llamarApi('/api/compuesto', body);
        if (data.tipo_calc === 'tasa') mostrarResultado(box, `<strong>Tasa Calculada:</strong> <br> <b>${fmt(data.resultado)}% ${etiquetaTasaResultado()}</b>`);
        else if (data.tipo_calc === 'tiempo') mostrarResultado(box, `<strong>Tiempo Calculado:</strong> <br> <b>${fmt(data.resultado)} Años</b>`);
        else mostrarResultado(box, `<strong>${calcular === 'vf' ? 'Valor Futuro' : 'Valor Presente'}:</strong> <br> <b>${dinero(data.resultado)}</b><br><small>EA usada: ${fmt(data.tasa_ea)}%</small>`);
    });
}

// =====================================================
//  PRÉSTAMOS
// =====================================================
function agregarAbono() {
    const fila = document.createElement('div');
    fila.className = 'abono-fila';
    fila.innerHTML = `
        <div class="input-group"><label>En la cuota (N°):</label><input type="number" class="abono-cuota" min="0" step="1" placeholder="Ej: 8"></div>
        <div class="input-group"><label>Valor del abono ($):</label><input type="number" class="abono-valor" min="0.01" step="0.01" placeholder="Ej: 38000000"></div>
        <button type="button" class="btn-secundario" onclick="this.parentElement.remove()">Quitar</button>`;
    $('abonos-lista').appendChild(fila);
}

function leerAbonos() {
    const abonos = [];
    document.querySelectorAll('#abonos-lista .abono-fila').forEach((fila, i) => {
        const c = fila.querySelector('.abono-cuota').value.trim();
        const v = fila.querySelector('.abono-valor').value.trim();
        if (c === '' && v === '') return;   // fila vacía: se ignora
        const cuota = Number(c), valor = Number(v);
        if (c === '' || !Number.isInteger(cuota) || cuota < 0) throw new Error(`Abono ${i + 1}: la cuota debe ser un número entero.`);
        if (v === '' || !isFinite(valor) || valor <= 0) throw new Error(`Abono ${i + 1}: el valor debe ser mayor que 0.`);
        abonos.push({ cuota, valor });
    });
    return abonos;
}

function simularPrestamo() {
    const box = $('resultado-prestamos');
    return ejecutar(box, async () => {
        const monto = leerNumero('pres-monto', 'Monto del préstamo');
        const tasa = leerNumero('pres-tasa', 'Tasa de interés', { max: 1000 });
        const plazo = leerNumero('pres-plazo', 'Número de cuotas', { entero: true, max: 600 });
        const gracia = leerNumero('pres-gracia', 'Periodos de gracia', { entero: true, permitirCero: true });
        if (gracia >= plazo) throw new Error('Los periodos de gracia deben ser menos que el número de cuotas.');

        const data = await llamarApi('/api/prestamos', {
            monto, tasa, tasa_tipo: $('pres-tipo').value, tasa_periodo: $('pres-periodo').value, tasa_modalidad: $('pres-modalidad').value,
            frecuencia_pago: $('pres-frecuencia').value, plazo,
            tipo_pago: $('pres-tipo-pago').value,
            gracia, tipo_gracia: $('pres-tipo-gracia').value,
            abonos: leerAbonos(), modo_abono: $('pres-modo-abono').value,
            sistema_cuota: $('pres-sistema').value,
            edad: $('pres-edad').value.trim(), plazo_minimo: $('pres-plazo-minimo').value.trim()
        });

        let resumen;
        if (data.sistema === 'variable') {
            resumen = `Primera cuota: <span style="color: #2e7d32; font-size: 1.2rem;">${dinero(data.cuota_fija)}</span>`
                + `<br>Última cuota: <span style="color: #2e7d32; font-size: 1.2rem;">${dinero(data.cuota_final)}</span>`;
        } else {
            resumen = `Cuota: <span style="color: #2e7d32; font-size: 1.2rem;">${dinero(data.cuota_fija)}</span>`;
            if (Math.abs(data.cuota_final - data.cuota_fija) > 0.005) {
                resumen += `<br>Cuota después de los abonos: <span style="color: #2e7d32; font-size: 1.2rem;">${dinero(data.cuota_final)}</span>`;
            }
        }
        resumen += `<br><small>Plazo: ${data.plazo_meses} meses`
            + (data.edad_final !== undefined ? ` · Edad del titular: ${data.edad} años (al terminar: ${fmt(data.edad_final, 1)} años)` : '')
            + `</small>`;
        resumen += `<br><small>Número de pagos: ${data.num_pagos} · Total pagado: ${dinero(data.total_pagado)} · Total intereses: ${dinero(data.total_intereses)}</small>`;
        if (data.ahorro_intereses > 0) resumen += `<br><small>Ahorro en intereses por los abonos: ${dinero(data.ahorro_intereses)}</small>`;
        resumen += `<br><small>Tasa periódica aplicada: ${fmt(data.tasa_periodica_aplicada)}%</small>`;
        $('pres-resumen').innerHTML = resumen;

        const tbody = $('tbody-amortizacion');
        tbody.innerHTML = '';
        data.tabla.forEach(f => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';
            tr.innerHTML = `
                <td style="text-align: center;">${f.periodo}${f.nota ? `<span class="nota-fila">${f.nota}</span>` : ''}</td>
                <td>${dinero(f.cuota)}</td>
                <td style="color: #d32f2f;">${dinero(f.interes)}</td>
                <td style="color: #1976d2;">${dinero(f.abono_capital)}</td>
                <td style="color: #1976d2;">${f.abono_extra > 0 ? dinero(f.abono_extra) : '—'}</td>
                <td style="font-weight: 600;">${dinero(f.saldo)}</td>`;
            tbody.appendChild(tr);
        });
        box.classList.remove('hidden');
    });
}

// =====================================================
//  ANUALIDADES
// =====================================================
function simularAnualidad() {
    const calcular = $('anu-calcular').value;
    const box = $('resultado-anualidades');
    return ejecutar(box, async () => {
        const body = {
            calcular,
            n: leerNumero('anu-n', 'Número de pagos', { entero: true, max: 1200 }),
            frecuencia_pago: $('anu-frecuencia').value,
            tipo_pago: $('anu-tipo-pago').value,
            tasa: leerNumero('anu-tasa', 'Tasa de interés', { max: 1000 }),
            tasa_tipo: $('anu-tipo').value, tasa_periodo: $('anu-periodo').value, tasa_modalidad: $('anu-modalidad').value,
            diferimiento: leerNumero('anu-diferimiento', 'Periodos de diferimiento', { entero: true, permitirCero: true })
        };
        if (calcular === 'vp' || calcular === 'vf') body.pago = leerNumero('anu-pago', 'Pago periódico');
        else body.valor = leerNumero('anu-valor', calcular === 'pago_vf' ? 'Valor futuro' : 'Valor presente');

        const data = await llamarApi('/api/anualidades', body);
        const titulos = { vp: 'Valor Presente', vf: 'Valor Futuro', pago_vp: 'Pago periódico (A)', pago_vf: 'Pago periódico (A)' };
        mostrarResultado(box, `
            <strong>${titulos[calcular]}:</strong> <br> <b>${dinero(data.resultado)}</b><br>
            <small>Fórmula: ${data.formula}</small><br>
            <small>Tasa efectiva por periodo de pago (i): ${fmt(data.i_periodica)}% · EA equivalente: ${fmt(data.tasa_ea)}%</small>`);
    });
}

// =====================================================
//  DESCUENTO BANCARIO
// =====================================================
function simularDescuento() {
    const box = $('resultado-descuento');
    return ejecutar(box, async () => {
        const fecha_inicio = $('desc-fecha-inicio').value;
        const fecha_descuento = $('desc-fecha-descuento').value;
        if (!fecha_inicio || !fecha_descuento) throw new Error('Completa las fechas de emisión y de descuento.');
        const body = {
            valor_inicial: leerNumero('desc-valor-inicial', 'Valor inicial'),
            fecha_inicio,
            plazo_dias: leerNumero('desc-plazo-dias', 'Plazo (días)', { entero: true, max: 36500 }),
            tasa_interes: leerNumero('desc-tasa-interes', 'Tasa de interés', { max: 1000 }),
            fecha_descuento,
            tasa_descuento: leerNumero('desc-tasa-descuento', 'Tasa de descuento', { max: 100 }),
            base_dias: $('desc-base-dias').value
        };
        const data = await llamarApi('/api/descuento', body);
        mostrarResultado(box, `
            <strong>Resultados del Descuento:</strong> <br><br>
            <b>a) Fecha de Vencimiento:</b> ${data.fecha_vencimiento} <br>
            <b>b) Valor al Vencimiento:</b> ${dinero(data.valor_vencimiento)} <br>
            <b>c) Valor de la Transacción:</b> ${dinero(data.valor_transaccion)} <br><br>
            <small>Días exactos descontados: ${data.dias_descuento} días</small>`);
    });
}