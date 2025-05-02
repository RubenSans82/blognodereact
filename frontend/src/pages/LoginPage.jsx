import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Estado de carga
  const navigate = useNavigate(); // Hook para navegación

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true); // Iniciar carga

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Usar mensaje de error del backend
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Login exitoso: guardar token y redirigir
      if (data.token) {
        localStorage.setItem('token', data.token); // Guardar token en localStorage
        // Guardar también el nombre de usuario
        localStorage.setItem('username', username);
        // Opcional: Actualizar estado global de autenticación si usas Context o Redux
        console.log('Login exitoso, token y username guardados.');
        navigate('/'); // Redirigir a la página principal
      } else {
        // Si no hay token en la respuesta (aunque la respuesta sea 200 OK)
        throw new Error('No se recibió token del servidor.');
      }

    } catch (err) {
      console.error("Error en login:", err);
      setError(err.message); // Mostrar error al usuario
    } finally {
      setLoading(false); // Detener carga
    }
  };

  return (
    <div style={{ textAlign: 'center' }}> {/* Add text-align center here */}
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Usuario:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading} // Deshabilitar mientras carga
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;