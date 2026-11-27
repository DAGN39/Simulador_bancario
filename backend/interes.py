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
        if vp <= 0 or tiempo_periodos <= 0:
            raise ValueError('El capital y el tiempo deben ser mayores que 0.')
        if vf <= vp:
            raise ValueError('El valor final debe ser mayor que el capital inicial.')
        return (vf - vp) / (vp * tiempo_periodos)
    elif calcular == 'tiempo':
        if vp <= 0 or tasa_periodo <= 0:
            raise ValueError('El capital y la tasa deben ser mayores que 0.')
        if vf <= vp:
            raise ValueError('El valor final debe ser mayor que el capital inicial.')
        return (vf - vp) / (vp * tasa_periodo)
    return 0


def interes_compuesto(calcular, vp=None, vf=None, tasa_ea=None, tiempo_anios=None, res_tipo='efectiva', res_periodo=1):
    if calcular == 'vf':
        return vp * ((1 + tasa_ea) ** tiempo_anios)
    elif calcular == 'vp':
        return vf / ((1 + tasa_ea) ** tiempo_anios)
    elif calcular == 'tasa':
        if vp <= 0 or vf <= 0 or tiempo_anios <= 0:
            raise ValueError('Capital, monto final y tiempo deben ser mayores que 0.')
        if vf <= vp:
            raise ValueError('El valor final debe ser mayor que el capital inicial.')
        tasa_ea_calculada = ((vf / vp) ** (1 / tiempo_anios)) - 1
        tasa_periodica = ((1 + tasa_ea_calculada) ** (1 / res_periodo)) - 1
        if res_tipo == 'nominal':
            return tasa_periodica * res_periodo
        return tasa_periodica
    elif calcular == 'tiempo':
        if vp <= 0 or vf <= 0 or tasa_ea <= 0:
            raise ValueError('Capital, monto final y tasa deben ser mayores que 0.')
        if vf <= vp:
            raise ValueError('El valor final debe ser mayor que el capital inicial.')
        return math.log(vf / vp) / math.log(1 + tasa_ea)
    return 0