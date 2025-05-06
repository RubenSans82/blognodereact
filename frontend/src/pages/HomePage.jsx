import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPosts, deletePost } from '../apiClient'; // Ruta corregida

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const loggedInUserId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    if (loading || error || !listRef.current) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );
    const listItems = listRef.current.querySelectorAll('li');
    if (listItems.length > 0) {
      listItems.forEach((item) => observer.observe(item));
    }
    return () => {
      if (listRef.current) {
        const currentListItems = listRef.current.querySelectorAll('li');
        if (currentListItems.length > 0) {
          currentListItems.forEach((item) => {
            try { observer.unobserve(item); } catch (e) {}
          });
        }
      }
      observer.disconnect();
    };
  }, [posts, loading, error]);

  const handleDelete = async (postId) => {
    if (!window.confirm('¿Estás seguro de que quieres borrar este post?')) return;
    try {
      await deletePost(postId);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      console.log(`Post ${postId} borrado exitosamente.`);
    } catch (err) {
      console.error('Error borrando post:', err);
      if (err.message.includes('No autorizado') || err.message.includes('401') || err.message.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      alert(`Error al borrar el post: ${err.message}`);
    }
  };

  if (loading) return <p>Cargando posts...</p>;
  if (error) return <p>Error al cargar posts: {error}</p>;

  return (
    <div>
      <h1>Blog Posts</h1>
      <ul ref={listRef}>
        {posts.length === 0 ? (
          <p>No hay posts todavía. ¡Sé el primero en <Link to="/create">crear uno</Link>! (Necesitas iniciar sesión)</p>
        ) : (
          posts.map(post => (
            <li key={post.id}>
              <h2><Link to={`/post/${post.id}`}>{post.title}</Link></h2>
              <p>Por: {post.username} el {new Date(post.created_at).toLocaleDateString()}</p>
              {loggedInUserId && post.user_id && post.user_id.toString() === loggedInUserId && (
                <div className="post-actions" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                  <Link to={`/edit-post/${post.id}`} className="button-edit">
                    Editar
                  </Link>
                  <button onClick={() => handleDelete(post.id)} className="button-delete">
                    Borrar
                  </button>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default HomePage;