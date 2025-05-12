import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../apiClient'; // Ruta corregida

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Usar la función loginUser del apiClient
      const data = await loginUser({ username, password });

      // Login exitoso: apiClient ya parseó el JSON y manejó errores de red.
      // El token y userId deberían estar en 'data' directamente.
      if (data && data.token && data.userId) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username); // Guardar el nombre de usuario
        window.dispatchEvent(new CustomEvent('login-success-animation'));
        window.dispatchEvent(new Event('storage')); // Notificar a Navbar
        // Esperar a que la animación de TV termine antes de navegar
        setTimeout(() => {
          navigate('/home'); // MODIFICADO: Redirigir a /home después del login
        }, 2700); // Ajusta este tiempo si es necesario
      } else {
        // Si falta token o userId en la respuesta (aunque apiClient debería haber lanzado un error si la respuesta no fue ok)
        throw new Error(data.message || 'Respuesta de login incompleta del servidor.');
      }

    } catch (err) {
      console.error("Error en login:", err);
      setError(err.message); // Mostrar error al usuario
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor principal: define el ancho y centra el bloque
    <div
      style={{
        maxWidth: '400px',
        margin: '2rem auto 0 auto',
        padding: '0 1rem',
        paddingTop: '6rem', // Espacio para la navbar en móvil
      }}
    >
      {/* Título: Asegurar alineación izquierda (por defecto en h1) */}
      <h1 style={{ textAlign: 'left', marginBottom: '1.5rem', textShadow: '1px 1px 2px #000' }}>Login</h1>
      {/* Formulario: Asegurar alineación izquierda (por defecto en form) */}
      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <div>
          <label htmlFor="username" style={{ textShadow: '1px 1px 2px #000' }}>Usuario:</label>
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
          <label htmlFor="password" style={{ textShadow: '1px 1px 2px #000' }}>Contraseña:</label>
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
          {loading ? 'Iniciando sesión...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;