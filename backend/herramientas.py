# backend/herramientas.py

def conversion_tasas(origen_valor, origen_tipo, origen_periodo, origen_modalidad, 
                     destino_tipo, destino_periodo, destino_modalidad):
    # 1. Obtener la tasa periódica de origen
    if origen_tipo == 'nominal':
        tasa_periodica = origen_valor / origen_periodo
    else: 
        tasa_periodica = origen_valor

    # 2. Convertir a Vencida (si es anticipada)
    if origen_modalidad == 'anticipada':
        tasa_periodica_vencida = tasa_periodica / (1 - tasa_periodica)
    else:
        tasa_periodica_vencida = tasa_periodica

    # 3. Llevar la tasa periódica vencida a Tasa Efectiva Anual (EA)
    tasa_ea = ((1 + tasa_periodica_vencida) ** origen_periodo) - 1

    # 4. Convertir la EA a la Tasa Destino Periódica VENCIDA
    tasa_periodica_destino_vencida = ((1 + tasa_ea) ** (1 / destino_periodo)) - 1

    # 5. Convertir la Tasa Destino a su modalidad final
    if destino_modalidad == 'anticipada':
        tasa_periodica_destino = tasa_periodica_destino_vencida / (1 + tasa_periodica_destino_vencida)
    else:
        tasa_periodica_destino = tasa_periodica_destino_vencida

    # 6. Si es nominal, multiplicar por el periodo
    if destino_tipo == 'nominal':
        tasa_destino = tasa_periodica_destino * destino_periodo
    else:
        tasa_destino = tasa_periodica_destino

    return tasa_destino, tasa_ea