def mover_footer_simple(worksheet, footer_row: int, total_items: int) -> int:
    """Mover footer de forma simple sin depender de fusiones - BUENAS PRÁCTICAS"""
    try:
        print(f"Moviendo footer para {total_items} items")
        
        # Calcular cuántas filas adicionales necesitamos
        filas_necesarias = total_items - 17  # 17 es la capacidad del template original
        
        if filas_necesarias <= 0:
            print("No se necesita mover el footer")
            return footer_row
        
        print(f"Insertando {filas_necesarias} filas para acomodar {total_items} items")
        
        # Insertar filas ANTES del footer para empujarlo hacia abajo
        for i in range(filas_necesarias):
            worksheet.insert_rows(footer_row - 1, amount=1)
            footer_row += 1
            print(f"Fila insertada, footer ahora en {footer_row}")
        
        # Asegurar que el footer tenga el contenido correcto
        asegurar_contenido_footer(worksheet, footer_row)
        
        print(f"Footer movido exitosamente a fila {footer_row}")
        return footer_row
        
    except Exception as e:
        print(f"Error moviendo footer: {e}")
        return footer_row

def asegurar_contenido_footer(worksheet, footer_row: int):
    """Asegurar que el footer tenga el contenido correcto - BUENAS PRÁCTICAS"""
    try:
        print(f"Asegurando contenido del footer en fila {footer_row}")
        
        # Buscar y asegurar "Entregado por:"
        for col in range(1, 12):
            try:
                cell = worksheet.cell(row=footer_row, column=col)
                if isinstance(cell.value, str) and "Entregado por:" in cell.value:
                    if "(Cliente)" not in cell.value:
                        cell.value = "Entregado por:\n(Cliente)"
                    print("'Entregado por:' corregido")
                    break
            except:
                continue
        
        # Buscar y asegurar "Recibido por:"
        for col in range(1, 12):
            try:
                cell = worksheet.cell(row=footer_row, column=col)
                if isinstance(cell.value, str) and "Recibido por:" in cell.value:
                    if "(Laboratorio GEOFAL)" not in cell.value:
                        cell.value = "Recibido por:\n(Laboratorio GEOFAL)"
                    print("'Recibido por:' corregido")
                    break
            except:
                continue
        
        # Ajustar altura del footer
        worksheet.row_dimensions[footer_row].height = 35.0
        
        print("Contenido del footer asegurado")
        
    except Exception as e:
        print(f"Error asegurando contenido del footer: {e}")
