import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = "http://localhost:3000/api";

function App() {
  const [libros, setLibros] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user_piolin')));
  const [view, setView] = useState('home'); 

  // Estado para formularios
  const [libroData, setLibroData] = useState({ 
    titulo: '', autor: '', genero: '', anio: '', visibilidad: 'publico' 
  });
  const [editMode, setEditMode] = useState(null); 
  const [file, setFile] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  useEffect(() => { fetchLibros(); }, [user]);

  const fetchLibros = async () => {
    const token = localStorage.getItem('token_piolin');
    const headers = token ? { 'Authorization': token } : {};
    try {
      const res = await fetch(`${API_BASE}/libros`, { headers });
      const data = await res.json();
      setLibros(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Error al cargar libros"); }
  };

  const handleUploadOrUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token_piolin');
    
    // FormData es necesario para enviar archivos
    const formData = new FormData();
    formData.append('titulo', libroData.titulo);
    formData.append('autor', libroData.autor);
    formData.append('genero', libroData.genero);
    formData.append('anio', libroData.anio);
    formData.append('visibilidad', libroData.visibilidad);
    
    if (file) {
      formData.append('pdf_file', file);
    }

    let url = `${API_BASE}/libros`;
    let method = 'POST';

    if (editMode) {
      // Truco: Usamos POST pero enviamos el ID en la URL para que el PHP sepa que es PUT
      url = `${API_BASE}/libros/${editMode}`;
      formData.append('_method', 'PUT'); 
    }

    const res = await fetch(url, {
      method: 'POST', // Siempre POST para que el body con archivos llegue bien
      headers: { 'Authorization': token },
      body: formData
    });

    if (res.ok) {
      alert(editMode ? "¡Libro actualizado!" : "¡Libro publicado!");
      setEditMode(null);
      setFile(null);
      setLibroData({ titulo: '', autor: '', genero: '', anio: '', visibilidad: 'publico' });
      setView('home');
      fetchLibros();
    } else {
      alert("Error al procesar la solicitud");
    }
  };

  const eliminarLibro = async (id) => {
    if (!window.confirm("¿Seguro que quieres borrar este libro?")) return;
    const res = await fetch(`${API_BASE}/libros/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': localStorage.getItem('token_piolin') }
    });
    if (res.ok) fetchLibros();
  };

  const prepararEdicion = (libro) => {
    setLibroData({ 
        titulo: libro.titulo, 
        autor: libro.autor_id, 
        genero: libro.genero, 
        anio: libro.anio, 
        visibilidad: libro.visibilidad 
    });
    setEditMode(libro.id);
    setView('upload');
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
      const sessionUser = { id: data.user?.id, nombre: data.user?.nombre || 'Usuario' };
      localStorage.setItem('user_piolin', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setView('home');
    } else { alert(data.error); }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setView('home');
  };

  return (
    <div className="App">
      <header className="navbar">
        <h1>Biblioteca Piolín 🐥</h1>
        <nav>
          <button onClick={() => { setView('home'); setEditMode(null); }}>Inicio</button>
          {user ? (
            <>
              <button onClick={() => setView('perfil')}>Mi Perfil 👤</button>
              <button onClick={() => { setView('upload'); setEditMode(null); }}>Subir Libro ➕</button>
              <button onClick={logout}>Salir ({user.nombre})</button>
            </>
          ) : (
            <button onClick={() => setView('login')}>Entrar</button>
          )}
        </nav>
      </header>

      <main className="content">
        {(view === 'home' || view === 'perfil') && (
          <div className="library-section">
            <h2>{view === 'home' ? 'Vitrina Pública' : 'Mis Libros'}</h2>
            <div className="grid-libros">
              {(view === 'home' ? libros : libros.filter(l => l.user_id == user?.id)).map(l => (
                <div key={l.id} className="card">
                  <h3>{l.titulo}</h3>
                  <div className="card-info">
                    <p><strong>👤 Autor:</strong> {l.autor_id}</p>
                    <p><strong>📑 Género:</strong> {l.genero}</p>
                    <p><strong>📅 Año:</strong> {l.anio}</p>
                    <span className={`badge ${l.visibilidad}`}>{l.visibilidad}</span>
                  </div>
                  <div className="card-actions">
                    {l.puedo_leer && (
                      <a href={`http://localhost:3000/api/libros/uploads/${l.pdf_url}`} target="_blank" rel="noreferrer" className="btn-read">Leer</a>
                    )}
                    {view === 'perfil' && (
                      <>
                        <button onClick={() => prepararEdicion(l)} className="btn-edit">Editar</button>
                        <button onClick={() => eliminarLibro(l.id)} className="btn-delete">Borrar</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {view === 'perfil' && libros.filter(l => l.user_id == user?.id).length === 0 && <p>No has subido libros aún.</p>}
            </div>
          </div>
        )}

        {view === 'upload' && (
           <form className="upload-form" onSubmit={handleUploadOrUpdate}>
             <h2>{editMode ? 'Editar Libro' : 'Subir Nuevo Libro'}</h2>
             <input type="text" placeholder="Título" value={libroData.titulo} required onChange={e => setLibroData({...libroData, titulo: e.target.value})} />
             <input type="text" placeholder="Autor" value={libroData.autor} required onChange={e => setLibroData({...libroData, autor: e.target.value})} />
             <input type="text" placeholder="Género" value={libroData.genero} required onChange={e => setLibroData({...libroData, genero: e.target.value})} />
             <input type="number" placeholder="Año" value={libroData.anio} required onChange={e => setLibroData({...libroData, anio: e.target.value})} />
             <select value={libroData.visibilidad} onChange={e => setLibroData({...libroData, visibilidad: e.target.value})}>
               <option value="publico">Público</option>
               <option value="privado">Privado</option>
             </select>
             
             <div className="file-input-container">
                <label>{editMode ? "Actualizar PDF (opcional):" : "Archivo PDF:"}</label>
                <input type="file" accept=".pdf" required={!editMode} onChange={e => setFile(e.target.files[0])} />
             </div>

             <button type="submit">{editMode ? 'Guardar Cambios' : 'Publicar'}</button>
             {editMode && <button type="button" className="btn-cancel" onClick={() => {setEditMode(null); setView('perfil');}}>Cancelar</button>}
           </form>
        )}

        {view === 'login' && (
           <form className="auth-form" onSubmit={handleLogin}>
             <h2>Entrar</h2>
             <input type="email" placeholder="Email" required onChange={e => setLoginData({...loginData, email: e.target.value})} />
             <input type="password" placeholder="Pass" required onChange={e => setLoginData({...loginData, password: e.target.value})} />
             <button type="submit">Entrar</button>
           </form>
        )}
      </main>
    </div>
  );
}

export default App;