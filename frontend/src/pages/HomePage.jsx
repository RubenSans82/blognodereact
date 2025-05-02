import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { Link } from 'react-router-dom';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const listRef = useRef(null); // Ref for the <ul> element

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

  if (loading) return <p>Cargando posts...</p>;
  if (error) return <p>Error al cargar posts: {error}</p>;

  return (
    <div>
      <h1>Blog Posts</h1>
      {/* Add the ref to the ul element */}
      <ul ref={listRef}>
        {posts.length === 0 ? (
          <p>No hay posts todavía. ¡Sé el primero en <Link to="/create">crear uno</Link>! (Necesitas iniciar sesión)</p>
        ) : (
          <ul>
            {posts.map(post => (
              <li key={post.id}>
                <h2><Link to={`/post/${post.id}`}>{post.title}</Link></h2>
                {/* Mostrar autor y fecha */}
                <p>Por: {post.username} el {new Date(post.created_at).toLocaleDateString()}</p>
                {/* Opcional: Mostrar un extracto del cuerpo */}
                {/* <p>{post.body.substring(0, 100)}...</p> */}
              </li>
            ))}
          </ul>
        )}
      </ul>
    </div>
  );
}

export default HomePage;