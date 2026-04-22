FROM node:18-alpine

# Crear carpeta de la app
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto del microservicio
EXPOSE 8003

# Comando para arrancar
CMD ["node", "src/index.js"]