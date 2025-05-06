import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { createPost } from '../apiClient'; // Importar createPost

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

    // El token ya se obtiene de localStorage y se verifica en el useEffect.
    // Si el token no estuviera, el useEffect ya habría redirigido.
    // Sin embargo, una comprobación adicional aquí antes de la llamada a la API es una buena práctica.
    if (!token) {
      setError("No estás autenticado. Redirigiendo a login...");
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      // Usar la función createPost del apiClient
      // Asumimos que createPost necesita el token como argumento, además de title y body.
      // Si createPost maneja internamente la obtención del token, se puede omitir aquí.
      // Revisando apiClient.js, createPost toma { title, body, token }
      const data = await createPost({ title, body, token });

      // Creación exitosa: apiClient ya parseó el JSON y manejó errores de red/servidor.
      // La respuesta 'data' debería contener la información del post creado, incluyendo su ID.
      console.log('Post creado:', data);
      
      // Redirigir a la página del nuevo post usando el postId de la respuesta
      // Asegúrate de que 'data.postId' o el campo correspondiente esté presente en la respuesta de createPost
      if (data && data.postId) {
        navigate(`/post/${data.postId}`);
      } else {
        // Esto podría indicar un problema con la respuesta de la API que apiClient no capturó como error HTTP.
        throw new Error('Respuesta de creación de post incompleta del servidor.');
      }

    } catch (err) {
      console.error('Error creando post:', err);
      // Si el error es por token inválido/expirado, apiClient.js (idealmente) ya debería haber limpiado el token.
      // Y si el error tiene una propiedad `isAuthError` (o similar) puesta por apiClient, podríamos actuar en consecuencia.
      if (err.message.includes("Token inválido") || err.message.includes("401") || err.message.includes("403")) {
        localStorage.removeItem('token'); // Asegurarse de limpiar el token
        navigate('/login'); // Redirigir a login
        setError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      } else {
        setError(err.message || 'Ocurrió un error al crear el post.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Si el token no existe, no renderizar el formulario (la redirección se encargará)
  // O mostrar un mensaje mientras redirige
  if (!token) {
     return <p>Necesitas iniciar sesión para crear un post. Redirigiendo...</p>;
  }

  // Usar Fragment <> en lugar de div y quitar estilos inline
  return (
    <>
      {/* Volver a añadir margen inferior al h1 */}
      <h1 style={{ marginBottom: '1.5rem' }}>Crear Nuevo Post</h1>
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
            // Quitar style inline
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
             // Quitar style inline
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>} {/* Mantener estilo de error por ahora */}
        <button type="submit" disabled={loading}> {/* Quitar style inline */}
          {loading ? 'Publicando...' : 'Publicar Post'}
        </button>
      </form>
    </>
  );
}

export default CreatePostPage;