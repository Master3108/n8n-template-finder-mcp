# 🚀 Guía de Deployment en Easypanel - FlowMatch

**Fecha**: 28 de Enero 2026  
**URL Easypanel**: http://72.60.245.87:3000/

---

## 📋 Pre-requisitos ✅

- [x] Repositorio GitHub: `https://github.com/Master3108/n8n-template-finder-mcp.git`
- [x] Código actualizado en GitHub
- [x] Dockerfile listo en `mcp-server/Dockerfile`
- [x] Acceso a Easypanel

---

## 🎯 Opción 1: Deploy Solo MCP Server (RECOMENDADO)

### Paso 1: Acceder a Easypanel
1. Abre: `http://72.60.245.87:3000/`
2. Login con tus credenciales

### Paso 2: Crear Nueva Aplicación
1. Click en **"+ Create"** o **"New App"**
2. Selecciona **"App from GitHub"** o **"Git"**

### Paso 3: Configurar Repositorio
```
Repository URL: https://github.com/Master3108/n8n-template-finder-mcp.git
Branch: main
```

### Paso 4: Configurar Build Settings
```yaml
App Name: mcp-server
Build Method: Dockerfile
Dockerfile Path: mcp-server/Dockerfile
Context Path: ./mcp-server
```

### Paso 5: Variables de Entorno
```bash
PORT=3000
NODE_ENV=production
```

### Paso 6: Port Mapping
```
Container Port: 3000
Public Port: 3001  # O el puerto que prefieras
```

### Paso 7: Deploy
1. Click en **"Deploy"** o **"Create & Deploy"**
2. Espera a que termine el build
3. Verifica el log de deployment

### Paso 8: Verificar
```bash
# URL del servidor MCP
http://72.60.245.87:3001

# Endpoint SSE
http://72.60.245.87:3001/sse

# Health check (si existe)
http://72.60.245.87:3001/health
```

---

## 🎨 Opción 2: Deploy Full Stack (Frontend + Backend)

### Necesitas crear 2 Dockerfiles:

#### 1. Dockerfile para Frontend (raíz del proyecto)
```dockerfile
# Dockerfile en la raíz
FROM node:18-alpine as build

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Build
RUN npm run build

# Servidor de producción
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy para MCP Server
        location /api/ {
            proxy_pass http://mcp-server:3000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Luego en Easypanel:
1. **App 1**: Frontend (puerto 80)
   - Dockerfile: `./Dockerfile` (en raíz)
   
2. **App 2**: MCP Server (puerto 3000)
   - Dockerfile: `mcp-server/Dockerfile`

---

## 🔗 Conectar N8N con MCP Server

### En tu N8N (https://n8n-n8n.cwf1hb.easypanel.host)

#### Opción A: HTTP Request Node
```yaml
Method: GET
URL: http://72.60.245.87:3001/sse
Headers:
  Accept: text/event-stream
  Connection: keep-alive
```

#### Opción B: Webhook Trigger
```yaml
Webhook URL: http://72.60.245.87:3001/webhook
Method: POST
```

---

## ✅ Checklist de Deployment

Antes de deployar, verifica:

- [ ] Git push completado exitosamente
- [ ] Dockerfile probado localmente (opcional)
- [ ] Variables de entorno definidas
- [ ] Puertos configurados correctamente
- [ ] N8N tiene acceso al servidor (firewall/networking)

---

## 🐛 Troubleshooting

### Error: "Build failed"
- Verifica que el Dockerfile path sea correcto
- Revisa los logs de build en Easypanel
- Asegúrate que todas las dependencias estén en `package.json`

### Error: "Container exits immediately"
- Verifica las variables de entorno
- Revisa los logs del container
- Asegúrate que el PORT esté bien configurado

### Error: "Can't connect from N8N"
- Verifica el firewall/networking en Easypanel
- Asegúrate que el puerto esté público
- Prueba con `curl` desde otro servidor

### N8N no recibe eventos SSE
- Verifica CORS en el servidor MCP
- Asegúrate que N8N pueda hacer requests salientes
- Revisa los headers de SSE

---

## 📊 Arquitectura Final

```
Internet
   ↓
Easypanel (72.60.245.87)
   ├─ Port 3000 → Easypanel UI
   ├─ Port 3001 → MCP Server
   │    ├─ /sse → Server-Sent Events
   │    └─ /webhook → Webhooks
   └─ Port 80/443 → Frontend (opcional)

N8N (cwf1hb.easypanel.host)
   ↓
Conecta a → http://72.60.245.87:3001/sse
```

---

## 🎉 Próximos Pasos Post-Deployment

1. **Probar el servidor MCP**
   ```bash
   curl http://72.60.245.87:3001/sse
   ```

2. **Configurar N8N workflow**
   - Crear nodo HTTP Request
   - Configurar SSE connection
   - Probar envío/recepción de eventos

3. **Monitorear logs**
   - En Easypanel → Logs del container
   - Verificar errores/warnings

4. **Optimizar**
   - Configurar SSL/HTTPS
   - Agregar rate limiting
   - Implementar autenticación

---

## 📞 Recursos

- **Easypanel Docs**: https://easypanel.io/docs
- **N8N Docs**: https://docs.n8n.io
- **MCP Protocol**: https://modelcontextprotocol.io

---

**¿Listo para deployar? 🚀**

Continúa con los pasos en Easypanel UI.
