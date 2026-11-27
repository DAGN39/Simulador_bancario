# backend/anualidades.py
"""Anualidades: valor presente / valor futuro / pago periódico.

Soporta vencida y anticipada, diferida (solo para valor presente) y general
(la tasa se convierte a efectiva por periodo de pago antes de llegar aquí).
"""

MAX_PAGOS = 1200


def anualidad(calcular, i, n, pago=None, valor=None, anticipada=False, diferimiento=0):
    """i = tasa efectiva por PERIODO DE PAGO (decimal), n = número de pagos."""
    if i <= 0:
        raise ValueError('La tasa debe ser mayor que 0.')
    if n < 1 or n > MAX_PAGOS:
        raise ValueError(f'El número de pagos debe estar entre 1 y {MAX_PAGOS}.')
    if diferimiento < 0:
        raise ValueError('El diferimiento no puede ser negativo.')
    if diferimiento > 0 and calcular in ('vf', 'pago_vf'):
        raise ValueError('El diferimiento solo aplica cuando se trabaja con el valor presente.')

    ajuste = (1 + i) if anticipada else 1
    factor_vp = (1 - (1 + i) ** (-n)) / i * ajuste * (1 + i) ** (-diferimiento)
    factor_vf = ((1 + i) ** n - 1) / i * ajuste

    if calcular == 'vp':
        resultado = pago * factor_vp
    elif calcular == 'vf':
        resultado = pago * factor_vf
    elif calcular == 'pago_vp':
        resultado = valor / factor_vp
    elif calcular == 'pago_vf':
        resultado = valor / factor_vf
    else:
        raise ValueError('Operación no válida.')

    # Fórmula usada (texto para mostrar al usuario)
    if calcular in ('vp', 'pago_vp'):
        f = 'VP = A × [1 − (1+i)^−n] / i'
        if anticipada:
            f += ' × (1+i)'
        if diferimiento > 0:
            f += f' × (1+i)^−{diferimiento}'
    else:
        f = 'VF = A × [(1+i)^n − 1] / i'
        if anticipada:
            f += ' × (1+i)'
    if calcular.startswith('pago'):
        f += '   (se despeja A)'

    return round(resultado, 2), f