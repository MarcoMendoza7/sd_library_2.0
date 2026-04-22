const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Usamos un POOL para manejar múltiples conexiones de forma eficiente
const pool = mysql.createPool({ 
    host: process.env.DB_HOST || 'mysql-db', 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'admin', 
    database: process.env.DB_NAME || 'biblioteca_relacional',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const SECRET = "SECRET_KEY_PIOLIN";

// REGISTRO
app.post('/auth/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Usamos el pool directamente
        await pool.execute(
            'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)', 
            [nombre, email, hashedPassword]
        );
        res.status(201).json({ message: "Usuario registrado en Piolín con éxito" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "El email ya está en uso o error de DB" });
    }
});

// LOGIN
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const user = rows[0];
        const validPass = await bcrypt.compare(password, user.password);

        if (!validPass) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // Generar Token
        const token = jwt.sign(
            { id: user.id, nombre: user.nombre, email: user.email }, 
            SECRET, 
            { expiresIn: '1h' }
        );
        
        res.json({ 
            message: "Bienvenido a Piolín", 
            token,
            user: { id: user.id, nombre: user.nombre } // Enviamos info básica al front
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.listen(8003, () => console.log('Servicio Usuarios Piolín corriendo en puerto 8003'));