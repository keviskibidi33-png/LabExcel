import openpyxl

# Cargar el template
workbook = openpyxl.load_workbook("templates/recepcion_template.xlsx")
worksheet = workbook.active

print("=== VERIFICACIÓN DEL TEMPLATE ===")
print(f"Celda C22: '{worksheet['C22'].value}'")
print(f"Celda C21: '{worksheet['C21'].value}'")
print(f"Celda C20: '{worksheet['C20'].value}'")
print(f"Celda C23: '{worksheet['C23'].value}'")

# Verificar también las celdas alrededor
print("\n=== CELDAS ALREDEDOR DE C22 ===")
for row in range(20, 25):
    for col in ['B', 'C', 'D']:
        cell_ref = f"{col}{row}"
        value = worksheet[cell_ref].value
        print(f"{cell_ref}: '{value}'")

# Verificar si hay celdas fusionadas
print("\n=== CELDAS FUSIONADAS ===")
for merged_range in worksheet.merged_cells.ranges:
    if 'C22' in merged_range:
        print(f"C22 está en rango fusionado: {merged_range}")
        top_left = merged_range.min_row, merged_range.min_col
        top_left_cell = worksheet.cell(row=top_left[0], column=top_left[1])
        print(f"Celda superior izquierda: {top_left_cell.coordinate} = '{top_left_cell.value}'")

workbook.close()
