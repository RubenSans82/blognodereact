import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById, updatePost, uploadImage } from '../apiClient';

function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPostById(id);
        setTitle(data.title);
        setBody(data.body);
        setImageUrl(data.image_url || '');
      } catch (err) {
        setError('No se pudo cargar el post.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    let finalImageUrl = imageUrl;
    try {
      if (newImageFile) {
        setUploading(true);
        const uploadResult = await uploadImage(newImageFile);
        finalImageUrl = uploadResult.url;
        setUploading(false);
      }
      await updatePost(id, { title, body, image_url: finalImageUrl });
      navigate(`/post/${id}`);
    } catch (err) {
      setError('No se pudo guardar el post.');
      setUploading(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando post...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <h1>Editar Post</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Título:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            disabled={saving}
            style={{ width: '100%', marginBottom: '1rem' }}
          />
        </div>
        <div>
          <label htmlFor="body">Cuerpo:</label>
          <textarea
            id="body"
            value={body}
            onChange={e => setBody(e.target.value)}
            required
            rows={10}
            disabled={saving}
            style={{ width: '100%', marginBottom: '1rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Imagen actual:</label><br />
          {imageUrl ? (
            <img src={imageUrl} alt="Imagen del post" style={{ maxWidth: '100%', maxHeight: 200 }} />
          ) : (
            <span>No hay imagen</span>
          )}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="image">Nueva imagen (opcional):</label>
          <input type="file" id="image" accept="image/*" onChange={handleImageChange} disabled={saving || uploading} />
          {uploading && <span> Subiendo imagen...</span>}
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
      </form>
    </div>
  );
}

export default EditPostPage;
