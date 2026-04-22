const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const loggerMiddleware = require('./middlewares/logger');

const app = express();

// 1. CONFIGURACIÓN DE CORS DETALLADA
// Esto le dice al navegador: "Confía en lo que venga del puerto 3001"
app.use(cors({
    origin: '*', // En desarrollo, esto permite que cualquier origen entre
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));

app.use(loggerMiddleware);

// Middleware para detectar usuario
const getUserInfo = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        // Manejamos si viene como "Bearer TOKEN" o solo "TOKEN"
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
        try {
            req.user = jwt.verify(token, 'SECRET_KEY_PIOLIN');
        } catch (e) { 
            req.user = null; 
        }
    }
    next();
};

app.use(getUserInfo);

// --- PROXIES ---

// Proxy a Libros (PHP)
app.use('/api/libros', createProxyMiddleware({
    target: 'http://ms-libros:80', 
    changeOrigin: true,
    pathRewrite: { '^/api/libros': '' },
    onProxyReq: (proxyReq, req, res) => {
        if (req.user) {
            proxyReq.setHeader('X-User-ID', req.user.id);
        }
    }
}));

// Proxy a Usuarios (Node.js)
app.use('/api/auth', createProxyMiddleware({
    target: 'http://ms-usuarios:8003',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/auth' },
}));

// Proxy a Autores (Node.js)
app.use('/api/autores', createProxyMiddleware({
    target: 'http://ms-autores:8002', 
    changeOrigin: true,
    pathRewrite: { '^/api/autores': '/autores' }, 
}));

// Ruta de salud para probar rápido en el navegador
app.get('/health', (req, res) => res.send('Gateway Piolín en línea 🐥'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Gateway Piolín listo en puerto ${PORT}`);
    console.log(`=========================================`);
});