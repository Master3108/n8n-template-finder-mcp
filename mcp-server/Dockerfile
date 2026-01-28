FROM node:20-slim

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código del servidor
COPY . .

# Exponer el puerto que configuramos (3000)
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "sse-server.js"]
