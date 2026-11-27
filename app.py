# app.py
import math
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from backend.herramientas import conversion_tasas
from backend.interes import interes_simple, interes_compuesto
from backend.prestamos import calcular_tabla_amortizacion, MAX_CUOTAS
from backend.descuento import calcular_descuento_bancario
from backend.anualidades import anualidad, MAX_PAGOS

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# Cuántas unidades de cada tipo caben en un año
UNIDADES = {'1': 1, '2': 2, '3': 3, '4': 4, '12': 12, '360': 360, '365': 365}
PERIODOS_TASA = (1, 2, 3, 4, 12)
FRECUENCIAS_PAGO = (1, 2, 3, 4, 6, 12)

MAX_MONTO = 1e13        # 10 billones
MAX_TASA = 1000         # %
MAX_ANIOS = 1000


def numero(datos, clave, nombre, maximo=None, entero=False, permitir_cero=False):
    """Lee un número positivo (o >= 0) con mensajes claros en español."""
    if clave not in datos or str(datos[clave]).strip() == '':
        raise ValueError(f'Completa el campo "{nombre}".')
    try:
        v = float(datos[clave])
    except (TypeError, ValueError):
        raise ValueError(f'"{nombre}" debe ser un número.')
    if not math.isfinite(v):
        raise ValueError(f'"{nombre}" debe ser un número válido.')
    if permitir_cero:
        if v < 0:
            raise ValueError(f'"{nombre}" no puede ser negativo.')
    elif v <= 0:
        raise ValueError(f'"{nombre}" debe ser mayor que 0.')
    if entero and v != int(v):
        raise ValueError(f'"{nombre}" debe ser un número entero (sin decimales).')
    if maximo is not None and v > maximo:
        raise ValueError(f'"{nombre}" no puede ser mayor que {maximo:,.0f}.'.replace(',', '.'))
    return int(v) if entero else v


def anios(datos, clave_tiempo='tiempo', clave_unidad='tiempo_unidad'):
    unidad = str(datos.get(clave_unidad, '1'))
    if unidad not in UNIDADES:
        raise ValueError('La unidad de tiempo no es válida.')
    t = numero(datos, clave_tiempo, 'Tiempo') / UNIDADES[unidad]
    if t > MAX_ANIOS:
        raise ValueError(f'El tiempo no puede superar {MAX_ANIOS} años.')
    return t


def periodo_valido(datos, clave, nombre, permitidos):
    v = numero(datos, clave, nombre, entero=True)
    if v not in permitidos:
        raise ValueError(f'"{nombre}" no es válido.')
    return v


def error_json(e):
    """Convierte excepciones técnicas en mensajes entendibles."""
    if isinstance(e, ZeroDivisionError):
        msg = 'Hay una división por cero. Revisa que los valores no sean 0 y que una tasa anticipada sea menor al 100%.'
    elif isinstance(e, KeyError):
        msg = f'Falta el dato: {e}'
    elif isinstance(e, ValueError):
        texto = str(e)
        if 'could not convert' in texto or 'invalid literal' in texto:
            msg = 'Hay un valor numérico inválido.'
        elif 'time data' in texto or 'does not match format' in texto:
            msg = 'Una de las fechas no es válida.'
        elif 'math domain error' in texto:
            msg = 'Los valores no producen un resultado válido (revisa que VP y VF sean positivos).'
        else:
            msg = texto
    elif isinstance(e, OverflowError):
        msg = 'El resultado es demasiado grande para calcularse. Reduce el tiempo o la tasa.'
    else:
        msg = 'Ocurrió un error inesperado al calcular.'
    return jsonify({'exito': False, 'error': msg}), 400


def tasa_efectiva_periodo(datos, prefijo, frecuencia):
    """Convierte la tasa recibida a efectiva vencida por periodo de pago."""
    valor = numero(datos, prefijo, 'Tasa de interés', maximo=MAX_TASA)
    per = periodo_valido(datos, prefijo + '_periodo', 'Periodo de la tasa', PERIODOS_TASA)
    tasa, ea = conversion_tasas(valor / 100, datos[prefijo + '_tipo'], per,
                                datos[prefijo + '_modalidad'], 'efectiva', frecuencia, 'vencida')
    return tasa, ea


@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')


