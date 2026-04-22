import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = "http://localhost:3000/api";

function App() {
  const [libros, setLibros] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user_piolin')));
  const [view, setView] = useState('home'); // home, login, upload

  // Form de Login
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  // Form de Subida
  const [libroData, setLibroData] = useState({ titulo: '', autor_id: '', visibilidad: 'publico' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchLibros();
  }, []);

  const fetchLibros = async () => {
    const token = localStorage.getItem('token_piolin');
    const headers = token ? { 'Authorization': token } : {};
    
    const res = await fetch(`${API_BASE}/libros`, { headers });
    const data = await res.json();
    setLibros(data);
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
      localStorage.setItem('user_piolin', JSON.stringify({ nombre: 'Usuario' }));
      setUser({ nombre: 'Usuario' });
      setView('home');
      fetchLibros();
    } else {
      alert(data.error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token_piolin');
    
    // USAMOS FORMDATA PARA ENVIAR EL ARCHIVO
    const formData = new FormData();
    formData.append('titulo', libroData.titulo);
    formData.append('autor_id', libroData.autor_id);
    formData.append('visibilidad', libroData.visibilidad);
    formData.append('pdf_file', file);

    const res = await fetch(`${API_BASE}/libros`, {
      method: 'POST',
      headers: { 'Authorization': token }, // NO poner Content-Type, el navegador lo hace solo con FormData
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
    setView('home');
    fetchLibros();
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
            <button onClick={() => setView('login')}>Entrar</button>
          )}
        </nav>
      </header>

      <main>
        {view === 'home' && (
          <div className="grid-libros">
            {libros.map(l => (
              <div key={l.id} className="card">
                <h3>{l.titulo}</h3>
                <p>Status: <strong>{l.visibilidad}</strong></p>
                {l.pdf_url && (
                  <a 
                    href={`http://localhost:3000/api/libros/${l.pdf_url}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-download"
                  >
                    📖 Leer / Descargar
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <h2>Identifícate</h2>
            <input type="email" placeholder="Email" onChange={e => setLoginData({...loginData, email: e.target.value})} />
            <input type="password" placeholder="Password" onChange={e => setLoginData({...loginData, password: e.target.value})} />
            <button type="submit">Entrar</button>
          </form>
        )}

        {view === 'upload' && (
          <form className="upload-form" onSubmit={handleUpload}>
            <h2>Publicar en Piolín</h2>
            <input type="text" placeholder="Título" onChange={e => setLibroData({...libroData, titulo: e.target.value})} />
            <input type="text" placeholder="ID Autor" onChange={e => setLibroData({...libroData, autor_id: e.target.value})} />
            <select onChange={e => setLibroData({...libroData, visibilidad: e.target.value})}>
              <option value="publico">Público (Todos lo ven)</option>
              <option value="privado">Privado (Solo yo)</option>
            </select>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
            <button type="submit">Subir PDF</button>
          </form>
        )}
      </main>
    </div>
  );
}

export default App;