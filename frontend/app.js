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

// Seguro: la casilla lo activa o lo quita (por defecto 0,05 %)
function toggleSeguro() {
    $('pres-seguro').disabled = !$('pres-seguro-activo').checked;
}

// Convierte una tasa (%) a la tasa equivalente (misma EA) expresada en otro periodo
function convertirTasa(valor, tipo, periodo, modalidad, nuevoPeriodo) {
    const periodica = tipo === 'nominal' ? valor / 100 / periodo : valor / 100;
    if (modalidad === 'anticipada' && periodica >= 1) return null;
    const vencida = modalidad === 'anticipada' ? periodica / (1 - periodica) : periodica;
    const ea = Math.pow(1 + vencida, periodo) - 1;
    const nuevaVencida = Math.pow(1 + ea, 1 / nuevoPeriodo) - 1;
    const nuevaPeriodica = modalidad === 'anticipada' ? nuevaVencida / (1 + nuevaVencida) : nuevaVencida;
    return (tipo === 'nominal' ? nuevaPeriodica * nuevoPeriodo : nuevaPeriodica) * 100;
}

const NOMBRE_FREC = { '12': 'mensuales', '6': 'bimestrales', '4': 'trimestrales', '3': 'cuatrimestrales', '2': 'semestrales', '1': 'anuales' };

// Al cambiar la frecuencia de pago se ajustan la tasa, el número de cuotas y la gracia
function cambiarFrecuencia() {
    const sel = $('pres-frecuencia');
    const vieja = Number(sel.dataset.prev || sel.value), nueva = Number(sel.value);
    sel.dataset.prev = sel.value;
    const aviso = $('pres-aviso-frecuencia');
    aviso.textContent = '';
    if (vieja === nueva) return;
    const msgs = [];

    // Plazo: se mantiene el mismo tiempo total (cuotas x nueva / vieja)
    const plazoTxt = $('pres-plazo').value.trim(), plazo = Number(plazoTxt);
    if (plazoTxt !== '' && isFinite(plazo) && plazo > 0) {
        const exacto = plazo * nueva / vieja;
        const nuevo = Math.max(1, Math.min(600, Math.round(exacto)));
        $('pres-plazo').value = nuevo;
        msgs.push(`Plazo: ${nuevo} cuotas ${NOMBRE_FREC[nueva]}`);
        if (Math.abs(exacto - nuevo) > 1e-9) msgs.push(`se redondeó desde ${fmt(exacto, 2)} para que sea entero`);
    }
    const gracia = Number($('pres-gracia').value);
    if (gracia > 0) $('pres-gracia').value = Math.max(0, Math.round(gracia * nueva / vieja));

    // Tasa: misma tasa efectiva anual, expresada en el periodo de la nueva frecuencia
    const tasaTxt = $('pres-tasa').value.trim(), tasa = Number(tasaTxt);
    if (tasaTxt !== '' && isFinite(tasa) && tasa > 0) {
        const nuevaTasa = convertirTasa(tasa, $('pres-tipo').value, Number($('pres-periodo').value), $('pres-modalidad').value, nueva);
        if (nuevaTasa !== null) {
            const redondeada = Number(nuevaTasa.toFixed(6));
            $('pres-tasa').value = redondeada;
            $('pres-periodo').value = String(nueva);
            msgs.push(`Tasa convertida a ${fmt(redondeada, 4)} % (periodo ${NOMBRE_FREC[nueva].replace(/es$|s$/, '')}), equivalente a la anterior`);
        }
    }
    aviso.textContent = msgs.length ? msgs.join('. ') + '.' : '';
}