# --- INTERÉS SIMPLE ---
@app.route('/api/simple', methods=['POST'])
def api_interes_simple():
    datos = request.get_json(silent=True) or {}
    try:
        calcular = datos['calcular']
        tiempo_anios = anios(datos) if 'tiempo' in datos else None

        tasa_unidad = UNIDADES.get(str(datos.get('tasa_unidad', 1)))
        if tasa_unidad is None:
            raise ValueError('El periodo de la tasa no es válido.')
        tasa_periodo = numero(datos, 'tasa', 'Tasa de interés', maximo=MAX_TASA) / 100 if 'tasa' in datos else None
        tiempo_periodos = tiempo_anios * tasa_unidad if tiempo_anios is not None else None

        if calcular in ('interes', 'vf'):
            vp = numero(datos, 'vp', 'Capital inicial', maximo=MAX_MONTO)
            res = interes_simple(calcular, vp=vp, tasa_periodo=tasa_periodo, tiempo_periodos=tiempo_periodos)
            return jsonify({'exito': True, 'resultado': round(res, 2), 'tipo_calc': calcular})
        elif calcular == 'vp':
            vf = numero(datos, 'vf', 'Monto final', maximo=MAX_MONTO)
            res = interes_simple('vp', vf=vf, tasa_periodo=tasa_periodo, tiempo_periodos=tiempo_periodos)
            return jsonify({'exito': True, 'resultado': round(res, 2), 'tipo_calc': 'vp'})
        elif calcular == 'tasa':
            vp = numero(datos, 'vp', 'Capital inicial', maximo=MAX_MONTO)
            vf = numero(datos, 'vf', 'Monto final', maximo=MAX_MONTO)
            res = interes_simple('tasa', vp=vp, vf=vf, tiempo_periodos=tiempo_anios)
            return jsonify({'exito': True, 'resultado': round(res * 100, 4), 'tipo_calc': 'tasa'})
        elif calcular == 'tiempo':
            vp = numero(datos, 'vp', 'Capital inicial', maximo=MAX_MONTO)
            vf = numero(datos, 'vf', 'Monto final', maximo=MAX_MONTO)
            periodos = interes_simple('tiempo', vp=vp, vf=vf, tasa_periodo=tasa_periodo)
            return jsonify({'exito': True, 'resultado': round(periodos / tasa_unidad, 4), 'tipo_calc': 'tiempo'})
        return jsonify({'exito': False, 'error': 'Operación no válida'}), 400
    except Exception as e:
        return error_json(e)


# --- DESCUENTO BANCARIO ---
@app.route('/api/descuento', methods=['POST'])
def api_descuento():
    datos = request.get_json(silent=True) or {}
    try:
        res = calcular_descuento_bancario(
            valor_inicial=numero(datos, 'valor_inicial', 'Valor inicial', maximo=MAX_MONTO),
            fecha_inicio_str=datos['fecha_inicio'],
            plazo_dias=numero(datos, 'plazo_dias', 'Plazo (días)', maximo=36500, entero=True),
            tasa_interes=numero(datos, 'tasa_interes', 'Tasa de interés', maximo=MAX_TASA) / 100,
            fecha_descuento_str=datos['fecha_descuento'],
            tasa_descuento=numero(datos, 'tasa_descuento', 'Tasa de descuento', maximo=MAX_TASA) / 100,
            base_dias=int(datos['base_dias'])
        )
        return jsonify({'exito': True, **res})
    except Exception as e:
        return error_json(e)


# --- CONVERSIÓN DE TASAS ---
@app.route('/api/tasas', methods=['POST'])
def api_tasas():
    datos = request.get_json(silent=True) or {}
    try:
        valor = numero(datos, 'origen_valor', 'Valor de la tasa', maximo=MAX_TASA)
        tasa_destino, tasa_ea = conversion_tasas(
            valor / 100, datos['origen_tipo'],
            periodo_valido(datos, 'origen_periodo', 'Periodo de origen', PERIODOS_TASA), datos['origen_modalidad'],
            datos['destino_tipo'],
            periodo_valido(datos, 'destino_periodo', 'Periodo de destino', PERIODOS_TASA), datos['destino_modalidad']
        )
        return jsonify({'exito': True, 'tasa_destino': round(tasa_destino * 100, 6), 'tasa_ea': round(tasa_ea, 6)})
    except Exception as e:
        return error_json(e)


