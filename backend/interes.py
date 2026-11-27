# backend/interes.py
import math

def interes_simple(calcular, vp=None, vf=None, tasa_periodo=None, tiempo_periodos=None):
    """Calcula cualquier variable de interés simple."""
    if calcular == 'interes':
        return vp * tasa_periodo * tiempo_periodos
    elif calcular == 'vf':
        return vp * (1 + (tasa_periodo * tiempo_periodos))
    elif calcular == 'vp':
        return vf / (1 + (tasa_periodo * tiempo_periodos))
    elif calcular == 'tasa':
        interes = vf - vp
        return interes / (vp * tiempo_periodos)
    elif calcular == 'tiempo':
        interes = vf - vp
        return interes / (vp * tasa_periodo)
    return 0

def interes_compuesto(calcular, vp=None, vf=None, tasa_ea=None, tiempo_anios=None, res_tipo='efectiva', res_periodo=1):
    if calcular == 'vf':
        return vp * ((1 + tasa_ea) ** tiempo_anios)
    elif calcular == 'vp':
        return vf / ((1 + tasa_ea) ** tiempo_anios)
    elif calcular == 'tasa':
        tasa_ea_calculada = ((vf / vp) ** (1 / tiempo_anios)) - 1
        if res_tipo == 'nominal':
            tasa_periodica = ((1 + tasa_ea_calculada) ** (1 / res_periodo)) - 1
            return tasa_periodica * res_periodo
        else:
            return ((1 + tasa_ea_calculada) ** (1 / res_periodo)) - 1
    elif calcular == 'tiempo':
        return math.log(vf / vp) / math.log(1 + tasa_ea)
    return 0