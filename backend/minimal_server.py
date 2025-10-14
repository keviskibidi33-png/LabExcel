"""
Servidor mínimo para probar la conectividad
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Laboratorio Excel API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Laboratorio Excel API funcionando"}

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Backend funcionando correctamente"}

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    return {
        "total_ordenes": 2,
        "ordenes_pendientes": 1,
        "ordenes_completadas": 1,
        "total_items": 3,
        "ordenes_recientes": [
            {
                "id": 1,
                "numero_ot": "1422-25-LEM",
                "numero_recepcion": "1384-25",
                "estado": "EN_PROCESO"
            }
        ]
    }

@app.get("/api/ordenes/")
async def get_ordenes(skip: int = 0, limit: int = 100):
    return [
        {
            "id": 1,
            "numero_ot": "1422-25-LEM",
            "numero_recepcion": "1384-25",
            "referencia": "MEGAMINTAJE",
            "codigo_laboratorio": "F-LEM-P-02.01",
            "version": "03",
            "fecha_creacion": "2025-01-08T00:00:00Z",
            "fecha_recepcion": "2025-10-07T00:00:00Z",
            "fecha_inicio_programado": "2025-10-07T00:00:00Z",
            "fecha_fin_programado": "2025-10-09T00:00:00Z",
            "plazo_entrega_dias": 3,
            "observaciones": "Orden de trabajo para pruebas de compresión",
            "aperturada_por": "ANGELA PAREDES",
            "designada_a": "DAVID MEJORADA",
            "estado": "EN_PROCESO",
            "items": [
                {
                    "id": 1,
                    "item_numero": 1,
                    "codigo_muestra": "4259-CO-25",
                    "descripcion": "COMPRESION DE PROBETAS",
                    "cantidad": 5,
                    "especificacion": "C-6 M-1"
                }
            ]
        }
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)
