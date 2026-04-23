const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://mongo-db:27017/biblioteca_autores')
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de conexion:', err));

const AutorSchema = new mongoose.Schema({
    nombre: String,
    nacionalidad: String
});

const Autor = mongoose.model('Autor', AutorSchema);

app.get('/autores', async (req, res) => {
    try {
        const autores = await Autor.find();
        res.status(200).json(autores || []);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener autores" });
    }
});

app.post('/autores', async (req, res) => {
    try {
        const nuevoAutor = new Autor(req.body);
        await nuevoAutor.save();
        res.status(201).json({ status: 'Autor guardado exitosamente' });
    } catch (err) {
        res.status(400).json({ error: "Error al guardar autor" });
    }
});

app.listen(8002, () => console.log('Microservicio de Autores corriendo en el puerto 8002'));