# --- INTERÉS COMPUESTO ---
@app.route('/api/compuesto', methods=['POST'])
def api_interes_compuesto():
    datos = request.get_json(silent=True) or {}
    try:
        calcular = datos['calcular']

        def tasa_ea_de_datos():
            valor = numero(datos, 'tasa', 'Tasa de interés', maximo=MAX_TASA)
            _, ea = conversion_tasas(valor / 100, datos['tasa_tipo'],
                                     periodo_valido(datos, 'tasa_periodo', 'Periodo de la tasa', PERIODOS_TASA),
                                     datos['tasa_modalidad'], 'efectiva', 1, 'vencida')
            return ea

        if calcular == 'tasa':
            vp = numero(datos, 'vp', 'Capital inicial', maximo=MAX_MONTO)
            vf = numero(datos, 'vf', 'Monto final', maximo=MAX_MONTO)
            t = anios(datos)
            tasa = interes_compuesto('tasa', vp=vp, vf=vf, tiempo_anios=t, res_tipo=datos['res_tipo'],
                                     res_periodo=periodo_valido(datos, 'res_periodo', 'Periodo del resultado', PERIODOS_TASA))
            return jsonify({'exito': True, 'resultado': round(tasa * 100, 6), 'tipo_calc': 'tasa'})

        elif calcular == 'tiempo':
            vp = numero(datos, 'vp', 'Capital inicial', maximo=MAX_MONTO)
            vf = numero(datos, 'vf', 'Monto final', maximo=MAX_MONTO)
            t = interes_compuesto('tiempo', vp=vp, vf=vf, tasa_ea=tasa_ea_de_datos())
            return jsonify({'exito': True, 'resultado': round(t, 4), 'tipo_calc': 'tiempo'})

        elif calcular in ('vf', 'vp'):
            monto = numero(datos, 'monto', 'Monto', maximo=MAX_MONTO)
            t = anios(datos)
            ea = tasa_ea_de_datos()
            if calcular == 'vf':
                resultado = interes_compuesto('vf', vp=monto, tasa_ea=ea, tiempo_anios=t)
            else:
                resultado = interes_compuesto('vp', vf=monto, tasa_ea=ea, tiempo_anios=t)
            return jsonify({'exito': True, 'resultado': round(resultado, 2), 'tipo_calc': calcular,
                            'tasa_ea': round(ea * 100, 6)})

        return jsonify({'exito': False, 'error': 'Operación no válida'}), 400
    except Exception as e:
        return error_json(e)


# --- PRÉSTAMOS ---
@app.route('/api/prestamos', methods=['POST'])
def api_prestamos():
    datos = request.get_json(silent=True) or {}
    try:
        monto = numero(datos, 'monto', 'Monto del préstamo', maximo=MAX_MONTO)
        frecuencia = periodo_valido(datos, 'frecuencia_pago', 'Frecuencia de pago', FRECUENCIAS_PAGO)
        plazo = numero(datos, 'plazo', 'Número de cuotas', maximo=MAX_CUOTAS, entero=True)
        gracia = numero(datos, 'gracia', 'Periodos de gracia', maximo=MAX_CUOTAS, entero=True,
                        permitir_cero=True) if datos.get('gracia') not in (None, '') else 0
        tasa_periodica, _ = tasa_efectiva_periodo(datos, 'tasa', frecuencia)

        abonos = {}
        for a in (datos.get('abonos') or []):
            c = numero(a, 'cuota', 'Cuota del abono', entero=True, permitir_cero=True)
            v = numero(a, 'valor', 'Valor del abono', maximo=MAX_MONTO)
            if c in abonos:
                raise ValueError(f'Hay dos abonos en la misma cuota ({c}). Súmalos en uno solo.')
            abonos[c] = v

        res = calcular_tabla_amortizacion(
            monto, tasa_periodica, plazo,
            anticipado=(datos.get('tipo_pago') == 'anticipado'),
            gracia=gracia, tipo_gracia=datos.get('tipo_gracia', 'parcial'),
            abonos=abonos, modo_abono=datos.get('modo_abono', 'plazo'))
        res['tasa_periodica_aplicada'] = round(tasa_periodica * 100, 4)
        return jsonify({'exito': True, **res})
    except Exception as e:
        return error_json(e)


# --- ANUALIDADES ---
@app.route('/api/anualidades', methods=['POST'])
def api_anualidades():
    datos = request.get_json(silent=True) or {}
    try:
        calcular = datos['calcular']
        n = numero(datos, 'n', 'Número de pagos', maximo=MAX_PAGOS, entero=True)
        frecuencia = periodo_valido(datos, 'frecuencia_pago', 'Frecuencia de pagos', FRECUENCIAS_PAGO)
        i, ea = tasa_efectiva_periodo(datos, 'tasa', frecuencia)
        dif = numero(datos, 'diferimiento', 'Periodos de diferimiento', maximo=MAX_PAGOS, entero=True,
                     permitir_cero=True) if datos.get('diferimiento') not in (None, '') else 0

        pago = valor = None
        if calcular in ('vp', 'vf'):
            pago = numero(datos, 'pago', 'Pago periódico', maximo=MAX_MONTO)
        else:
            valor = numero(datos, 'valor', 'Valor presente o futuro', maximo=MAX_MONTO)

        resultado, formula = anualidad(calcular, i, n, pago=pago, valor=valor,
                                       anticipada=(datos.get('tipo_pago') == 'anticipada'), diferimiento=dif)
        return jsonify({'exito': True, 'resultado': resultado, 'tipo_calc': calcular, 'formula': formula,
                        'i_periodica': round(i * 100, 6), 'tasa_ea': round(ea * 100, 6)})
    except Exception as e:
        return error_json(e)


if __name__ == '__main__':
    # En Render se usa gunicorn (gunicorn app:app); esto es solo para correr local.
    app.run(debug=os.environ.get('FLASK_DEBUG') == '1', port=int(os.environ.get('PORT', 5000)))