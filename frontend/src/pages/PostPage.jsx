import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import Link
import { getPostById, getPosts } from '../apiClient'; // Import getPosts
import './PostPage.css'; // Import CSS

function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [prevPost, setPrevPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);

  useEffect(() => {
    const fetchPostAndSiblings = async () => {
      setLoading(true);
      setError(null);
      setPost(null); // Reset post state
      setPrevPost(null);
      setNextPost(null);
      try {
        const postData = await getPostById(id);
        setPost(postData);

        // Fetch all posts to determine siblings
        const allPostsData = await getPosts();
        // Ensure posts are sorted, assuming they come sorted by date or ID from backend
        // If not, sort them here. For now, assuming they are sorted (e.g., by created_at DESC)
        // For this example, let's assume newer posts come first.
        // If your API returns posts in a different order (e.g., oldest first), adjust accordingly.
        const sortedPosts = allPostsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAllPosts(sortedPosts);

        const currentIdx = sortedPosts.findIndex(p => p.id === parseInt(id));
        setCurrentIndex(currentIdx);

        if (currentIdx !== -1) {
          if (currentIdx > 0) { // There is a "next" post (newer post in sorted array)
            setNextPost(sortedPosts[currentIdx - 1]);
          }
          if (currentIdx < sortedPosts.length - 1) { // There is a "previous" post (older post in sorted array)
            setPrevPost(sortedPosts[currentIdx + 1]);
          }
        }

      } catch (err) {
        if (err.message === 'Post no encontrado.') {
          setError('Post no encontrado.');
        } else {
          setError(`Error al cargar datos: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndSiblings();
  }, [id]); // Re-run when ID changes

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

      <div className="post-navigation">
        <div className="nav-button-container">
          {prevPost ? (
            <Link to={`/post/${prevPost.id}`} className="nav-button">
              &lt;&lt; Anterior
            </Link>
          ) : (
            <span className="nav-button-placeholder">&nbsp;</span> // Placeholder for alignment
          )}
          <span>{prevPost ? prevPost.title : ''}</span>
        </div>
        <div className="nav-button-container">
          {nextPost ? (
            <Link to={`/post/${nextPost.id}`} className="nav-button">
              Siguiente &gt;&gt;
            </Link>
          ) : (
            <span className="nav-button-placeholder">&nbsp;</span> // Placeholder for alignment
          )}
          <span>{nextPost ? nextPost.title : ''}</span>
        </div>
      </div>
    </>
  );
}

export default PostPage;