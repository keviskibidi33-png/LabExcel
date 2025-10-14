"""
Servidor de prueba simple para verificar que FastAPI funciona
"""

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Servidor de prueba funcionando"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
