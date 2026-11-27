# backend/interes.py

def interes_simple(capital, tasa_anual, tiempo_anios):
    interes = capital * tasa_anual * tiempo_anios
    valor_futuro = capital + interes
    return interes, valor_futuro

def interes_compuesto(calcular, monto, tasa_ea, tiempo_anios):
    """Recibe la Tasa Efectiva Anual (tasa_ea) ya calculada."""
    if calcular == 'vf':
        resultado = monto * ((1 + tasa_ea) ** tiempo_anios)
    elif calcular == 'vp':
        resultado = monto / ((1 + tasa_ea) ** tiempo_anios)
    else:
        resultado = 0
    return resultado