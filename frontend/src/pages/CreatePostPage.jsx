import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token'); // Obtener token

  // Efecto para redirigir si no hay token
  useEffect(() => {
    if (!token) {
      console.log("No hay token, redirigiendo a login...");
      navigate('/login'); // Redirigir a la página de login
    }
  }, [token, navigate]); // Dependencias: token y navigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!token) {
      setError("No estás autenticado.");
      setLoading(false);
      navigate('/login'); // Asegurarse de redirigir si falta el token
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Incluir el token en la cabecera Authorization
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, body })
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos (ej. 401 No autorizado, 403 Prohibido)
        if (response.status === 401 || response.status === 403) {
           localStorage.removeItem('token'); // Limpiar token inválido/expirado
           navigate('/login'); // Redirigir a login
           throw new Error(data.message || 'Token inválido o expirado. Por favor, inicia sesión de nuevo.');
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('Post creado:', data);
      // Redirigir a la página del nuevo post
      navigate(`/post/${data.postId}`);

    } catch (err) {
      console.error('Error creando post:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Si el token no existe, no renderizar el formulario (la redirección se encargará)
  // O mostrar un mensaje mientras redirige
  if (!token) {
     return <p>Necesitas iniciar sesión para crear un post. Redirigiendo...</p>;
  }

  return (
    <div>
      <h1>Crear Nuevo Post</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Título:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="body">Cuerpo:</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows="10"
            disabled={loading}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar Post'}
        </button>
      </form>
    </div>
  );
}

export default CreatePostPage;