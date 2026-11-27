# backend/descuento.py
from datetime import datetime, timedelta


def calcular_descuento_bancario(valor_inicial, fecha_inicio_str, plazo_dias, tasa_interes,
                                fecha_descuento_str, tasa_descuento, base_dias):
    if valor_inicial <= 0:
        raise ValueError('El valor inicial debe ser mayor a 0.')
    if plazo_dias <= 0:
        raise ValueError('El plazo debe ser mayor a 0 días.')
    if base_dias not in (360, 365):
        raise ValueError('La base de días debe ser 360 o 365.')

    fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d')
    fecha_descuento = datetime.strptime(fecha_descuento_str, '%Y-%m-%d')

    for f in (fecha_inicio, fecha_descuento):
        if not 1900 <= f.year <= 2200:
            raise ValueError('Las fechas deben estar entre los años 1900 y 2200.')

    fecha_vencimiento = fecha_inicio + timedelta(days=plazo_dias)

    if fecha_descuento < fecha_inicio:
        raise ValueError('La fecha de descuento no puede ser anterior a la fecha de emisión.')
    if fecha_descuento > fecha_vencimiento:
        raise ValueError('La fecha de descuento no puede ser posterior a la fecha de vencimiento '
                         f'({fecha_vencimiento.strftime("%Y-%m-%d")}).')

    valor_vencimiento = valor_inicial * (1 + (tasa_interes * (plazo_dias / base_dias)))

    dias_descuento = (fecha_vencimiento - fecha_descuento).days

    valor_transaccion = valor_vencimiento * (1 - (tasa_descuento * (dias_descuento / base_dias)))

    if valor_transaccion <= 0:
        raise ValueError('Con esa tasa de descuento y esos días el valor de la transacción sería cero o negativo. '
                         'Reduce la tasa de descuento.')

    return {
        'fecha_vencimiento': fecha_vencimiento.strftime('%Y-%m-%d'),
        'valor_vencimiento': round(valor_vencimiento, 2),
        'dias_descuento': dias_descuento,
        'valor_transaccion': round(valor_transaccion, 2)
    }