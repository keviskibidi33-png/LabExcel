"""
Script simplificado para exportar la base de datos a JSON
Usa SQLite para evitar problemas de codificación
"""

import json
import os
import sys
from datetime import datetime
import sqlite3

def export_database_to_json():
    """Exportar base de datos SQLite a JSON"""
    
    try:
        # Usar SQLite en lugar de PostgreSQL
        db_path = "geocreator.db"
        
        if not os.path.exists(db_path):
            print(f"Base de datos SQLite no encontrada: {db_path}")
            return None
        
        print("Iniciando exportacion de base de datos SQLite...")
        
        # Crear conexión a SQLite
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row  # Para obtener resultados como diccionarios
        cursor = conn.cursor()
        
        # Crear directorio para la exportación
        export_dir = "database_export"
        if not os.path.exists(export_dir):
            os.makedirs(export_dir)
        
        # Obtener lista de tablas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"Tablas encontradas: {tables}")
        
        # Información general de la base de datos
        db_info = {
            "export_date": datetime.now().isoformat(),
            "database_type": "SQLite",
            "database_path": db_path,
            "tables": [],
            "total_tables": len(tables)
        }
        
        # Exportar cada tabla
        for table_name in tables:
            print(f"Exportando tabla: {table_name}")
            
            try:
                # Obtener estructura de la tabla
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns_info = [{"name": row[1], "type": row[2], "not_null": bool(row[3]), "default": row[4], "primary_key": bool(row[5])} for row in cursor.fetchall()]
                
                # Obtener datos de la tabla
                cursor.execute(f"SELECT * FROM {table_name}")
                rows = cursor.fetchall()
                
                # Convertir a lista de diccionarios
                data = []
                for row in rows:
                    row_dict = {}
                    for i, column in enumerate(columns_info):
                        value = row[i]
                        # Convertir fechas y otros tipos especiales
                        if isinstance(value, str) and value:
                            # Intentar convertir fechas
                            try:
                                if len(value) == 10 and value.count('-') == 2:
                                    datetime.strptime(value, '%Y-%m-%d')
                                elif len(value) == 19 and value.count('-') == 2 and value.count(':') == 2:
                                    datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                            except:
                                pass
                        row_dict[column["name"]] = value
                    data.append(row_dict)
                
                # Crear estructura de datos de la tabla
                table_data = {
                    "table_name": table_name,
                    "columns": [col["name"] for col in columns_info],
                    "columns_info": columns_info,
                    "row_count": len(data),
                    "data": data
                }
                
                # Guardar tabla individual
                table_file = os.path.join(export_dir, f"{table_name}.json")
                with open(table_file, 'w', encoding='utf-8') as f:
                    json.dump(table_data, f, indent=2, ensure_ascii=False, default=str)
                
                # Agregar información a db_info
                db_info["tables"].append({
                    "name": table_name,
                    "columns": [col["name"] for col in columns_info],
                    "row_count": len(data),
                    "export_file": f"{table_name}.json"
                })
                
                print(f"OK {table_name}: {len(data)} registros exportados")
                
            except Exception as e:
                print(f"ERROR exportando {table_name}: {e}")
                db_info["tables"].append({
                    "name": table_name,
                    "error": str(e)
                })
        
        # Guardar información general
        info_file = os.path.join(export_dir, "database_info.json")
        with open(info_file, 'w', encoding='utf-8') as f:
            json.dump(db_info, f, indent=2, ensure_ascii=False, default=str)
        
        # Crear archivo de resumen
        summary_file = os.path.join(export_dir, "README.md")
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(f"""# Exportacion de Base de Datos - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Informacion General
- **Fecha de exportacion:** {datetime.now().isoformat()}
- **Tipo de base de datos:** SQLite
- **Archivo de base de datos:** {db_path}
- **Total de tablas:** {len(tables)}

## Archivos Exportados

### Informacion General
- `database_info.json` - Informacion general y resumen de tablas
- `README.md` - Este archivo

### Datos de Tablas
""")
            
            for table_name in tables:
                f.write(f"- `{table_name}.json` - Datos de la tabla {table_name}\n")
            
            f.write(f"""
## Como Restaurar la Base de Datos

1. Crear la base de datos SQLite:
```bash
# La base de datos se crea automaticamente al ejecutar el backend
cd backend
python main.py
```

2. Importar datos (opcional):
```python
# Usar el script de importacion
python import_database.py
```

## Notas
- Todos los archivos estan en formato JSON con codificacion UTF-8
- Las fechas estan en formato ISO
- Los datos estan listos para importar o analisis
""")
        
        conn.close()
        
        print(f"\nExportacion completada exitosamente!")
        print(f"Directorio: {export_dir}")
        print(f"Total de tablas: {len(tables)}")
        print(f"Archivos generados:")
        print(f"   - database_info.json")
        print(f"   - README.md")
        for table_name in tables:
            print(f"   - {table_name}.json")
        
        return export_dir
        
    except Exception as e:
        print(f"ERROR durante la exportacion: {e}")
        return None

if __name__ == "__main__":
    export_dir = export_database_to_json()
    if export_dir:
        print(f"\nBase de datos exportada exitosamente a: {export_dir}")
    else:
        print("\nError en la exportacion")
        sys.exit(1)
