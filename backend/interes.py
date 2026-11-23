# backend/interes.py

def interes_simple(capital, tasa_anual, tiempo_anios):
    """Calcula el interés simple y el valor futuro."""
    interes = capital * tasa_anual * tiempo_anios
    valor_futuro = capital + interes
    return interes, valor_futuro

def interes_compuesto(calcular, monto, tasa_anual, capitalizacion, tiempo_anios):
    """
    Calcula Valor Futuro (vf) o Valor Presente (vp) en interés compuesto.
    """
    # 1. Hallar la tasa periódica (ej. 15% / 4 trimestres = 0.0375)
    tasa_periodica = tasa_anual / capitalizacion
    
    # 2. Hallar el número total de periodos (ej. 10 años * 4 = 40 trimestres)
    n_periodos = tiempo_anios * capitalizacion
    
    resultado = 0
    if calcular == 'vf':
        # Fórmula VF = VP * (1 + i)^n
        resultado = monto * ((1 + tasa_periodica) ** n_periodos)
    elif calcular == 'vp':
        # Fórmula VP = VF / (1 + i)^n
        resultado = monto / ((1 + tasa_periodica) ** n_periodos)
        
    return resultado, tasa_periodica, n_periodos