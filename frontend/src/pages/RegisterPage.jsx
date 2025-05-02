import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false); // Estado para indicar carga
  const navigate = useNavigate(); // Hook para la navegación

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true); // Iniciar carga

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false); // Detener carga
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Usar el mensaje de error del backend si está disponible
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Éxito
      setSuccess('¡Registro exitoso! Redirigiendo a Login...');
      // Limpiar formulario (opcional)
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      // Redirigir a la página de login después de un breve retraso
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      console.error("Error en registro:", err);
      setError(err.message); // Mostrar mensaje de error
    } finally {
      setLoading(false); // Detener carga
    }
  };

  return (
    <div>
      <h1>Registro</h1>
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
        <div>
          <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;