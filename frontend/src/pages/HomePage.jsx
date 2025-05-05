import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importar useNavigate

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const listRef = useRef(null); // Ref for the <ul> element
  const navigate = useNavigate(); // Hook para navegación
  const loggedInUserId = localStorage.getItem('userId'); // Obtener userId del usuario logueado
  const token = localStorage.getItem('token'); // Obtener token para borrar
  // REMOVE local glitch state and related useEffects
  // const [showGlitch, setShowGlitch] = useState(false);

  // REMOVE useEffect related to 'justLoggedIn'
  /*
  useEffect(() => {
    // Mostrar glitch solo si venimos de un login
    if (localStorage.getItem('justLoggedIn')) {
      setShowGlitch(true);
      setTimeout(() => {
        setShowGlitch(false);
        localStorage.removeItem('justLoggedIn');
      }, 20000); // Duración de 20 segundos
    }
  }, []);
  */

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true); // Indicar que la carga ha comenzado
      setError(null); // Limpiar errores anteriores
      try {
        const response = await fetch('http://localhost:3001/api/posts'); // URL del backend
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPosts(data); // Guardar los posts en el estado
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(err.message); // Guardar el mensaje de error
      } finally {
        setLoading(false); // Indicar que la carga ha terminado
      }
    };

    fetchPosts();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  // Effect for Intersection Observer
  useEffect(() => {
    // Don't run if loading, error occurred, or ref not attached yet
    if (loading || error || !listRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Optional: Unobserve after becoming visible to improve performance
            // observer.unobserve(entry.target);
          }
          // No fade-out logic implemented here
        });
      },
      {
        root: null, // Use the viewport as the root
        rootMargin: '0px',
        threshold: 0.1, // Trigger when 10% of the item is visible
      }
    );

    // Observe all list items within the ref'd ul
    const listItems = listRef.current.querySelectorAll('li');
    if (listItems.length > 0) {
        listItems.forEach((item) => {
          observer.observe(item);
        });
    }


    // Cleanup function
    return () => {
      // Check if listRef.current exists before trying to querySelectorAll
      if (listRef.current) {
         const currentListItems = listRef.current.querySelectorAll('li');
         if (currentListItems.length > 0) {
             currentListItems.forEach((item) => {
                // Check if observer is still tracking the item before unobserving
                try {
                    observer.unobserve(item);
                } catch (e) {
                    // Ignore errors if item was already unobserved or observer disconnected
                }
             });
         }
      }
      observer.disconnect();
    };
    // Rerun effect if posts array changes (new posts loaded) or loading state finishes
  }, [posts, loading, error]);

  // Función para manejar el borrado de un post
  const handleDelete = async (postId) => {
    if (!window.confirm('¿Estás seguro de que quieres borrar este post?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Manejar errores específicos (ej. 401, 403, 404)
        const errorData = await response.json().catch(() => ({})); // Intentar obtener datos del error
        if (response.status === 401 || response.status === 403) {
           localStorage.removeItem('token');
           localStorage.removeItem('username');
           localStorage.removeItem('userId');
           navigate('/login');
           throw new Error(errorData.message || 'No autorizado para borrar este post.');
        }
        throw new Error(errorData.message || `Error al borrar: ${response.status}`);
      }

      // Eliminar el post del estado local para actualizar la UI
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      console.log(`Post ${postId} borrado exitosamente.`);

    } catch (err) {
      console.error('Error borrando post:', err);
      // Podrías mostrar un mensaje de error al usuario aquí
      alert(`Error al borrar el post: ${err.message}`);
    }
  };

  if (loading) return <p>Cargando posts...</p>;
  if (error) return <p>Error al cargar posts: {error}</p>;

  return (
    <div>
      {/* REMOVE local glitch overlay rendering */}
      <h1>Blog Posts</h1>
      {/* Add the ref to the ul element */}
      <ul ref={listRef}>
        {posts.length === 0 ? (
          <p>No hay posts todavía. ¡Sé el primero en <Link to="/create">crear uno</Link>! (Necesitas iniciar sesión)</p>
        ) : (
          // Quitar el <ul> anidado innecesario
          posts.map(post => (
            <li key={post.id}>
              <h2><Link to={`/post/${post.id}`}>{post.title}</Link></h2>
              <p>Por: {post.username} el {new Date(post.created_at).toLocaleDateString()}</p>
              {/* Mostrar botones si el post pertenece al usuario logueado */}
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