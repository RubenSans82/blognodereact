import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPosts, deletePost } from '../apiClient';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const loggedInUserId = localStorage.getItem('userId');
  const isLoggedIn = !!localStorage.getItem('token');

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

  const handleDeleteClick = (postId) => {
    setPostToDelete(postId);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await deletePost(postToDelete);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete));
      setShowModal(false);
      setPostToDelete(null);
    } catch (err) {
      console.error('Error borrando post:', err);
      if (err.message.includes('No autorizado') || err.message.includes('401') || err.message.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      alert(`Error al borrar el post: ${err.message}`);
      setShowModal(false);
      setPostToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowModal(false);
    setPostToDelete(null);
  };

  // Redirigir a login si no está loggeado
  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  if (loading) return <p>Cargando posts...</p>;
  if (error) return <p>Error al cargar posts: {error}</p>;

  return (
    <div>
      <h1>Blog Posts</h1>
      {/* Modal personalizado para confirmar borrado */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface-color)', color: 'cyan', padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 16px rgba(0,0,0,0.2)', minWidth: 300,
            textAlign: 'center', maxWidth: '90vw', border: '3px solid magenta'
          }}>
            <h2 style={{marginBottom: '1rem', color: 'cyan'}}>¿Borrar post?</h2>
            <p style={{marginBottom: '2rem', color: 'cyan'}}>¿Estás seguro de que quieres borrar este post? Esta acción no se puede deshacer.</p>
            <button onClick={handleConfirmDelete} style={{background: '#e74c3c', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '5px', marginRight: '1rem', cursor: 'pointer'}}>Borrar</button>
            <button onClick={handleCancelDelete} style={{
              background: 'cyan',
              color: 'magenta',
              border: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '5px',
              cursor: 'pointer',
            }}>Cancelar</button>
          </div>
        </div>
      )}
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
                  <button onClick={() => handleDeleteClick(post.id)} className="button-delete">
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