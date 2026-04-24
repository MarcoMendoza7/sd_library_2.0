import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = "http://localhost:3000/api";

function App() {
  const [libros, setLibros] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user_piolin')));
  const [view, setView] = useState('home'); // home, login, register, upload

  // Forms Data
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ nombre: '', email: '', password: '' });
  const [libroData, setLibroData] = useState({ titulo: '', autor_id: '', visibilidad: 'publico' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (user) {
      fetchLibros();
    }
  }, [user]);

  const fetchLibros = async () => {
    const token = localStorage.getItem('token_piolin');
    const headers = token ? { 'Authorization': token } : {};
    try {
      const res = await fetch(`${API_BASE}/libros`, { headers });
      const data = await res.json();
      setLibros(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al obtener libros:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token_piolin', data.token);
      const sessionUser = { nombre: data.user?.nombre || 'Usuario' };
      localStorage.setItem('user_piolin', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setView('home');
    } else {
      alert(data.error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });
    if (res.ok) {
      alert("¡Cuenta creada! Ya puedes iniciar sesión.");
      setView('login');
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token_piolin');
    const formData = new FormData();
    formData.append('titulo', libroData.titulo);
    formData.append('autor_id', libroData.autor_id);
    formData.append('visibilidad', libroData.visibilidad);
    formData.append('pdf_file', file);

    const res = await fetch(`${API_BASE}/libros`, {
      method: 'POST',
      headers: { 'Authorization': token },
      body: formData
    });

    if (res.ok) {
      alert("¡Libro subido a Piolín!");
      setView('home');
      fetchLibros();
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setLibros([]);
    setView('home');
  };

  return (
    <div className="App">
      <header className="navbar">
        <h1>Biblioteca Piolín 🐥</h1>
        <nav>
          <button onClick={() => setView('home')}>Inicio</button>
          {user ? (
            <>
              <button onClick={() => setView('upload')}>Subir Libro</button>
              <button onClick={logout}>Salir ({user.nombre})</button>
            </>
          ) : (
            <>
              <button onClick={() => setView('login')}>Entrar</button>
              <button onClick={() => setView('register')}>Crear Cuenta</button>
            </>
          )}
        </nav>
      </header>

      <main className="content">
        {/* VISTA HOME - VISITANTE */}
        {view === 'home' && !user && (
          <div className="welcome-hero">
            <h2>Bienvenido a la Biblioteca Distribuida</h2>
            <p>Identifícate para gestionar y visualizar la colección de libros disponibles.</p>
            <div className="hero-btns">
              <button onClick={() => setView('login')}>Iniciar Sesión</button>
              <button onClick={() => setView('register')} className="btn-alt">Registrarse</button>
            </div>
          </div>
        )}

        {/* VISTA HOME - LOGUEADO (TARJETAS) */}
        {view === 'home' && user && (
          <div className="library-section">
            <h2>Tus Libros</h2>
            <div className="grid-libros">
              {libros.length > 0 ? libros.map(l => (
                <div key={l.id} className="card">
                  <h3>{l.titulo}</h3>
                  <div className="card-info">
                    <p><strong>👤 Autor ID:</strong> {l.autor_id || 'N/A'}</p>
                    <p><strong>📅 Publicación:</strong> {l.anio || '2024'}</p>
                    <p><strong>📑 Género:</strong> {l.genero || 'Literatura'}</p>
                    <span className={`badge ${l.visibilidad}`}>{l.visibilidad}</span>
                  </div>
                  {l.pdf_url && (
                    <a href={`http://localhost:3000/api/libros/${l.pdf_url}`} target="_blank" rel="noreferrer" className="btn-read">
                      📖 Leer PDF
                    </a>
                  )}
                </div>
              )) : <p>No hay libros para mostrar.</p>}
            </div>
          </div>
        )}

        {/* VISTA LOGIN */}
        {view === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <h2>Identifícate</h2>
            <input type="email" placeholder="Email" required onChange={e => setLoginData({...loginData, email: e.target.value})} />
            <input type="password" placeholder="Contraseña" required onChange={e => setLoginData({...loginData, password: e.target.value})} />
            <button type="submit">Entrar</button>
            <p onClick={() => setView('register')} className="switch-auth">¿No tienes cuenta? Crea una aquí</p>
          </form>
        )}

        {/* VISTA REGISTER */}
        {view === 'register' && (
          <form className="auth-form" onSubmit={handleRegister}>
            <h2>Nueva Cuenta</h2>
            <input type="text" placeholder="Nombre completo" required onChange={e => setRegisterData({...registerData, nombre: e.target.value})} />
            <input type="email" placeholder="Email" required onChange={e => setRegisterData({...registerData, email: e.target.value})} />
            <input type="password" placeholder="Contraseña" required onChange={e => setRegisterData({...registerData, password: e.target.value})} />
            <button type="submit">Registrarme</button>
            <p onClick={() => setView('login')} className="switch-auth">¿Ya tienes cuenta? Inicia sesión</p>
          </form>
        )}

        {/* VISTA UPLOAD */}
        {view === 'upload' && (
          <form className="upload-form" onSubmit={handleUpload}>
            <h2>Subir nuevo PDF</h2>
            <input type="text" placeholder="Título" required onChange={e => setLibroData({...libroData, titulo: e.target.value})} />
            <input type="text" placeholder="ID Autor" required onChange={e => setLibroData({...libroData, autor_id: e.target.value})} />
            <select onChange={e => setLibroData({...libroData, visibilidad: e.target.value})}>
              <option value="publico">Público</option>
              <option value="privado">Privado</option>
            </select>
            <input type="file" accept=".pdf" required onChange={e => setFile(e.target.files[0])} />
            <button type="submit">Publicar Libro</button>
          </form>
        )}
      </main>
    </div>
  );
}

export default App;