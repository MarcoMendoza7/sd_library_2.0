import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3000/api';

function App() {
  const [libros, setLibros] = useState([]);
  const [autores, setAutores] = useState([]);
  
  // States para vistas y filtros
  const [currentTab, setCurrentTab] = useState('libros'); // 'libros' | 'autores'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  // Estética
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modal y Forms
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [addingAuthor, setAddingAuthor] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Lectura
  const [readingBook, setReadingBook] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    autor_id: '',
    genero: '',
    anio: '',
    portada_url: '',
    calificacion: 0,
    contenido: ''
  });

  const [authorData, setAuthorData] = useState({ nombre: '', nacionalidad: '' });

  // Almacenar el modo oscuro en el cuerpo
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resLibros, resAutores] = await Promise.all([
        axios.get(`${API_URL}/libros`),
        axios.get(`${API_URL}/autores`)
      ]);
      setLibros(resLibros.data);
      setAutores(resAutores.data);
    } catch (error) {
      console.error("Error al cargar datos", error);
    }
  };

  const getAutorNombre = (id) => {
    const autor = autores.find(a => a._id === id || a.id === id || a.id == id);
    return autor ? autor.nombre : 'Desconocido';
  };

  // Géneros
  const categoriasUnicas = ['Todos', ...new Set(libros.map(l => l.genero).filter(g => g && g.trim() !== ''))];

  // Filtros
  const librosFiltrados = libros.filter((libro) => {
    const searchString = `${libro.titulo} ${getAutorNombre(libro.autor_id)} ${libro.genero}`.toLowerCase();
    const matchSearch = searchString.includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'Todos' || libro.genero === selectedCategory;
    return matchSearch && matchCategory;
  });

  const autoresFiltrados = autores.filter((autor) => 
    autor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (autor.nacionalidad && autor.nacionalidad.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const recientes = [...libros].reverse().slice(0, 3);

  // Handlers para Modal
  const handleOpenModal = (libro = null) => {
    setAddingAuthor(false);
    if (libro) {
      setEditMode(true);
      setCurrentId(libro.id);
      setFormData({
        titulo: libro.titulo,
        autor_id: libro.autor_id,
        genero: libro.genero || '',
        anio: libro.anio || '',
        portada_url: libro.portada_url || '',
        calificacion: libro.calificacion || 0,
        contenido: libro.contenido || ''
      });
    } else {
      setEditMode(false);
      setFormData({ titulo: '', autor_id: '', genero: '', anio: '', portada_url: '', calificacion: 0, contenido: '' });
    }
    setShowModal(true);
  };

  const handleSubmitLibro = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`${API_URL}/libros/${currentId}`, formData);
      } else {
        await axios.post(`${API_URL}/libros`, formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert("Error al procesar el libro");
    }
  };

  const handleSubmitAutor = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/autores`, authorData);
      setFormData({ ...formData, autor_id: res.data.id || res.data._id });
      setAuthorData({ nombre: '', nacionalidad: '' });
      setAddingAuthor(false);
      fetchData();
    } catch (error) {
      alert("Error al crear el autor");
    }
  };

  const deleteLibro = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este libro?")) {
      await axios.delete(`${API_URL}/libros/${id}`);
      fetchData();
    }
  };

  const deleteAutor = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar el autor? Los libros asociados a él ya no tendrán nombre.")) {
      await axios.delete(`${API_URL}/autores/${id}`);
      fetchData();
    }
  }

  // Helper para Descargar
  const downloadTxt = (libro) => {
    const textBase = libro.contenido || "El autor aún no ha cargado el contenido de esta obra.";
    const titleHeader = `TITLE: ${libro.titulo}\nAUTHOR: ${getAutorNombre(libro.autor_id)}\nYEAR: ${libro.anio || 'N/A'}\n\n`;
    const fullText = titleHeader + textBase;
    
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${libro.titulo.replace(/\s+/g, '_')}_Libro.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper para pintar estrellas
  const renderStars = (rating, interactive = false, setRating = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
          <span 
            key={i} 
            className={`star ${i <= rating ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && setRating(i)}
          >
            ★
          </span>
        );
    }
    return <div className="stars-container">{stars}</div>;
  };

  // Renderizadores
  const renderBookCard = (libro) => (
    <div className="card book-card" key={libro.id}>
      <div className="book-cover-wrapper" onClick={() => setReadingBook(libro)}>
        {libro.portada_url ? (
          <img src={libro.portada_url} alt={libro.titulo} className="book-cover" />
        ) : (
          <div className="book-cover-placeholder">📖<br/>Sin Portada</div>
        )}
      </div>
      <div className="card-content">
        <h3>{libro.titulo}</h3>
        <p className="author"><span>De:</span> {getAutorNombre(libro.autor_id)}</p>
        <div className="book-rating">
            {renderStars(libro.calificacion || 0)}
        </div>
        <div className="extra-info">
          <span className="badge">{libro.genero || 'Gral'}</span>
          <span className="year">{libro.anio || '-'}</span>
        </div>
        <button className="btn-read" onClick={() => setReadingBook(libro)}>📖 Leer Obra</button>
      </div>
      <div className="card-actions">
        <button className="btn-edit" onClick={() => handleOpenModal(libro)}>Editar</button>
        <button className="btn-delete" onClick={() => deleteLibro(libro.id)}>Eliminar</button>
      </div>
    </div>
  );

  const renderAuthorCard = (autor) => {
    const totalLibros = libros.filter(l => (l.autor_id == autor._id || l.autor_id == autor.id)).length;
    return (
      <div className="card author-card" key={autor._id || autor.id}>
        <div className="author-avatar">{autor.nombre.charAt(0).toUpperCase()}</div>
        <div className="card-content" style={{textAlign: 'center', paddingTop: '10px'}}>
          <h3>{autor.nombre}</h3>
          <p className="author-nat">🌍 {autor.nacionalidad || 'Desconocida'}</p>
          <div className="author-stats">
            <span className="badge-books">{totalLibros} Libros publicados</span>
          </div>
        </div>
        <div className="card-actions" style={{justifyContent: 'center'}}>
          <button className="btn-delete" onClick={() => deleteAutor(autor._id || autor.id)}>Eliminar</button>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">📚</span>
          <h2>BiblioTech</h2>
        </div>
        
        <div className="nav-tabs">
            <button className={`nav-tab ${currentTab === 'libros' ? 'active' : ''}`} onClick={() => setCurrentTab('libros')}>
                Catálogo de Libros
            </button>
            <button className={`nav-tab ${currentTab === 'autores' ? 'active' : ''}`} onClick={() => setCurrentTab('autores')}>
                Directorio de Autores
            </button>
        </div>

        <div className="search-box">
          <input 
            type="text" 
            placeholder={`Buscar ${currentTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Toggle Dark Mode */}
        <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} title="Cambiar Tema">
            {isDarkMode ? '☀️' : '🌙'}
        </button>

        {currentTab === 'libros' && (
            <button className="btn-primary" onClick={() => handleOpenModal()} style={{marginLeft: '15px'}}>
            + Nuevo Libro
            </button>
        )}
      </nav>

      {/* Hero Banner */}
      {!searchTerm && selectedCategory === 'Todos' && currentTab === 'libros' && (
        <div className="hero-banner">
          <div className="hero-content">
            <h1>Descubre y Construye tu Universo Literario</h1>
            <p>Explora un catálogo visual de más de {libros.length} obras literarias escritas por {autores.length} autores fascinantes alrededor del mundo. Ahora con descargas completas y modo de lectura inmersiva.</p>
          </div>
          <div className="hero-decor">✨</div>
        </div>
      )}

      {/* Categorías (Pills) */}
      {currentTab === 'libros' && (
          <div className="categories-wrapper">
            <div className="categories-scroll">
              {categoriasUnicas.map(cat => (
                <button 
                  key={cat} 
                  className={`pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
      )}

      <main className="main-content">
          
        {currentTab === 'libros' ? (
            <>
                {!searchTerm && selectedCategory === 'Todos' && recientes.length > 0 && (
                <section className="section-block">
                    <h2 className="section-title">🔥 Recién Añadidos</h2>
                    <div className="grid-container featured">
                    {recientes.map(renderBookCard)}
                    </div>
                </section>
                )}

                <section className="section-block">
                <h2 className="section-title">
                    {searchTerm ? `Resultados de búsqueda (${librosFiltrados.length})` 
                    : selectedCategory !== 'Todos' ? `Categoría: ${selectedCategory}` 
                    : 'Catálogo de Obras'}
                </h2>
                {librosFiltrados.length > 0 ? (
                    <div className="grid-container">
                    {librosFiltrados.map(renderBookCard)}
                    </div>
                ) : (
                    <div className="no-results">
                    No se encontraron libros. Sé el primero en agregarlo al acervo.
                    </div>
                )}
                </section>
            </>
        ) : (
            <section className="section-block authors-section">
                <div className="author-header-row">
                    <h2 className="section-title">Escritores Destacados ({autoresFiltrados.length})</h2>
                    <button className="btn-secondary" onClick={() => { setAddingAuthor(true); setShowModal(true); }}>
                        + Registrar Autor de forma independiente
                    </button>
                </div>
                {autoresFiltrados.length > 0 ? (
                    <div className="grid-container author-grid">
                        {autoresFiltrados.map(renderAuthorCard)}
                    </div>
                ) : (
                    <div className="no-results">
                    No hay autores registrados.
                    </div>
                )}
            </section>
        )}
      </main>

      {/* Modal de LECTURA */}
      {readingBook && (
        <div className="modal-overlay">
          <div className="modal-content reading-modal">
            <button className="btn-close-reading" onClick={() => setReadingBook(null)}>✖</button>
            <div className="reading-header">
                <h2>{readingBook.titulo}</h2>
                <p className="author">De: {getAutorNombre(readingBook.autor_id)}</p>
                <button className="btn-download" onClick={() => downloadTxt(readingBook)}>⬇️ Descargar (.txt)</button>
            </div>
            
            <div className="reading-body">
                {readingBook.contenido ? (
                    <p>{readingBook.contenido}</p>
                ) : (
                    <div className="no-text-warning">
                        ⚠️ Esta obra todavía no tiene su texto subido al sistema. Si tienes derechos de edición, puedes agregarlo al editar este libro.
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Reutilizable para Libros y Autores */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            {!addingAuthor ? (
              <>
                <h2>{editMode ? '✍️ Editar Obra Literaria' : '📘 Ingresar Nueva Obra'}</h2>
                <form onSubmit={handleSubmitLibro}>
                  <div className="form-group">
                    <label>Título del Libro *</label>
                    <input 
                      type="text" 
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                        <label>Autor *</label>
                        <div className="select-row">
                        <select 
                            value={formData.autor_id}
                            onChange={(e) => setFormData({...formData, autor_id: e.target.value})}
                            required
                        >
                            <option value="">-- Selecciona un autor --</option>
                            {autores.map(a => (
                            <option key={a._id || a.id} value={a._id || a.id}>{a.nombre}</option>
                            ))}
                        </select>
                        <button type="button" className="btn-add-small" onClick={() => setAddingAuthor(true)} title="Nuevo Autor">+</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Calificación Inicial (Estrellas)</label>
                        <div className="rating-selector">
                            {renderStars(formData.calificacion, true, (val) => setFormData({...formData, calificacion: val}))}
                        </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Género Literario</label>
                      <select 
                        value={formData.genero}
                        onChange={(e) => setFormData({...formData, genero: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'inherit' }}
                      >
                        <option value="">-- Selecciona Categoría --</option>
                        <option value="Novela">Novela</option>
                        <option value="Cuento">Cuento</option>
                        <option value="Ciencia Ficción">Ciencia Ficción</option>
                        <option value="Fantasía">Fantasía</option>
                        <option value="Misterio">Misterio</option>
                        <option value="Romance">Romance</option>
                        <option value="Terror">Terror</option>
                        <option value="Ensayo">Ensayo</option>
                        <option value="Biografía">Biografía</option>
                        <option value="Poesía">Poesía</option>
                        <option value="Historia">Historia</option>
                        <option value="Ficción">Ficción</option>
                        <option value="Realismo mágico">Realismo mágico</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Año de Publicación</label>
                      <input type="number" placeholder="Ej. 1995" value={formData.anio} onChange={(e) => setFormData({...formData, anio: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>URL de Portada (Imagen web)</label>
                    <input 
                      type="url" 
                      placeholder="https://ejemplo.com/imagen.jpg" 
                      value={formData.portada_url}
                      onChange={(e) => setFormData({...formData, portada_url: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Contenido del Libro (Texto Completo)</label>
                    <textarea 
                      className="text-area-content"
                      placeholder="Pega aquí el texto, capítulos o sinopsis de la obra entera..." 
                      value={formData.contenido}
                      onChange={(e) => setFormData({...formData, contenido: e.target.value})}
                      rows="6"
                    ></textarea>
                  </div>

                  <div className="modal-buttons">
                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                    <button type="submit" className="btn-save">Guardar Libro</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2>👥 Registrar Nuevo Escritor</h2>
                <form onSubmit={handleSubmitAutor}>
                  <div className="form-group">
                    <label>Nombre Completo *</label>
                    <input 
                      type="text" 
                      placeholder="Ej: J.K. Rowling"
                      value={authorData.nombre}
                      onChange={(e) => setAuthorData({...authorData, nombre: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Nacionalidad</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Británica"
                      value={authorData.nacionalidad}
                      onChange={(e) => setAuthorData({...authorData, nacionalidad: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="modal-buttons">
                    {currentTab === 'libros' ? (
                        <button type="button" className="btn-cancel" onClick={() => setAddingAuthor(false)}>Volver al Libro</button>
                    ) : (
                        <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                    )}
                    <button type="submit" className="btn-save">Crear Escritor</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;