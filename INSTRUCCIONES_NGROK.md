# 🚀 Instrucciones para usar Ngrok

## ✅ Configuración Completada

- **Authtoken configurado**: ✅
- **Archivo de configuración**: `ngrok.yml` ✅

## 📋 Cómo Iniciar los Túneles

### Opción 1: Desde la línea de comandos
```powershell
ngrok start --all --config=ngrok.yml
```

### Opción 2: Túneles individuales (si la opción 1 no funciona)
```powershell
# Terminal 1 - Backend
ngrok http 8000

# Terminal 2 - Frontend  
ngrok http 3001
```

## 📊 Verificar Estado

Una vez iniciado ngrok, puedes verificar el estado en:
- **Dashboard Web**: http://127.0.0.1:4040
- **API de túneles**: http://127.0.0.1:4040/api/tunnels

## 🔗 URLs Públicas

Cuando ngrok esté ejecutándose, verás las URLs públicas en:
- El dashboard web (http://127.0.0.1:4040)
- La salida de la terminal donde ejecutaste ngrok

Las URLs tendrán el formato:
- `https://xxxx-xxxx-xxxx.ngrok-free.dev` (para backend)
- `https://yyyy-yyyy-yyyy.ngrok-free.dev` (para frontend)

## 🛑 Detener Ngrok

Para detener los túneles:
```powershell
Stop-Process -Name ngrok
```

O presiona `Ctrl+C` en la terminal donde está ejecutándose.

## 📝 Notas

- Los túneles son públicos y accesibles desde internet
- Las URLs cambian cada vez que reinicias ngrok (a menos que tengas plan de pago)
- El dashboard muestra todas las peticiones que pasan por los túneles
- Asegúrate de que el backend (puerto 8000) y frontend (puerto 3001) estén ejecutándose antes de iniciar ngrok

