# app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from backend.herramientas import conversion_tasas
from backend.interes import interes_simple, interes_compuesto
from backend.prestamos import calcular_tabla_amortizacion
from backend.descuento import calcular_descuento_bancario

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

# --- INTERÉS SIMPLE ---
@app.route('/api/simple', methods=['POST'])
def api_interes_simple():
    datos = request.get_json()
    try:
        calcular = datos['calcular']
        
        tiempo_periodos = 0
        tasa_periodo = 0
        
        if 'tiempo' in datos and 'tiempo_unidad' in datos:
            tiempo = float(datos['tiempo'])
            unidad = datos['tiempo_unidad']
            
            if unidad == '1': tiempo_anios = tiempo
            elif unidad == '2': tiempo_anios = tiempo / 2
            elif unidad == '3': tiempo_anios = tiempo / 3
            elif unidad == '4': tiempo_anios = tiempo / 4
            elif unidad == '12': tiempo_anios = tiempo / 12
            elif unidad == '360': tiempo_anios = tiempo / 360
            elif unidad == '365': tiempo_anios = tiempo / 365
            
            tasa_unidad = int(datos.get('tasa_unidad', 1))
            tasa_periodo = float(datos['tasa']) / 100 / tasa_unidad
            tiempo_periodos = tiempo_anios * tasa_unidad

        if calcular == 'interes':
            res = interes_simple('interes', vp=float(datos['vp']), tasa_periodo=tasa_periodo, tiempo_periodos=tiempo_periodos)
            return jsonify({'exito': True, 'resultado': round(res, 2), 'tipo_calc': 'interes'})
        elif calcular == 'vf':
            res = interes_simple('vf', vp=float(datos['vp']), tasa_periodo=tasa_periodo, tiempo_periodos=tiempo_periodos)
            return jsonify({'exito': True, 'resultado': round(res, 2), 'tipo_calc': 'vf'})
        elif calcular == 'vp':
            res = interes_simple('vp', vf=float(datos['vf']), tasa_periodo=tasa_periodo, tiempo_periodos=tiempo_periodos)
            return jsonify({'exito': True, 'resultado': round(res, 2), 'tipo_calc': 'vp'})
        elif calcular == 'tasa':
            res = interes_simple('tasa', vp=float(datos['vp']), vf=float(datos['vf']), tiempo_periodos=tiempo_periodos)
            return jsonify({'exito': True, 'resultado': round(res * 100, 4), 'tipo_calc': 'tasa'})
        elif calcular == 'tiempo':
            res = interes_simple('tiempo', vp=float(datos['vp']), vf=float(datos['vf']), tasa_periodo=tasa_periodo)
            return jsonify({'exito': True, 'resultado': round(res, 4), 'tipo_calc': 'tiempo'})

    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

# --- DESCUENTO BANCARIO ---
@app.route('/api/descuento', methods=['POST'])
def api_descuento():
    datos = request.get_json()
    try:
        res = calcular_descuento_bancario(
            valor_inicial=float(datos['valor_inicial']),
            fecha_inicio_str=datos['fecha_inicio'],
            plazo_dias=int(datos['plazo_dias']),
            tasa_interes=float(datos['tasa_interes']) / 100,
            fecha_descuento_str=datos['fecha_descuento'],
            tasa_descuento=float(datos['tasa_descuento']) / 100,
            base_dias=int(datos['base_dias'])
        )
        return jsonify({'exito': True, **res})
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

# --- CONVERSIÓN DE TASAS ---
@app.route('/api/tasas', methods=['POST'])
def api_tasas():
    datos = request.get_json()
    try:
        tasa_destino, tasa_ea = conversion_tasas(
            float(datos['origen_valor']) / 100, datos['origen_tipo'], int(datos['origen_periodo']), datos['origen_modalidad'],
            datos['destino_tipo'], int(datos['destino_periodo']), datos['destino_modalidad']
        )
        return jsonify({'exito': True, 'tasa_destino': round(tasa_destino * 100, 6), 'tasa_ea': round(tasa_ea, 6)})
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

# --- INTERÉS COMPUESTO ---
@app.route('/api/compuesto', methods=['POST'])
def api_interes_compuesto():
    datos = request.get_json()
    try:
        calcular = datos['calcular']
        if calcular == 'tasa':
            vp = float(datos['vp'])
            vf = float(datos['vf'])
            tiempo = float(datos['tiempo'])
            tiempo_unidad = float(datos['tiempo_unidad'])
            tiempo_anios = tiempo / tiempo_unidad
            tasa = interes_compuesto(calcular, vp=vp, vf=vf, tiempo_anios=tiempo_anios, res_tipo=datos['res_tipo'], res_periodo=int(datos['res_periodo']))
            return jsonify({'exito': True, 'resultado': round(tasa * 100, 6), 'tipo_calc': 'tasa'})
        elif calcular == 'tiempo':
            vp = float(datos['vp'])
            vf = float(datos['vf'])
            _, tasa_ea = conversion_tasas(float(datos['tasa']) / 100, datos['tasa_tipo'], int(datos['tasa_periodo']), datos['tasa_modalidad'], 'efectiva', 1, 'vencida')
            tiempo_anios = interes_compuesto(calcular, vp=vp, vf=vf, tasa_ea=tasa_ea)
            return jsonify({'exito': True, 'resultado': round(tiempo_anios, 4), 'tipo_calc': 'tiempo'})
        else:
            monto = float(datos['monto'])
            tiempo = float(datos['tiempo'])
            tiempo_unidad = float(datos['tiempo_unidad'])
            tiempo_anios = tiempo / tiempo_unidad
            _, tasa_ea = conversion_tasas(float(datos['tasa']) / 100, datos['tasa_tipo'], int(datos['tasa_periodo']), datos['tasa_modalidad'], 'efectiva', 1, 'vencida')
            if calcular == 'vf':
                resultado = interes_compuesto(calcular, vp=monto, tasa_ea=tasa_ea, tiempo_anios=tiempo_anios)
            else:
                resultado = interes_compuesto(calcular, vf=monto, tasa_ea=tasa_ea, tiempo_anios=tiempo_anios)
            return jsonify({'exito': True, 'resultado': round(resultado, 2), 'tipo_calc': calcular, 'tasa_ea': round(tasa_ea * 100, 6)})
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

# --- PRÉSTAMOS ---
@app.route('/api/prestamos', methods=['POST'])
def api_prestamos():
    datos = request.get_json()
    try:
        monto = float(datos['monto'])
        frecuencia_pago = int(datos['frecuencia_pago'])
        plazo = int(datos['plazo'])
        tasa_periodica, _ = conversion_tasas(float(datos['tasa']) / 100, datos['tasa_tipo'], int(datos['tasa_periodo']), datos['tasa_modalidad'], 'efectiva', frecuencia_pago, 'vencida')
        cuota_fija, tabla = calcular_tabla_amortizacion(monto, tasa_periodica, plazo)
        return jsonify({'exito': True, 'cuota_fija': cuota_fija, 'tabla': tabla, 'tasa_periodica_aplicada': round(tasa_periodica * 100, 4)})
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)