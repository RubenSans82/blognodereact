const BASE_URL = 'https://apiblog-n914.onrender.com/api'; // Tu URL base de Render

// Función genérica para realizar peticiones
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token'); // Asumimos que guardas el token en localStorage

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      // Intentar parsear el error del backend si existe
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    // Si la respuesta no tiene contenido (ej. DELETE), devolver un objeto vacío o un indicador de éxito
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return {}; // O podrías devolver algo como { success: true }
    }
    return await response.json(); // Parsear JSON solo si hay contenido
  } catch (error) {
    console.error(`API request error to ${endpoint}:`, error);
    throw error; // Re-lanzar el error para que el componente lo maneje
  }
}

// --- Funciones de Autenticación ---
export const loginUser = (credentials) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
});

export const registerUser = (userData) => request('/auth/register', {
  method: 'POST',
  body: JSON.stringify(userData),
});

// --- Funciones de Posts ---
export const getPosts = () => request('/posts');

export const getPostById = (postId) => request(`/posts/${postId}`);

export const createPost = (postData) => request('/posts', {
  method: 'POST',
  body: JSON.stringify(postData),
});

export const updatePost = (postId, postData) => request(`/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
});

export const deletePost = (postId) => request(`/posts/${postId}`, {
  method: 'DELETE',
});

// Subida de imagen al backend
export const uploadImage = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', file);
  const response = await fetch(`${BASE_URL}/upload-image`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  return await response.json();
};

// Puedes añadir más funciones aquí para comentarios, usuarios, etc.
// Ejemplo:
// export const getCommentsByPostId = (postId) => request(`/posts/${postId}/comments`);
// export const createComment = (postId, commentData) => request(`/posts/${postId}/comments`, {
// method: 'POST',
// body: JSON.stringify(commentData),
// });
