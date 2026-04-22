const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Importar Middlewares separados
const loggerMiddleware = require('./middlewares/logger');

const app = express();
app.use(cors());
app.use(loggerMiddleware);

app.use('/api/libros', createProxyMiddleware({
    target: 'http://ms-libros:80', 
    changeOrigin: true,
    pathRewrite: { '^/api/libros': '' }, // Importante: deja la ruta limpia
}));

app.use('/api/autores', createProxyMiddleware({
    target: 'http://ms-autores:8002', 
    changeOrigin: true,
    pathRewrite: { '^/api/autores': '/autores' }, 
}));

app.listen(3000, () => console.log('Gateway escuchando en el puerto 3000'));