import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = "http://localhost:3000/api";

function App() {
  const [libros, setLibros] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user_piolin')));
  const [view, setView] = useState('home'); 

  const [libroData, setLibroData] = useState({ 
    titulo: '', autor: '', genero: '', anio: '', visibilidad: 'publico' 
  });
  const [editMode, setEditMode] = useState(null); 
  const [file, setFile] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ nombre: '', email: '', password: '' });

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

  const descargarArchivo = async (pdfUrl, titulo) => {
    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${titulo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Error en la descarga, abriendo en pestaña...", err);
      window.open(pdfUrl, '_blank');
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
      alert("Cuenta creada");
      setView('login');
    } else {
      const data = await res.json();
      alert(data.error);
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
      // Guardamos nombre y email para el perfil
      const sessionUser = { 
        id: data.user?.id, 
        nombre: data.user?.nombre || 'Usuario',
        email: data.user?.email || loginData.email 
      };
      localStorage.setItem('user_piolin', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setView('home');
    } else { alert(data.error); }
  };

  const handleUploadOrUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token_piolin');
    const formData = new FormData();
    formData.append('titulo', libroData.titulo);
    formData.append('autor', libroData.autor);
    formData.append('genero', libroData.genero);
    formData.append('anio', libroData.anio);
    formData.append('visibilidad', libroData.visibilidad);
    if (file) formData.append('pdf_file', file);

    let url = `${API_BASE}/libros`;
    if (editMode) {
      url = `${API_BASE}/libros/${editMode}`;
      formData.append('_method', 'PUT'); 
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': token },
      body: formData
    });

    if (res.ok) {
      setEditMode(null);
      setFile(null);
      setLibroData({ titulo: '', autor: '', genero: '', anio: '', visibilidad: 'publico' });
      setView('home');
      fetchLibros();
    }
  };

  const eliminarLibro = async (id) => {
    if (!window.confirm("¿Seguro?")) return;
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

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setView('home');
  };

  return (
    <div className="App">
      <header className="navbar">
        <h1>
          <i className="ph-fill ph-books icon-piolin"></i>
          Biblioteca Piolín
        </h1>
        <nav className="nav-buttons">
          <button className="btn-nav" onClick={() => { setView('home'); setEditMode(null); }}>
            <i className="ph ph-house"></i> Inicio
          </button>
          {user ? (
            <>
              <button className="btn-nav" onClick={() => setView('perfil')}>
                <i className="ph ph-user"></i> Mi Perfil
              </button>
              <button className="btn-nav" onClick={() => { setView('upload'); setEditMode(null); }}>
                <i className="ph ph-upload-simple"></i> Subir Libro
              </button>
              <button className="btn-nav" onClick={logout}>
                <i className="ph ph-sign-out"></i> Salir ({user.nombre})
              </button>
            </>
          ) : (
            <>
              <button className="btn-nav" onClick={() => setView('login')}>
                <i className="ph ph-sign-in"></i> Entrar
              </button>
              <button className="btn-nav btn-primary" onClick={() => setView('register')}>
                Crear Cuenta
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="content">
        {(view === 'home' || view === 'perfil') && (
          <div className="library-section">
            
            {/* NUEVA SECCIÓN DE DATOS DEL USUARIO */}
            {view === 'perfil' && user && (
              <div className="user-data-container">
                <div className="user-data-card">
                  <h3><i className="ph-fill ph-identification-card"></i> Mis Datos Personales</h3>
                  <div className="user-field">
                    <label>Nombre</label>
                    <input type="text" value={user.nombre} readOnly />
                  </div>
                  <div className="user-field">
                    <label>Correo Electrónico</label>
                    <input type="text" value={user.email} readOnly />
                  </div>
                </div>
              </div>
            )}

            <h2 className="section-title">
              {view === 'home' ? 'Vitrina Pública' : 'Mis Libros Subidos'}
            </h2>
            
            <div className="grid-libros">
              {(view === 'home' ? libros : libros.filter(l => l.user_id === user?.id)).map(l => (
                <div key={l.id} className="card">
                  <h3>{l.titulo}</h3>
                  <div className="card-info">
                    <p><i className="ph-fill ph-user-circle"></i> {l.autor_id}</p>
                    <p><i className="ph-fill ph-bookmark-simple"></i> {l.genero}</p>
                    <p><i className="ph-fill ph-calendar-blank"></i> {l.anio}</p>
                    <span className={`badge ${l.visibilidad}`}>
                      <i className={l.visibilidad === 'publico' ? 'ph-bold ph-globe' : 'ph-bold ph-lock-key'}></i>
                      {l.visibilidad}
                    </span>
                  </div>
                  <div className="card-actions">
                    {user ? (
                      <>
                        <a 
                          href={`${API_BASE}/libros/uploads/${l.pdf_url}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn-action btn-read"
                        >
                          <i className="ph-bold ph-book-open"></i> Leer
                        </a>
                        <button 
                          onClick={() => descargarArchivo(`${API_BASE}/libros/uploads/${l.pdf_url}`, l.titulo)}
                          className="btn-action btn-download"
                        >
                          <i className="ph-bold ph-download-simple"></i> Descargar
                        </button>
                      </>
                    ) : (
                      <button className="btn-locked" onClick={() => setView('login')}>
                        <i className="ph-fill ph-lock-key"></i> Inicia sesión para leer
                      </button>
                    )}
                  </div>
                  {view === 'perfil' && (
                    <div className="admin-actions">
                      <button onClick={() => prepararEdicion(l)} className="btn-action btn-edit">
                        <i className="ph-bold ph-pencil-simple"></i> Editar
                      </button>
                      <button onClick={() => eliminarLibro(l.id)} className="btn-action btn-delete">
                        <i className="ph-bold ph-trash"></i> Borrar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'register' && (
          <div className="form-wrapper">
            <form className="auth-form" onSubmit={handleRegister}>
              <h2>Crear Cuenta</h2>
              <div className="input-group">
                <i className="ph ph-user"></i>
                <input type="text" placeholder="Nombre" required onChange={e => setRegisterData({...registerData, nombre: e.target.value})} />
              </div>
              <div className="input-group">
                <i className="ph ph-envelope-simple"></i>
                <input type="email" placeholder="Email" required onChange={e => setRegisterData({...registerData, email: e.target.value})} />
              </div>
              <div className="input-group">
                <i className="ph ph-lock-key"></i>
                <input type="password" placeholder="Password" required onChange={e => setRegisterData({...registerData, password: e.target.value})} />
              </div>
              <button type="submit" className="btn-submit">Registrarse</button>
            </form>
          </div>
        )}

        {view === 'login' && (
           <div className="form-wrapper">
             <form className="auth-form" onSubmit={handleLogin}>
               <h2>Entrar a Piolín</h2>
               <div className="input-group">
                 <i className="ph ph-envelope-simple"></i>
                 <input type="email" placeholder="Email" required onChange={e => setLoginData({...loginData, email: e.target.value})} />
               </div>
               <div className="input-group">
                 <i className="ph ph-lock-key"></i>
                 <input type="password" placeholder="Pass" required onChange={e => setLoginData({...loginData, password: e.target.value})} />
               </div>
               <button type="submit" className="btn-submit">Entrar</button>
             </form>
           </div>
        )}

        {view === 'upload' && (
           <div className="form-wrapper">
             <form className="upload-form" onSubmit={handleUploadOrUpdate}>
               <h2>{editMode ? 'Editar Libro' : 'Subir Nuevo Libro'}</h2>
               
               <div className="input-group">
                 <i className="ph ph-text-t"></i>
                 <input type="text" placeholder="Título" value={libroData.titulo} required onChange={e => setLibroData({...libroData, titulo: e.target.value})} />
               </div>
               
               <div className="input-group">
                 <i className="ph ph-user-circle"></i>
                 <input type="text" placeholder="Autor" value={libroData.autor} required onChange={e => setLibroData({...libroData, autor: e.target.value})} />
               </div>
               
               <div className="input-group">
                 <i className="ph ph-bookmark"></i>
                 <input type="text" placeholder="Género" value={libroData.genero} required onChange={e => setLibroData({...libroData, genero: e.target.value})} />
               </div>
               
               <div className="input-group">
                 <i className="ph ph-calendar"></i>
                 <input type="number" placeholder="Año" value={libroData.anio} required onChange={e => setLibroData({...libroData, anio: e.target.value})} />
               </div>
               
               <select value={libroData.visibilidad} onChange={e => setLibroData({...libroData, visibilidad: e.target.value})}>
                 <option value="publico">🌍 Público</option>
                 <option value="privado">🔒 Privado</option>
               </select>

               <div className="file-input-container">
                  <label>{editMode ? "Actualizar Archivo PDF (opcional):" : "Seleccionar Archivo PDF:"}</label>
                  <input type="file" accept=".pdf" required={!editMode} onChange={e => setFile(e.target.files[0])} />
               </div>
               
               <button type="submit" className="btn-submit">
                 {editMode ? 'Guardar Cambios' : 'Publicar Libro'}
               </button>
             </form>
           </div>
        )}
      </main>
    </div>
  );
}

export default App;