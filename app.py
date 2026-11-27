# app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Importamos nuestras funciones
from backend.herramientas import conversion_tasas
from backend.interes import interes_simple, interes_compuesto
from backend.prestamos import calcular_tabla_amortizacion

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# --- RUTA PRINCIPAL ---
@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

# --- RUTA INTERÉS SIMPLE ---
@app.route('/api/simple', methods=['POST'])
def api_interes_simple():
    datos = request.get_json()
    try:
        capital = float(datos['capital'])
        tasa = float(datos['tasa']) / 100
        tiempo = float(datos['tiempo'])
        interes, valor_futuro = interes_simple(capital, tasa, tiempo)
        return jsonify({'exito': True, 'interes': round(interes, 2), 'valor_futuro': round(valor_futuro, 2)})
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

# --- RUTA CONVERSIÓN DE TASAS ---
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

# --- RUTA INTERÉS COMPUESTO (AUTOMÁTICO) ---
@app.route('/api/compuesto', methods=['POST'])
def api_interes_compuesto():
    datos = request.get_json()
    try:
        calcular = datos['calcular']
        monto = float(datos['monto'])
        tiempo = float(datos['tiempo'])
        
        # Convertimos la tasa ingresada a una Tasa Efectiva Anual (EA)
        _, tasa_ea = conversion_tasas(
            float(datos['tasa']) / 100, datos['tasa_tipo'], int(datos['tasa_periodo']), datos['tasa_modalidad'],
            'efectiva', 1, 'vencida'
        )
        
        resultado = interes_compuesto(calcular, monto, tasa_ea, tiempo)
        
        return jsonify({
            'exito': True,
            'resultado': round(resultado, 2),
            'tasa_ea': round(tasa_ea * 100, 6)
        })
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

# --- RUTA SIMULADOR DE PRÉSTAMOS (AUTOMÁTICO) ---
@app.route('/api/prestamos', methods=['POST'])
def api_prestamos():
    datos = request.get_json()
    try:
        monto = float(datos['monto'])
        frecuencia_pago = int(datos['frecuencia_pago'])
        plazo = int(datos['plazo'])
        
        # Convertimos la tasa a la tasa periódica exacta para la frecuencia de pago
        tasa_periodica, _ = conversion_tasas(
            float(datos['tasa']) / 100, datos['tasa_tipo'], int(datos['tasa_periodo']), datos['tasa_modalidad'],
            'efectiva', frecuencia_pago, 'vencida'
        )
        
        cuota_fija, tabla = calcular_tabla_amortizacion(monto, tasa_periodica, plazo)
        
        return jsonify({
            'exito': True,
            'cuota_fija': cuota_fija,
            'tabla': tabla,
            'tasa_periodica_aplicada': round(tasa_periodica * 100, 4)
        })
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

# --- INICIAR EL SERVIDOR ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)