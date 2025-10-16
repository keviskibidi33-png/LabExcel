"""
Script para exportar la base de datos completa a JSON
Incluye todas las tablas, conexiones y datos
"""

import json
import os
import sys
from datetime import datetime
from sqlalchemy import create_engine, text, MetaData, Table
from sqlalchemy.orm import sessionmaker
import pandas as pd

# Configuración de la base de datos
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/geocreator_db"

def export_database_to_json():
    """Exportar toda la base de datos a archivos JSON"""
    
    try:
        # Crear conexión a la base de datos
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        print("Iniciando exportacion de base de datos...")
        
        # Crear directorio para la exportación
        export_dir = "database_export"
        if not os.path.exists(export_dir):
            os.makedirs(export_dir)
        
        # Obtener metadatos de la base de datos
        metadata = MetaData()
        metadata.reflect(bind=engine)
        
        # Información general de la base de datos
        db_info = {
            "export_date": datetime.now().isoformat(),
            "database_url": DATABASE_URL,
            "tables": [],
            "total_tables": len(metadata.tables)
        }
        
        # Exportar cada tabla
        for table_name, table in metadata.tables.items():
            print(f"Exportando tabla: {table_name}")
            
            try:
                # Obtener datos de la tabla
                query = f"SELECT * FROM {table_name}"
                df = pd.read_sql(query, engine)
                
                # Convertir a diccionario
                table_data = {
                    "table_name": table_name,
                    "columns": list(df.columns),
                    "row_count": len(df),
                    "data": df.to_dict('records')
                }
                
                # Guardar tabla individual
                table_file = os.path.join(export_dir, f"{table_name}.json")
                with open(table_file, 'w', encoding='utf-8') as f:
                    json.dump(table_data, f, indent=2, ensure_ascii=False, default=str)
                
                # Agregar información a db_info
                db_info["tables"].append({
                    "name": table_name,
                    "columns": list(df.columns),
                    "row_count": len(df),
                    "export_file": f"{table_name}.json"
                })
                
                print(f"OK {table_name}: {len(df)} registros exportados")
                
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
        
        # Exportar estructura de la base de datos
        structure_file = os.path.join(export_dir, "database_structure.json")
        structure_data = {
            "export_date": datetime.now().isoformat(),
            "database_url": DATABASE_URL,
            "tables_structure": {}
        }
        
        for table_name, table in metadata.tables.items():
            columns_info = []
            for column in table.columns:
                columns_info.append({
                    "name": column.name,
                    "type": str(column.type),
                    "nullable": column.nullable,
                    "primary_key": column.primary_key,
                    "default": str(column.default) if column.default else None
                })
            
            structure_data["tables_structure"][table_name] = {
                "columns": columns_info,
                "primary_keys": [pk.name for pk in table.primary_key.columns],
                "foreign_keys": [
                    {
                        "column": fk.parent.name,
                        "references": f"{fk.column.table.name}.{fk.column.name}"
                    }
                    for fk in table.foreign_keys
                ]
            }
        
        with open(structure_file, 'w', encoding='utf-8') as f:
            json.dump(structure_data, f, indent=2, ensure_ascii=False, default=str)
        
        # Crear archivo de resumen
        summary_file = os.path.join(export_dir, "README.md")
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(f"""# Exportación de Base de Datos - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Información General
- **Fecha de exportación:** {datetime.now().isoformat()}
- **Base de datos:** {DATABASE_URL}
- **Total de tablas:** {len(metadata.tables)}

## Archivos Exportados

### Información General
- `database_info.json` - Información general y resumen de tablas
- `database_structure.json` - Estructura completa de la base de datos
- `README.md` - Este archivo

### Datos de Tablas
""")
            
            for table_name in metadata.tables.keys():
                f.write(f"- `{table_name}.json` - Datos de la tabla {table_name}\n")
            
            f.write(f"""
## Cómo Restaurar la Base de Datos

1. Crear la base de datos:
```sql
CREATE DATABASE geocreator_db;
```

2. Ejecutar las migraciones:
```bash
cd backend
python migrate_database.py
```

3. Importar datos (opcional):
```python
# Usar el script de importación
python import_database.py
```

## Notas
- Todos los archivos están en formato JSON con codificación UTF-8
- Las fechas están en formato ISO
- Los datos están listos para importar o análisis
""")
        
        session.close()
        engine.dispose()
        
        print(f"\nExportacion completada exitosamente!")
        print(f"Directorio: {export_dir}")
        print(f"Total de tablas: {len(metadata.tables)}")
        print(f"Archivos generados:")
        print(f"   - database_info.json")
        print(f"   - database_structure.json") 
        print(f"   - README.md")
        for table_name in metadata.tables.keys():
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
