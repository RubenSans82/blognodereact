import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function PostPage() {
  const { id } = useParams(); // Obtener el ID del post de la URL
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:3001/api/posts/${id}`); // Usar el ID en la URL
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Post no encontrado.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPost(data);
      } catch (err) {
        console.error(`Error fetching post with ID ${id}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]); // Volver a ejecutar si el ID cambia

  if (loading) return <p>Cargando post...</p>;
  // Mostrar error específico si es 404 u otro error
  if (error) return <p>Error al cargar el post: {error}</p>;
  // No necesitamos la comprobación !post aquí porque el error 404 ya se maneja

  // Check if post is null before trying to access its properties
  if (!post) {
      // This case should ideally be covered by the error handling above,
      // but it's a safeguard.
      return <p>Post no disponible.</p>;
  }

  return (
    // Mover el h1 fuera del div.post-content-wrapper
    <>
      <h1>{post.title}</h1>
      <div className="post-content-wrapper">
        {/* El título ya no está aquí */}
        <p>Por: {post.username} el {new Date(post.created_at).toLocaleDateString()}</p>
        {/* Renderizar el cuerpo. Si puede contener saltos de línea, usar white-space: pre-wrap */}
        <div style={{ whiteSpace: 'pre-wrap' }}>{post.body}</div>
      </div>
    </>
  );
}

export default PostPage;