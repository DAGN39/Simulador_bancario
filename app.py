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
        
        return jsonify({
            'exito': True,
            'interes': round(interes, 2),
            'valor_futuro': round(valor_futuro, 2)
        })
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

# --- RUTA CONVERSIÓN DE TASAS ---
@app.route('/api/tasas', methods=['POST'])
def api_tasas():
    datos = request.get_json()
    try:
        origen_valor = float(datos['origen_valor']) / 100
        origen_tipo = datos['origen_tipo']
        origen_periodo = int(datos['origen_periodo'])
        origen_modalidad = datos['origen_modalidad']
        
        destino_tipo = datos['destino_tipo']
        destino_periodo = int(datos['destino_periodo'])
        destino_modalidad = datos['destino_modalidad']
        
        tasa_destino, tasa_ea = conversion_tasas(
            origen_valor, origen_tipo, origen_periodo, origen_modalidad,
            destino_tipo, destino_periodo, destino_modalidad
        )
        
        return jsonify({
            'exito': True,
            'tasa_destino': round(tasa_destino * 100, 6),
            'tasa_ea': round(tasa_ea, 6)
        })
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

# --- RUTA INTERÉS COMPUESTO ---
@app.route('/api/compuesto', methods=['POST'])
def api_interes_compuesto():
    datos = request.get_json()
    try:
        calcular = datos['calcular'] 
        monto = float(datos['monto'])
        tasa = float(datos['tasa']) / 100
        capitalizacion = int(datos['capitalizacion'])
        tiempo = float(datos['tiempo'])
        
        # --- ESTOS PRINTS NOS DIRÁN LA VERDAD ---
        print("\n--- DATOS RECIBIDOS EN PYTHON ---")
        print(f"Monto: {monto} | Tasa (%): {tasa*100} | Capitalización: {capitalizacion} | Tiempo: {tiempo}")
        
        resultado, tasa_periodica, periodos = interes_compuesto(
            calcular, monto, tasa, capitalizacion, tiempo
        )
        
        print(f"Fórmula aplicada: {monto} / (1 + {tasa_periodica})^{periodos}")
        print(f"Resultado exacto de Python: {resultado}")
        print("---------------------------------\n")
        # ---------------------------------------

        return jsonify({
            'exito': True,
            'resultado': round(resultado, 2),
            'tasa_periodica': round(tasa_periodica, 6),
            'periodos': periodos
        })
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

@app.route('/api/prestamos', methods=['POST'])
def api_prestamos():
    datos = request.get_json()
    try:
        monto = float(datos['monto'])
        # Asumimos que la tasa que envían es mensual en porcentaje (ej: 2 para 2%)
        tasa_mensual = float(datos['tasa']) / 100 
        plazo = int(datos['plazo'])
        
        cuota_fija, tabla = calcular_tabla_amortizacion(monto, tasa_mensual, plazo)
        
        return jsonify({
            'exito': True,
            'cuota_fija': cuota_fija,
            'tabla': tabla
        })
    except Exception as e:
        return jsonify({'exito': False, 'error': str(e)})

# --- INICIAR EL SERVIDOR ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)