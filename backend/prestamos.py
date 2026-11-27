# backend/prestamos.py

def calcular_tabla_amortizacion(monto, tasa_periodica, plazo_cuotas):
    if tasa_periodica > 0:
        cuota = monto * (tasa_periodica / (1 - (1 + tasa_periodica) ** (-plazo_cuotas)))
    else:
        cuota = monto / plazo_cuotas

    tabla = []
    saldo = monto

    for i in range(1, plazo_cuotas + 1):
        interes = saldo * tasa_periodica
        abono_capital = cuota - interes
        
        if i == plazo_cuotas:
            abono_capital = saldo
            cuota_final = abono_capital + interes
            saldo = 0.0
        else:
            cuota_final = cuota
            saldo -= abono_capital

        tabla.append({
            'mes': i,
            'cuota': round(cuota_final, 2),
            'interes': round(interes, 2),
            'abono_capital': round(abono_capital, 2),
            'saldo': round(saldo, 2)
        })

    return round(cuota, 2), tabla