window.addEventListener('DOMContentLoaded', () => {
    $('pres-frecuencia').dataset.prev = $('pres-frecuencia').value;
    toggleSeguro();
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
        const monto = leerNumero('pres-monto', 'Monto del préstamo o valor del bien');
        const porcentajeTexto = $('pres-porcentaje').value.trim();
        if (porcentajeTexto !== '') leerNumero('pres-porcentaje', '% a financiar', { max: 100 });
        const tasa = leerNumero('pres-tasa', 'Tasa de interés', { max: 1000 });
        const plazo = leerNumero('pres-plazo', 'Número de cuotas', { entero: true, max: 600 });
        const seguroTexto = $('pres-seguro-activo').checked ? $('pres-seguro').value.trim() : '';
        if (seguroTexto !== '') leerNumero('pres-seguro', 'Seguro (% por periodo)', { max: 10, permitirCero: true });
        const gracia = leerNumero('pres-gracia', 'Periodos de gracia', { entero: true, permitirCero: true });
        if (gracia >= plazo) throw new Error('Los periodos de gracia deben ser menos que el número de cuotas.');

        const data = await llamarApi('/api/prestamos', {
            monto, porcentaje_financiar: porcentajeTexto, tasa, tasa_tipo: $('pres-tipo').value, tasa_periodo: $('pres-periodo').value, tasa_modalidad: $('pres-modalidad').value,
            frecuencia_pago: $('pres-frecuencia').value, plazo,
            tipo_pago: $('pres-tipo-pago').value,
            gracia, tipo_gracia: $('pres-tipo-gracia').value,
            abonos: leerAbonos(), modo_abono: $('pres-modo-abono').value,
            sistema_cuota: $('pres-sistema').value, seguro: seguroTexto,
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
        if (data.porcentaje_financiar < 100) {
            resumen += `<br><small>Valor del bien: ${dinero(data.valor_bien)} · Financias el ${fmt(data.porcentaje_financiar, 2)} %: `
                + `<b>${dinero(data.monto_financiado)}</b> · Cuota inicial (la pones tú): ${dinero(data.cuota_inicial)}</small>`;
        }
        resumen += `<br><small>Plazo: ${data.plazo_meses} meses`
            + (data.edad_final !== undefined ? ` · Edad del titular: ${data.edad} años (al terminar: ${fmt(data.edad_final, 1)} años)` : '')
            + `</small>`;
        resumen += `<br><small>Número de pagos: ${data.num_pagos} · Total pagado: ${dinero(data.total_pagado)} · Total intereses: ${dinero(data.total_intereses)}</small>`;
        if (data.seguro_pct > 0) resumen += `<br><small>Seguro: ${fmt(data.seguro_pct, 4)} % por periodo sobre el saldo · Total seguro: ${dinero(data.total_seguro)} (se suma a cada pago)</small>`;
        if (data.ahorro_intereses > 0) resumen += `<br><small>Ahorro en intereses por los abonos: ${dinero(data.ahorro_intereses)}</small>`;
        resumen += `<br><small>Tasa periódica aplicada: ${fmt(data.tasa_periodica_aplicada)}%</small>`;
        $('pres-resumen').innerHTML = resumen;

        const tbody = $('tbody-amortizacion');
        tbody.innerHTML = '';
        // Con pago vencido la tabla arranca en el periodo 0: el día del desembolso, sin cuota ni intereses
        if (data.tabla.length && data.tabla[0].periodo === 1) {
            const tr0 = document.createElement('tr');
            tr0.style.borderBottom = '1px solid #eee';
            tr0.innerHTML = `
                <td style="text-align: center;">0<span class="nota-fila">Desembolso (hoy)</span></td>
                <td>—</td><td>—</td><td>—</td><td>—</td><td>—</td>
                <td style="font-weight: 600;">${dinero(data.monto_financiado)}</td>`;
            tbody.appendChild(tr0);
        }
        data.tabla.forEach(f => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';
            tr.innerHTML = `
                <td style="text-align: center;">${f.periodo}${f.nota ? `<span class="nota-fila">${f.nota}</span>` : ''}</td>
                <td>${dinero(f.cuota + f.seguro + f.abono_extra)}</td>
                <td style="color: #d32f2f;">${dinero(f.interes)}</td>
                <td style="color: #8e24aa;">${f.seguro > 0 ? dinero(f.seguro) : '—'}</td>
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

// =====================================================
//  EJEMPLOS (un botón en cada pestaña) Y RESUMEN DE LA CONVERSIÓN
// =====================================================
function fijar(valores) {
    Object.entries(valores).forEach(([id, v]) => { const e = $(id); if (e) e.value = v; });
}

const EJEMPLOS = {
    tasas: {
        texto: 'Convierte una tasa de 24,96 % efectiva anual vencida a efectiva mensual vencida. Resultado esperado: 1,8742 % EMV.',
        cargar() {
            fijar({ 'tasas-origen-valor': 24.96, 'tasas-origen-tipo': 'efectiva', 'tasas-origen-periodo': '1', 'tasas-origen-modalidad': 'vencida',
                    'tasas-destino-tipo': 'efectiva', 'tasas-destino-periodo': '12', 'tasas-destino-modalidad': 'vencida' });
            vistaPreviaTasas(); simularTasa();
        }
    },
    simple: {
        texto: 'Un capital de $1.000.000 al 24 % anual durante 2 años: ¿cuál es el valor futuro? Resultado esperado: $1.480.000,00.',
        cargar() {
            fijar({ 'simple-calcular': 'vf', 'simple-vp': 1000000, 'simple-tasa': 24, 'simple-tasa-unidad': '1', 'simple-tiempo': 2, 'simple-tiempo-unidad': '1' });
            toggleSimpleFields(); simularSimple();
        }
    },
    compuesto: {
        texto: '$1.000.000 al 24 % nominal mensual vencida durante 1 año: ¿cuál es el valor futuro? Resultado esperado: $1.268.241,79.',
        cargar() {
            fijar({ 'comp-calcular': 'vf', 'comp-monto': 1000000, 'comp-tasa': 24, 'comp-tipo': 'nominal', 'comp-periodo': '12',
                    'comp-modalidad': 'vencida', 'comp-tiempo': 1, 'comp-tiempo-unidad': '1' });
            toggleCompuestoFields(); simularCompuesto();
        }
    },
    prestamos: {
        texto: 'Crédito de $200.000.000 al 24,96 % efectiva anual en 24 cuotas mensuales, con un abono de $38.000.000 en la cuota 8 que reduce el tiempo. Resultado esperado: cuota $10.424.140,47 y 20 pagos (sin el abono serían 24).',
        cargar() {
            fijar({ 'pres-monto': 200000000, 'pres-porcentaje': '', 'pres-tasa': 24.96, 'pres-tipo': 'efectiva', 'pres-periodo': '1', 'pres-modalidad': 'vencida',
                    'pres-frecuencia': '12', 'pres-plazo': 24, 'pres-tipo-pago': 'vencido', 'pres-gracia': 0, 'pres-tipo-gracia': 'parcial',
                    'pres-sistema': 'fija', 'pres-seguro': 0.05, 'pres-edad': '', 'pres-plazo-minimo': '', 'pres-modo-abono': 'plazo' });
            $('pres-seguro-activo').checked = true; toggleSeguro();
            $('pres-frecuencia').dataset.prev = '12'; $('pres-aviso-frecuencia').textContent = '';
            toggleGracia();
            $('abonos-lista').innerHTML = '';
            agregarAbono();
            const f = document.querySelector('#abonos-lista .abono-fila');
            f.querySelector('.abono-cuota').value = 8;
            f.querySelector('.abono-valor').value = 38000000;
            simularPrestamo();
        }
    },
    anualidades: {
        texto: 'Arriendo de $1.000.000 pagado al inicio de cada mes durante 12 meses e invertido al 24 % nominal mensual vencida: ¿cuánto acumulas? (valor futuro, anualidad anticipada). Resultado esperado: $13.680.331,52.',
        cargar() {
            fijar({ 'anu-calcular': 'vf', 'anu-pago': 1000000, 'anu-n': 12, 'anu-frecuencia': '12', 'anu-tipo-pago': 'anticipada',
                    'anu-tasa': 24, 'anu-tipo': 'nominal', 'anu-periodo': '12', 'anu-modalidad': 'vencida', 'anu-diferimiento': 0 });
            toggleAnualidadFields(); simularAnualidad();
        }
    },
    descuento: {
        texto: 'Documento de $1.000.000 emitido el 2026-01-01 a 90 días con 24 % de interés, vendido al banco el 2026-02-01 con descuento del 30 % (base 360). Resultado esperado: valor de la transacción $1.007.883,33.',
        cargar() {
            fijar({ 'desc-valor-inicial': 1000000, 'desc-fecha-inicio': '2026-01-01', 'desc-plazo-dias': 90, 'desc-tasa-interes': 24,
                    'desc-fecha-descuento': '2026-02-01', 'desc-tasa-descuento': 30, 'desc-base-dias': '360' });
            simularDescuento();
        }
    }
};

function cargarEjemplo(modulo) { EJEMPLOS[modulo].cargar(); }

// Borra de una vez todos los datos de una pestaña y deja el formulario como al abrir la página
const RESULTADOS = {
    tasas: 'resultado-tasas', simple: 'resultado-simple', compuesto: 'resultado-compuesto',
    prestamos: 'resultado-prestamos', anualidades: 'resultado-anualidades', descuento: 'resultado-descuento'
};

function borrarDatos(modulo) {
    $('form-' + modulo).reset();              // vuelve cada campo a su valor inicial (vacío o el predeterminado)
    limpiar($(RESULTADOS[modulo]));           // oculta el resultado y el mensaje de error
    if (modulo === 'simple') toggleSimpleFields();
    if (modulo === 'compuesto') toggleCompuestoFields();
    if (modulo === 'anualidades') toggleAnualidadFields();
    if (modulo === 'tasas') vistaPreviaTasas();
    if (modulo === 'prestamos') {
        $('abonos-lista').innerHTML = '';     // quita todas las filas de abonos
        $('pres-resumen').innerHTML = '';
        $('tbody-amortizacion').innerHTML = '';
        $('pres-frecuencia').dataset.prev = $('pres-frecuencia').value;
        $('pres-aviso-frecuencia').textContent = '';
        toggleSeguro();
        toggleGracia();
    }
}

// Resumen en una frase de lo que se va a convertir (se actualiza al llenar el formulario)
function textoTasa(prefijo, conValor) {
    const sel = id => { const s = $(id); return s.options[s.selectedIndex].text.toLowerCase(); };
    const valor = conValor ? ($(prefijo + '-valor').value.trim() || '…') + ' % ' : '';
    return `<b>${valor}${sel(prefijo + '-tipo')} ${sel(prefijo + '-periodo')} ${sel(prefijo + '-modalidad')}</b>`;
}

function vistaPreviaTasas() {
    $('tasas-vista-previa').innerHTML = `Vas a convertir: ${textoTasa('tasas-origen', true)} &nbsp;➜&nbsp; ${textoTasa('tasas-destino', false)}`;
}

window.addEventListener('DOMContentLoaded', () => {
    Object.entries(EJEMPLOS).forEach(([modulo, ej]) => {
        const detalles = $(modulo).querySelector('details.ayuda-modulo');
        const barra = document.createElement('div');
        barra.className = 'barra-ejemplo';
        barra.innerHTML = `<button type="button" class="btn-secundario" onclick="cargarEjemplo('${modulo}')">▶ Cargar un ejemplo</button>
                           <button type="button" class="btn-secundario btn-borrar" onclick="borrarDatos('${modulo}')">🗑 Borrar todos los datos</button>
                           <span class="ayuda">${ej.texto}</span>`;
        detalles.after(barra);
    });
    // Para la pestaña de tasas, además se va actualizando el resumen al escribir
    const tasasForm = $('form-tasas');
    tasasForm.addEventListener('input', vistaPreviaTasas);
    tasasForm.addEventListener('change', vistaPreviaTasas);
    vistaPreviaTasas();
});
