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

      // Login exitoso: guardar token, username y userId
      if (data.token && data.userId) { // Asegurarse que userId viene en la respuesta
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        localStorage.setItem('userId', data.userId.toString());
        // Flag para mostrar glitch en HomePage
        localStorage.setItem('justLoggedIn', '1');
        console.log('Login exitoso, token, username y userId guardados.');
        
        // Lanzar evento para mostrar el glitch globalmente
        window.dispatchEvent(new Event('show-glitch'));

        navigate('/'); // Redirigir a la página principal
      } else {
        // Si falta token o userId en la respuesta
        throw new Error('Respuesta de login incompleta del servidor.');
      }

    } catch (err) {
      console.error("Error en login:", err);
      setError(err.message); // Mostrar error al usuario
    } finally {
      setLoading(false); // Detener carga
    }
  };

  return (
    // Contenedor principal: define el ancho y centra el bloque
    <div style={{ maxWidth: '400px', margin: '2rem auto 0 auto', padding: '0 1rem' }}>
      {/* Título: Asegurar alineación izquierda (por defecto en h1) */}
      <h1 style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Login</h1>
      {/* Formulario: Asegurar alineación izquierda (por defecto en form) */}
      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <div>
          <label htmlFor="username">Usuario:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading} // Deshabilitar mientras carga
            style={{ display: 'block', width: '100%', marginBottom: '1rem' }} // Estilos para inputs
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
            style={{ display: 'block', width: '100%', marginBottom: '1rem' }} // Estilos para inputs
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ display: 'block', width: '100%' }}> {/* Botón ancho completo */}
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;