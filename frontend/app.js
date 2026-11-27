// --- LÓGICA DE PESTAÑAS ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    });
});

// --- TOGGLES DE FORMULARIOS ---
function toggleSimpleFields() {
    const calcular = document.getElementById('simple-calcular').value;
    document.getElementById('group-simple-vp').style.display = 'none';
    document.getElementById('group-simple-vf').style.display = 'none';
    document.getElementById('group-simple-tasa').style.display = 'none';
    document.getElementById('group-simple-tiempo').style.display = 'none';

    if (calcular === 'interes' || calcular === 'vf') {
        document.getElementById('group-simple-vp').style.display = 'block';
        document.getElementById('group-simple-tasa').style.display = 'flex';
        document.getElementById('group-simple-tiempo').style.display = 'flex';
    } else if (calcular === 'vp') {
        document.getElementById('group-simple-vf').style.display = 'block';
        document.getElementById('group-simple-tasa').style.display = 'flex';
        document.getElementById('group-simple-tiempo').style.display = 'flex';
    } else if (calcular === 'tasa') {
        document.getElementById('group-simple-vp').style.display = 'block';
        document.getElementById('group-simple-vf').style.display = 'block';
        document.getElementById('group-simple-tiempo').style.display = 'flex';
    } else if (calcular === 'tiempo') {
        document.getElementById('group-simple-vp').style.display = 'block';
        document.getElementById('group-simple-vf').style.display = 'block';
        document.getElementById('group-simple-tasa').style.display = 'flex';
    }
}

function toggleCompuestoFields() {
    const calcular = document.getElementById('comp-calcular').value;
    document.getElementById('group-comp-monto').style.display = 'none';
    document.getElementById('group-comp-vp').style.display = 'none';
    document.getElementById('group-comp-vf').style.display = 'none';
    document.getElementById('group-comp-tasa').style.display = 'none';
    document.getElementById('group-comp-tiempo').style.display = 'none';
    document.getElementById('group-comp-res-tasa').style.display = 'none';

    if (calcular === 'vf') {
        document.getElementById('group-comp-monto').style.display = 'block';
        document.getElementById('lbl-comp-monto').innerText = 'Capital Inicial / Valor Presente ($):';
        document.getElementById('group-comp-tasa').style.display = 'flex';
        document.getElementById('group-comp-tiempo').style.display = 'flex';
    } else if (calcular === 'vp') {
        document.getElementById('group-comp-monto').style.display = 'block';
        document.getElementById('lbl-comp-monto').innerText = 'Monto Final / Valor Futuro ($):';
        document.getElementById('group-comp-tasa').style.display = 'flex';
        document.getElementById('group-comp-tiempo').style.display = 'flex';
    } else if (calcular === 'tasa') {
        document.getElementById('group-comp-vp').style.display = 'block';
        document.getElementById('group-comp-vf').style.display = 'block';
        document.getElementById('group-comp-tiempo').style.display = 'flex';
        document.getElementById('group-comp-res-tasa').style.display = 'flex';
    } else if (calcular === 'tiempo') {
        document.getElementById('group-comp-vp').style.display = 'block';
        document.getElementById('group-comp-vf').style.display = 'block';
        document.getElementById('group-comp-tasa').style.display = 'flex';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    toggleSimpleFields();
    toggleCompuestoFields();
});

// --- CONVERSIÓN DE TASAS ---
async function simularTasa() {
    const origenValor = document.getElementById('tasas-origen-valor').value;
    const origenTipo = document.getElementById('tasas-origen-tipo').value;
    const origenPeriodo = document.getElementById('tasas-origen-periodo').value;
    const origenModalidad = document.getElementById('tasas-origen-modalidad').value;
    const destinoTipo = document.getElementById('tasas-destino-tipo').value;
    const destinoPeriodo = document.getElementById('tasas-destino-periodo').value;
    const destinoModalidad = document.getElementById('tasas-destino-modalidad').value;
    const resultadoBox = document.getElementById('resultado-tasas');
    if(!origenValor) return alert("Ingresa la tasa");

    try {
        const response = await fetch('/api/tasas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                origen_valor: origenValor, origen_tipo: origenTipo, origen_periodo: origenPeriodo, origen_modalidad: origenModalidad,
                destino_tipo: destinoTipo, destino_periodo: destinoPeriodo, destino_modalidad: destinoModalidad
            })
        });
        const data = await response.json();
        if(data.exito) {
            let letraTipo = destinoTipo === 'efectiva' ? 'E' : 'N';
            let letraPeriodo = { '1': 'A', '2': 'S', '3': 'C', '4': 'T', '12': 'M' }[destinoPeriodo];
            let letraModalidad = destinoModalidad === 'vencida' ? 'V' : 'A';
            resultadoBox.innerHTML = `
                <strong>Resultado:</strong> <br> 
                Tasa Destino: <b>${data.tasa_destino.toFixed(4)}% ${letraTipo}${letraPeriodo}${letraModalidad}</b> <br>
                <small>Equivalente a una tasa Efectiva Anual Vencida (EA) del ${(data.tasa_ea * 100).toFixed(4)}%</small>
            `;
            resultadoBox.classList.remove('hidden');
        } else { alert("Error: " + data.error); }
    } catch (error) { alert("Error de conexión"); }
}

