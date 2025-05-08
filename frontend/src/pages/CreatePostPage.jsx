import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { createPost, uploadImage } from '../apiClient'; // Importar createPost y uploadImage

function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token'); // Obtener token

  // Efecto para redirigir si no hay token
  useEffect(() => {
    if (!token) {
      console.log("No hay token, redirigiendo a login...");
      navigate('/login'); // Redirigir a la página de login
    }
  }, [token, navigate]); // Dependencias: token y navigate

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!imageFile) {
      setError('Debes seleccionar una imagen.');
      setLoading(false);
      return;
    }
    if (!token) {
      setError("No estás autenticado. Redirigiendo a login...");
      setLoading(false);
      navigate('/login');
      return;
    }
    try {
      // Subir imagen primero
      const imgRes = await uploadImage(imageFile);
      if (!imgRes.url) throw new Error('No se pudo procesar la imagen.');
      // Crear post con la URL de la imagen
      const data = await createPost({ title, body, image_url: imgRes.url, token });
      if (data && data.postId) {
        navigate(`/post/${data.postId}`);
      } else {
        throw new Error('Respuesta de creación de post incompleta del servidor.');
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al crear el post.');
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
        <div>
          <label htmlFor="image">Imagen (obligatoria):</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
            required
          />
        </div>
        {imagePreview && (
          <div style={{ margin: '1rem 0' }}>
            <p>Previsualización:</p>
            <img src={imagePreview} alt="Previsualización" style={{ maxWidth: 200, border: '2px solid #e100ff', boxShadow: '0 0 8px #00f6ff' }} />
          </div>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar Post'}
        </button>
      </form>
    </>
  );
}

export default CreatePostPage;