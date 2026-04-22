const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const dbConfig = { 
    host: process.env.DB_HOST || 'mysql-db', 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'admin', 
    database: process.env.DB_NAME || 'biblioteca_relacional' 
};

const SECRET = "SECRET_KEY_PIOLIN";

// REGISTRO
app.post('/auth/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)', [nombre, email, hashedPassword]);
        await connection.end();
        res.json({ message: "Usuario registrado en Piolín con éxito" });
    } catch (err) {
        res.status(500).json({ error: "El email ya está en uso o error de DB" });
    }
});

// LOGIN (Genera el token para el Gateway)
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        await connection.end();

        if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

        const user = rows[0];
        const validPass = await bcrypt.compare(password, user.password);

        if (!validPass) return res.status(401).json({ error: "Contraseña incorrecta" });

        // Creamos el Token con el ID del usuario
        const token = jwt.sign({ id: user.id, nombre: user.nombre }, SECRET, { expiresIn: '1h' });
        
        res.json({ message: "Bienvenido a Piolín", token });
    } catch (err) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.listen(8003, () => console.log('Servicio Usuarios Piolín corriendo en puerto 8003'));