// --- INTERÉS SIMPLE ---
async function simularSimple() {
    const calcular = document.getElementById('simple-calcular').value;
    const resultadoBox = document.getElementById('resultado-simple');
    try {
        let bodyData = { calcular: calcular };
        if (calcular === 'interes' || calcular === 'vf') {
            const vp = document.getElementById('simple-vp').value;
            const tasa = document.getElementById('simple-tasa').value;
            const tiempo = document.getElementById('simple-tiempo').value;
            if(!vp || !tasa || !tiempo) return alert("Completa todos los campos");
            bodyData = { ...bodyData, vp, tasa, tiempo, tiempo_unidad: document.getElementById('simple-tiempo-unidad').value, tasa_unidad: document.getElementById('simple-tasa-unidad').value };
        } else if (calcular === 'vp') {
            const vf = document.getElementById('simple-vf').value;
            const tasa = document.getElementById('simple-tasa').value;
            const tiempo = document.getElementById('simple-tiempo').value;
            if(!vf || !tasa || !tiempo) return alert("Completa todos los campos");
            bodyData = { ...bodyData, vf, tasa, tiempo, tiempo_unidad: document.getElementById('simple-tiempo-unidad').value, tasa_unidad: document.getElementById('simple-tasa-unidad').value };
        } else if (calcular === 'tasa') {
            const vp = document.getElementById('simple-vp').value;
            const vf = document.getElementById('simple-vf').value;
            const tiempo = document.getElementById('simple-tiempo').value;
            if(!vp || !vf || !tiempo) return alert("Completa todos los campos");
            bodyData = { ...bodyData, vp, vf, tiempo, tiempo_unidad: document.getElementById('simple-tiempo-unidad').value };
        } else if (calcular === 'tiempo') {
            const vp = document.getElementById('simple-vp').value;
            const vf = document.getElementById('simple-vf').value;
            const tasa = document.getElementById('simple-tasa').value;
            if(!vp || !vf || !tasa) return alert("Completa todos los campos");
            bodyData = { ...bodyData, vp, vf, tasa, tasa_unidad: document.getElementById('simple-tasa-unidad').value };
        }

        const response = await fetch('/api/simple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        if(data.exito) {
            if (data.tipo_calc === 'tasa') {
                resultadoBox.innerHTML = `<strong>Tasa Calculada:</strong> <br> <b>${data.resultado}%</b>`;
            } else if (data.tipo_calc === 'tiempo') {
                resultadoBox.innerHTML = `<strong>Tiempo Calculado:</strong> <br> <b>${data.resultado} Años</b>`;
            } else if (data.tipo_calc === 'interes') {
                resultadoBox.innerHTML = `<strong>Interés Generado:</strong> <br> <b>$${data.resultado.toLocaleString('es-CO')}</b>`;
            } else {
                let texto = calcular === 'vf' ? 'Valor Futuro' : 'Valor Presente';
                resultadoBox.innerHTML = `<strong>${texto}:</strong> <br> <b>$${data.resultado.toLocaleString('es-CO')}</b>`;
            }
            resultadoBox.classList.remove('hidden');
        } else { alert("Error: " + data.error); }
    } catch (error) { alert("Error de conexión"); }
}

// --- INTERÉS COMPUESTO ---
async function simularCompuesto() {
    const calcular = document.getElementById('comp-calcular').value;
    const resultadoBox = document.getElementById('resultado-compuesto');
    try {
        let bodyData = { calcular: calcular };
        if (calcular === 'vf' || calcular === 'vp') {
            const monto = document.getElementById('comp-monto').value;
            const tasa = document.getElementById('comp-tasa').value;
            const tiempo = document.getElementById('comp-tiempo').value;
            if(!monto || !tasa || !tiempo) return alert("Completa todos los campos");
            bodyData = { ...bodyData, monto, tasa, tasa_tipo: document.getElementById('comp-tipo').value, tasa_periodo: document.getElementById('comp-periodo').value, tasa_modalidad: document.getElementById('comp-modalidad').value, tiempo, tiempo_unidad: document.getElementById('comp-tiempo-unidad').value };
        } else if (calcular === 'tasa') {
            const vp = document.getElementById('comp-vp').value;
            const vf = document.getElementById('comp-vf').value;
            const tiempo = document.getElementById('comp-tiempo').value;
            if(!vp || !vf || !tiempo) return alert("Completa todos los campos");
            bodyData = { ...bodyData, vp, vf, tiempo, tiempo_unidad: document.getElementById('comp-tiempo-unidad').value, res_tipo: document.getElementById('comp-res-tipo').value, res_periodo: document.getElementById('comp-res-periodo').value };
        } else if (calcular === 'tiempo') {
            const vp = document.getElementById('comp-vp').value;
            const vf = document.getElementById('comp-vf').value;
            const tasa = document.getElementById('comp-tasa').value;
            if(!vp || !vf || !tasa) return alert("Completa todos los campos");
            bodyData = { ...bodyData, vp, vf, tasa, tasa_tipo: document.getElementById('comp-tipo').value, tasa_periodo: document.getElementById('comp-periodo').value, tasa_modalidad: document.getElementById('comp-modalidad').value };
        }

        const response = await fetch('/api/compuesto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        if(data.exito) {
            if (data.tipo_calc === 'tasa') {
                resultadoBox.innerHTML = `<strong>Tasa Calculada:</strong> <br> <b>${data.resultado}%</b>`;
            } else if (data.tipo_calc === 'tiempo') {
                resultadoBox.innerHTML = `<strong>Tiempo Calculado:</strong> <br> <b>${data.resultado} Años</b>`;
            } else {
                let texto = calcular === 'vf' ? 'Valor Futuro' : 'Valor Presente';
                resultadoBox.innerHTML = `<strong>${texto}:</strong> <br> <b>$${data.resultado.toLocaleString('es-CO')}</b><br><small>EA usada: ${data.tasa_ea}%</small>`;
            }
            resultadoBox.classList.remove('hidden');
        } else { alert("Error: " + data.error); }
    } catch (error) { alert("Error de conexión"); }
}

