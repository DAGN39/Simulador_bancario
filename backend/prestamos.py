# backend/prestamos.py
"""Tabla de amortización con:
- pago vencido (fin de periodo) o anticipado (primer pago en el periodo 0)
- periodo de gracia (solo intereses o interés capitalizado); con pago anticipado solo interés capitalizado
- abonos extra a capital, con opción de reducir tiempo o reducir cuota
- sistema de cuotas: fija (anualidad) o variable (abono constante a capital, la cuota baja cada periodo)
"""

MAX_CUOTAS = 600
EPS = 0.005


def _moneda(x):
    """Formato $1.234.567,89 para mensajes de error."""
    return '$' + f'{x:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')


def _pmt_vencida(saldo, i, n):
    """Cuota fija de n pagos vencidos que amortiza 'saldo'."""
    if n < 1:
        raise ValueError('No quedan cuotas para recalcular el pago.')
    if i > 0:
        return saldo * i / (1 - (1 + i) ** (-n))
    return saldo / n


def _simular(monto, i, plazo, anticipado, gracia, tipo_gracia, abonos, modo, sistema='fija'):
    primera = 0 if anticipado else 1          # etiqueta del primer pago
    ultimo = plazo - 1 if anticipado else plazo   # etiqueta del último pago programado
    n_amort = plazo - gracia                  # cuotas que realmente amortizan

    saldo = monto
    cuota = None
    cuota_inicial = None
    capital_fijo = None                       # solo cuota variable: capital que se amortiza en cada cuota
    tabla = []
    usados = set()
    label = primera
    idx = 0

    while idx < plazo * 2 + 5:
        en_gracia = idx < gracia
        # En el pago anticipado, el pago del periodo 0 no genera interés
        interes = 0.0 if (anticipado and idx == 0) else saldo * i
        nota = ''
        extra = 0.0

        if en_gracia:
            abono_cap = 0.0
            if tipo_gracia == 'parcial':
                pago = interes
                nota = 'Gracia: solo intereses'
            else:
                pago = 0.0
                saldo += interes
                nota = 'Gracia: interés capitalizado'
        elif sistema == 'variable':
            # Cuota variable: mismo abono a capital en todas las cuotas; los intereses bajan con el saldo
            if capital_fijo is None:
                capital_fijo = saldo / n_amort
                cuota_inicial = capital_fijo + interes
            es_ultimo = label == ultimo
            abono_cap = saldo if es_ultimo else capital_fijo
            pago = abono_cap + interes
            saldo = 0.0 if es_ultimo else saldo - abono_cap
            cuota = pago                      # al final queda el valor de la última cuota
        else:
            if cuota is None:
                cuota = _pmt_vencida(saldo, i, n_amort)
                # Sin gracia, el primer pago anticipado es en el periodo 0 (se descuenta un periodo).
                # Con gracia, el saldo que se amortiza ya incluye el interés del último periodo de gracia.
                if anticipado and gracia == 0:
                    cuota /= (1 + i)
                cuota_inicial = cuota

            es_ultimo = ultimo is not None and label == ultimo
            if es_ultimo or cuota >= saldo + interes - EPS:
                # Última cuota: salda lo que quede
                abono_cap = saldo
                pago = saldo + interes
                saldo = 0.0
            else:
                pago = cuota
                abono_cap = pago - interes
                saldo -= abono_cap
                if label in abonos:
                    extra = abonos[label]
                    usados.add(label)
                    if extra >= saldo - EPS:
                        raise ValueError(
                            f'El abono extra de la cuota {label} ({_moneda(extra)}) es igual o mayor '
                            f'al saldo pendiente ({_moneda(saldo)}). Ingresa un valor menor.')
                    saldo -= extra
                    nota = 'Abono extra'
                    if modo == 'cuota':
                        # Mismo plazo, cuota más baja. Lo que queda se paga en
                        # (ultimo - label) cuotas vencidas contadas desde este momento.
                        cuota = _pmt_vencida(saldo, i, ultimo - label)
                    else:
                        # Misma cuota, menos cuotas: ya no hay fecha de fin fija
                        ultimo = None

        tabla.append({
            'periodo': label,
            'cuota': round(pago, 2),
            'interes': round(interes, 2),
            'abono_capital': round(abono_cap, 2),
            'abono_extra': round(extra, 2),
            'saldo': round(max(saldo, 0.0), 2),
            'nota': nota,
        })
        idx += 1
        label += 1
        if not en_gracia and saldo <= EPS:
            break

    sin_aplicar = set(abonos) - usados
    if sin_aplicar:
        c = min(sin_aplicar)
        raise ValueError(f'El abono de la cuota {c} no se pudo aplicar porque el crédito ya estaba '
                         'pagado antes de esa cuota (por un abono anterior).')

    total_pagado = sum(f['cuota'] + f['abono_extra'] for f in tabla)
    total_intereses = sum(f['interes'] for f in tabla)
    return cuota_inicial, cuota, tabla, total_pagado, total_intereses


