const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken'); // Para validar quién pide qué
const loggerMiddleware = require('./middlewares/logger');

const app = express();
app.use(cors());
app.use(loggerMiddleware);

// Middleware para detectar usuario (opcional)
const getUserInfo = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        try {
            req.user = jwt.verify(token, 'SECRET_KEY_PIOLIN');
        } catch (e) { req.user = null; }
    }
    next();
};

app.use(getUserInfo);

// Proxy a Libros con filtro de visibilidad
app.use('/api/libros', createProxyMiddleware({
    target: 'http://ms-libros:80', 
    changeOrigin: true,
    pathRewrite: { '^/api/libros': '' },
    onProxyReq: (proxyReq, req, res) => {
        // Si el usuario está logueado, le pasamos su ID al microservicio PHP
        if (req.user) {
            proxyReq.setHeader('X-User-ID', req.user.id);
        }
    }
}));

// Nuevo microservicio de Usuarios
app.use('/api/auth', createProxyMiddleware({
    target: 'http://ms-usuarios:8003',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/auth' },
}));

// Autores se queda igual
app.use('/api/autores', createProxyMiddleware({
    target: 'http://ms-autores:8002', 
    changeOrigin: true,
    pathRewrite: { '^/api/autores': '/autores' }, 
}));

app.listen(3000, () => console.log('Gateway Piolín listo'));