// --- SIMULADOR DE PRÉSTAMOS ---
async function simularPrestamo() {
    const monto = document.getElementById('pres-monto').value;
    const tasa = document.getElementById('pres-tasa').value;
    const tipo = document.getElementById('pres-tipo').value;
    const periodo = document.getElementById('pres-periodo').value;
    const modalidad = document.getElementById('pres-modalidad').value;
    const frecuencia = document.getElementById('pres-frecuencia').value; 
    const plazo = document.getElementById('pres-plazo').value;
    const resultadoBox = document.getElementById('resultado-prestamos');
    const tbody = document.getElementById('tbody-amortizacion');
    if(!monto || !tasa || !plazo) return alert("Completa todos los campos");

    try {
        const response = await fetch('/api/prestamos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monto, tasa, tasa_tipo: tipo, tasa_periodo: periodo, tasa_modalidad: modalidad, frecuencia_pago: frecuencia, plazo })
        });
        const data = await response.json();
        if(data.exito) {
            document.getElementById('pres-resumen').innerHTML = `
                Cuota Fija: <span style="color: #2e7d32; font-size: 1.2rem;">$${data.cuota_fija.toLocaleString('es-CO')}</span><br>
                <small>Tasa periódica aplicada: ${data.tasa_periodica_aplicada}%</small>
            `;
            tbody.innerHTML = '';
            data.tabla.forEach(fila => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';
                tr.innerHTML = `
                    <td style="padding: 8px; text-align: center;">${fila.mes}</td>
                    <td style="padding: 8px;">$${fila.cuota.toLocaleString('es-CO')}</td>
                    <td style="padding: 8px; color: #d32f2f;">$${fila.interes.toLocaleString('es-CO')}</td>
                    <td style="padding: 8px; color: #1976d2;">$${fila.abono_capital.toLocaleString('es-CO')}</td>
                    <td style="padding: 8px; font-weight: 600;">$${fila.saldo.toLocaleString('es-CO')}</td>
                `;
                tbody.appendChild(tr);
            });
            resultadoBox.classList.remove('hidden');
        } else { alert("Error: " + data.error); }
    } catch (error) { alert("Error de conexión"); }
}

// --- DESCUENTO BANCARIO ---
async function simularDescuento() {
    const valor_inicial = document.getElementById('desc-valor-inicial').value;
    const fecha_inicio = document.getElementById('desc-fecha-inicio').value;
    const plazo_dias = document.getElementById('desc-plazo-dias').value;
    const tasa_interes = document.getElementById('desc-tasa-interes').value;
    const fecha_descuento = document.getElementById('desc-fecha-descuento').value;
    const tasa_descuento = document.getElementById('desc-tasa-descuento').value;
    const base_dias = document.getElementById('desc-base-dias').value;
    const resultadoBox = document.getElementById('resultado-descuento');
    
    if(!valor_inicial || !fecha_inicio || !plazo_dias || !tasa_interes || !fecha_descuento || !tasa_descuento) {
        return alert("Completa todos los campos");
    }

    try {
        const response = await fetch('/api/descuento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor_inicial, fecha_inicio, plazo_dias, tasa_interes, fecha_descuento, tasa_descuento, base_dias })
        });
        const data = await response.json();
        if(data.exito) {
            resultadoBox.innerHTML = `
                <strong>Resultados del Descuento:</strong> <br><br>
                <b>a) Fecha de Vencimiento:</b> ${data.fecha_vencimiento} <br>
                <b>b) Valor al Vencimiento:</b> $${data.valor_vencimiento.toLocaleString('es-CO')} <br>
                <b>c) Valor de la Transacción:</b> $${data.valor_transaccion.toLocaleString('es-CO')} <br><br>
                <small>Días exactos descontados: ${data.dias_descuento} días</small>
            `;
            resultadoBox.classList.remove('hidden');
        } else { alert("Error: " + data.error); }
    } catch (error) { alert("Error de conexión"); }
}