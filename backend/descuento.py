# backend/descuento.py
from datetime import datetime, timedelta

def calcular_descuento_bancario(valor_inicial, fecha_inicio_str, plazo_dias, tasa_interes, fecha_descuento_str, tasa_descuento, base_dias):
    fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d')
    fecha_descuento = datetime.strptime(fecha_descuento_str, '%Y-%m-%d')
    
    fecha_vencimiento = fecha_inicio + timedelta(days=plazo_dias)
    
    valor_vencimiento = valor_inicial * (1 + (tasa_interes * (plazo_dias / base_dias)))
    
    dias_descuento = (fecha_vencimiento - fecha_descuento).days
    
    valor_transaccion = valor_vencimiento * (1 - (tasa_descuento * (dias_descuento / base_dias)))
    
    return {
        'fecha_vencimiento': fecha_vencimiento.strftime('%Y-%m-%d'),
        'valor_vencimiento': round(valor_vencimiento, 2),
        'dias_descuento': dias_descuento,
        'valor_transaccion': round(valor_transaccion, 2)
    }