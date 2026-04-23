const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

const app = express();

// CONFIGURACIÓN DE CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));

// Middleware para detectar usuario
const getUserInfo = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    req.user = null; 

    if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
        try {
            req.user = jwt.verify(token, 'SECRET_KEY_PIOLIN');
        } catch (e) { 
            console.log("Token no válido o invitado");
        }
    }
    next();
};

app.use(getUserInfo);

// Proxy a Libros (PHP)
app.use('/api/libros', createProxyMiddleware({
    target: 'http://ms-libros:80', 
    changeOrigin: true,
    pathRewrite: { '^/api/libros': '' },
    onProxyReq: (proxyReq, req, res) => {
        if (req.user) {
            proxyReq.setHeader('X-User-ID', req.user.id.toString());
        } else {
            proxyReq.setHeader('X-User-ID', '0');
        }
    }
}));

// Proxy a Usuarios (Node.js)
app.use('/api/auth', createProxyMiddleware({
    target: 'http://ms-usuarios:8003',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/auth' },
}));

// Ruta de salud para verificar que el Gateway VIVE
app.get('/health', (req, res) => res.send('🐥 Gateway Piolín Vivito y Coleando'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Gateway corriendo en puerto ${PORT}`);
});