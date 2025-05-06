import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { registerUser } from '../apiClient'; // Importar registerUser

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
      // Usar la función registerUser del apiClient
      const data = await registerUser({ username, password });

      // Éxito
      setSuccess(data.message || '¡Registro exitoso! Redirigiendo a Login...');
      // Limpiar formulario (opcional)
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      // Redirigir a la página de login después de un breve retraso
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      console.error("Error en registro:", err);
      setError(err.message || 'Ocurrió un error durante el registro.'); // Mostrar mensaje de error
    } finally {
      setLoading(false); // Detener carga
    }
  };

  return (
    // Contenedor principal: define el ancho y centra el bloque
    <div style={{ maxWidth: '400px', margin: '2rem auto 0 auto', padding: '0 1rem' }}>
      {/* Título: Asegurar alineación izquierda */}
      <h1 style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Registro</h1>
      {/* Formulario: Asegurar alineación izquierda */}
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
            style={{ display: 'block', width: '100%', marginBottom: '1rem' }}
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
            style={{ display: 'block', width: '100%', marginBottom: '1rem' }}
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
            style={{ display: 'block', width: '100%', marginBottom: '1rem' }}
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <button type="submit" disabled={loading} style={{ display: 'block', width: '100%' }}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;