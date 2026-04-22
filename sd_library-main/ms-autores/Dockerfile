# 1. Imagen base de Node
FROM node:18-alpine

# 2. Carpeta de trabajo
WORKDIR /app

# 3. Copiar archivos de dependencias
COPY package*.json ./

# 4. Instalar librerías
RUN npm install

# 5. Copiar el resto del código
COPY . .

# 6. Exponer el puerto (3000 para gateway, 8002 para autores)
EXPOSE 3000

# 7. Arrancar la app
CMD ["npm", "start"]