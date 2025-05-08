import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPostById } from '../apiClient'; // Ruta corregida

function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPostById(id);
        setPost(data);
      } catch (err) {
        if (err.message === 'Post no encontrado.') {
          setError('Post no encontrado.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) return <p>Cargando post...</p>;
  if (error) return <p>Error al cargar el post: {error}</p>;
  if (!post) return <p>Post no disponible.</p>;

  return (
    <>
      <h1>{post.title}</h1>
      <div className="post-content-wrapper">
        <p>Por: {post.username} el {new Date(post.created_at).toLocaleDateString()}</p>
        {post.image_url && (
          <div style={{ margin: '1rem 0' }}>
            <img
              src={post.image_url.startsWith('http') ? post.image_url : `https://apiblog-n914.onrender.com${post.image_url}`}
              alt="Imagen del post"
              style={{ maxWidth: 350, border: '2px solid #e100ff', boxShadow: '0 0 8px #00f6ff' }}
            />
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap' }}>{post.body}</div>
      </div>
    </>
  );
}

export default PostPage;