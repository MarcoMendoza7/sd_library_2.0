import React, { useState } from 'react';

const RegistroPiolin = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert("¡Usuario creado con éxito! Ahora intenta iniciar sesión.");
        // Aquí podrías limpiar el formulario o mandar al usuario al login
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error al conectar con el Gateway:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Crea tu cuenta en Piolín 🐥</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          name="nombre" 
          placeholder="Tu nombre completo" 
          onChange={handleChange} 
          required 
          style={{ padding: '8px' }}
        />
        <input 
          name="email" 
          type="email" 
          placeholder="tu@email.com" 
          onChange={handleChange} 
          required 
          style={{ padding: '8px' }}
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Contraseña segura" 
          onChange={handleChange} 
          required 
          style={{ padding: '8px' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#00bcd4', color: 'white', border: 'none', cursor: 'pointer' }}>
          Registrarme
        </button>
      </form>
    </div>
  );
};

export default RegistroPiolin;