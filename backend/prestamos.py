# backend/prestamos.py

def calcular_tabla_amortizacion(monto, tasa_mensual, plazo_meses):
    """
    Calcula la cuota fija y genera la tabla de amortización (Sistema Francés).
    """
    # Fórmula de la cuota fija: C = (P * i) / (1 - (1 + i)^-n)
    if tasa_mensual > 0:
        cuota = monto * (tasa_mensual / (1 - (1 + tasa_mensual) ** (-plazo_meses)))
    else:
        # Si la tasa es 0, simplemente dividimos el monto
        cuota = monto / plazo_meses

    tabla = []
    saldo = monto

    for mes in range(1, plazo_meses + 1):
        interes = saldo * tasa_mensual
        abono_capital = cuota - interes
        
        # El último mes ajustamos por posibles errores de redondeo de punto flotante
        if mes == plazo_meses:
            abono_capital = saldo
            cuota_final = abono_capital + interes
            saldo = 0.0
        else:
            cuota_final = cuota
            saldo -= abono_capital

        tabla.append({
            'mes': mes,
            'cuota': round(cuota_final, 2),
            'interes': round(interes, 2),
            'abono_capital': round(abono_capital, 2),
            'saldo': round(saldo, 2)
        })

    return round(cuota, 2), tabla