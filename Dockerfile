FROM node:20-slim

WORKDIR /app

# Copiar archivos de dependencias desde mcp-server
COPY mcp-server/package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar todo el código del servidor MCP
COPY mcp-server/ ./

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "sse-server.js"]
