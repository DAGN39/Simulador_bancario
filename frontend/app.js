// --- LÓGICA DE PESTAÑAS ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
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
    
    if(!origenValor) return alert("Por favor ingresa el valor de la tasa");

    try {
        const response = await fetch('/api/tasas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                origen_valor: origenValor,
                origen_tipo: origenTipo,
                origen_periodo: origenPeriodo,
                origen_modalidad: origenModalidad,
                destino_tipo: destinoTipo,
                destino_periodo: destinoPeriodo,
                destino_modalidad: destinoModalidad
            })
        });

        const data = await response.json();

        if(data.exito) {
            let letraTipo = destinoTipo === 'efectiva' ? 'E' : 'N';
            let letraPeriodo = { '1': 'A', '2': 'S', '3': 'C', '4': 'T', '12': 'M' }[destinoPeriodo];
            let letraModalidad = destinoModalidad === 'vencida' ? 'V' : 'A';
            
            resultadoBox.innerHTML = `
                <strong>Resultado de la Conversión:</strong> <br> 
                Tasa Destino: <b>${data.tasa_destino.toFixed(4)}% ${letraTipo}${letraPeriodo}${letraModalidad}</b> <br>
                <small>Equivalente a una tasa Efectiva Anual Vencida (EA) del ${(data.tasa_ea * 100).toFixed(4)}%</small>
            `;
            resultadoBox.classList.remove('hidden');
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error(error);
        alert("Error conectando con el backend. Revisa la consola (F12).");
    }
}

// --- INTERÉS SIMPLE ---
async function simularSimple() {
    const capital = document.getElementById('simple-capital').value;
    const tasa = document.getElementById('simple-tasa').value;
    const tiempo = document.getElementById('simple-tiempo').value;
    const resultadoBox = document.getElementById('resultado-simple');
    
    if(!capital || !tasa || !tiempo) return alert("Completa todos los campos");

    try {
        const response = await fetch('/api/simple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ capital, tasa, tiempo })
        });

        const data = await response.json();

        if(data.exito) {
            resultadoBox.innerHTML = `
                <strong>Cálculo Realizado:</strong> <br> 
                Interés Generado: <b>$${data.interes.toLocaleString('es-CO')}</b> <br>
                Valor Futuro: <b>$${data.valor_futuro.toLocaleString('es-CO')}</b>
            `;
            resultadoBox.classList.remove('hidden');
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        alert("Error conectando con el backend.");
    }
}
// ... (código anterior de pestañas, tasas y simple se mantiene igual) ...

// --- INTERÉS COMPUESTO ---
async function simularCompuesto() {
    const calcular = document.getElementById('comp-calcular').value;
    const monto = document.getElementById('comp-monto').value;
    const tasa = document.getElementById('comp-tasa').value;
    const capitalizacion = document.getElementById('comp-capitalizacion').value;
    const tiempo = document.getElementById('comp-tiempo').value;
    const resultadoBox = document.getElementById('resultado-compuesto');
    
    if(!monto || !tasa || !tiempo) {
        return alert("Por favor completa todos los campos");
    }

    try {
        const response = await fetch('/api/compuesto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                calcular: calcular,
                monto: monto,
                tasa: tasa,
                capitalizacion: capitalizacion,
                tiempo: tiempo
            })
        });

        const data = await response.json();

        if(data.exito) {
            let textoResultado = calcular === 'vf' ? 'Valor Futuro (Monto final)' : 'Valor Presente (Capital a colocar)';
            
            resultadoBox.innerHTML = `
                <strong>Resultado del Cálculo:</strong> <br> 
                ${textoResultado}: <b>$${data.resultado.toLocaleString('es-CO')}</b> <br><br>
                <small>Detalles: Tasa periódica = ${(data.tasa_periodica * 100).toFixed(4)}% | Total de periodos = ${data.periodos}</small>
            `;
            resultadoBox.classList.remove('hidden');
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error(error);
        alert("Error conectando con el backend.");
    }
}

// ... (código anterior de simple, tasas y compuesto se mantiene igual) ...

// --- SIMULADOR DE PRÉSTAMOS ---
async function simularPrestamo() {
    const monto = document.getElementById('pres-monto').value;
    const tasa = document.getElementById('pres-tasa').value;
    const plazo = document.getElementById('pres-plazo').value;
    const resultadoBox = document.getElementById('resultado-prestamos');
    const tbody = document.getElementById('tbody-amortizacion');
    
    if(!monto || !tasa || !plazo) return alert("Completa todos los campos");

    try {
        const response = await fetch('/api/prestamos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monto, tasa, plazo })
        });

        const data = await response.json();

        if(data.exito) {
            // 1. Mostrar el resumen
            document.getElementById('pres-resumen').innerHTML = `
                Cuota Mensual Fija: <span style="color: #2e7d32; font-size: 1.2rem;">$${data.cuota_fija.toLocaleString('es-CO')}</span>
            `;

            // 2. Limpiar la tabla anterior
            tbody.innerHTML = '';

            // 3. Llenar la tabla con los datos de Python
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
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error(error);
        alert("Error conectando con el backend.");
    }
}