def calcular_tabla_amortizacion(monto, tasa_periodica, plazo_cuotas, anticipado=False,
                                gracia=0, tipo_gracia='parcial', abonos=None, modo_abono='plazo', sistema='fija'):
    abonos = abonos or {}

    if monto <= 0:
        raise ValueError('El monto del préstamo debe ser mayor que 0.')
    if tasa_periodica <= 0:
        raise ValueError('La tasa de interés debe ser mayor que 0.')
    if plazo_cuotas < 1:
        raise ValueError('El número de cuotas debe ser mayor que 0.')
    if plazo_cuotas > MAX_CUOTAS:
        raise ValueError(f'El número máximo de cuotas es {MAX_CUOTAS}.')
    if gracia < 0:
        raise ValueError('Los periodos de gracia no pueden ser negativos.')
    if tipo_gracia not in ('parcial', 'total'):
        raise ValueError('Tipo de gracia no válido.')
    if modo_abono not in ('plazo', 'cuota'):
        raise ValueError('La opción de abono debe ser reducir tiempo o reducir cuota.')
    if sistema not in ('fija', 'variable'):
        raise ValueError('El sistema de cuotas debe ser fija o variable.')
    if gracia > 0 and anticipado and tipo_gracia != 'total':
        raise ValueError('Con pago anticipado el periodo de gracia solo puede ser con interés capitalizado '
                         '(no pago nada).')
    if sistema == 'variable' and abonos:
        raise ValueError('La cuota variable no se puede combinar con abonos extra. Quita los abonos o elige cuota fija.')
    if sistema == 'variable' and anticipado and gracia > 0:
        raise ValueError('La cuota variable con periodo de gracia solo está disponible con pago vencido.')
    if gracia >= plazo_cuotas:
        raise ValueError('Los periodos de gracia deben ser menos que el número de cuotas.')

    primera = 0 if anticipado else 1
    ultimo = plazo_cuotas - 1 if anticipado else plazo_cuotas
    desde = primera + gracia
    for c in abonos:
        if c < desde or c >= ultimo:
            raise ValueError(f'Los abonos extra deben hacerse entre la cuota {desde} y la cuota {ultimo - 1}'
                             + (' (después del periodo de gracia).' if gracia else '.'))

    cuota_ini, cuota_fin, tabla, pagado, intereses = _simular(
        monto, tasa_periodica, plazo_cuotas, anticipado, gracia, tipo_gracia, abonos, modo_abono, sistema)

    ahorro = 0.0
    if abonos:
        _, _, _, _, int_base = _simular(monto, tasa_periodica, plazo_cuotas, anticipado,
                                        gracia, tipo_gracia, {}, modo_abono, sistema)
        ahorro = int_base - intereses

    return {
        'cuota_fija': round(cuota_ini, 2),
        'cuota_final': round(cuota_fin, 2),
        'tabla': tabla,
        'total_pagado': round(pagado, 2),
        'total_intereses': round(intereses, 2),
        'ahorro_intereses': round(ahorro, 2),
        'num_pagos': len(tabla),
        'sistema': sistema,
    }