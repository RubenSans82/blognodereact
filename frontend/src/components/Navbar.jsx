import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '/logo.png';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  // Ya no se necesita isLoggingOut ni showOverlayActive aquí, se maneja en App.jsx

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      document.body.classList.add('retro-active');
    } else {
      setIsLoggedIn(false);
      setUsername('');
      document.body.classList.remove('retro-active');
    }
  }, [location]); // isLoggedIn se quita de las dependencias para evitar re-renders innecesarios
                // o bucles si la lógica de login/logout también afecta a `location` indirectamente.

  const handleLogout = () => {
    // 1. Limpiar datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('justLoggedIn'); // Limpiar también este flag

    // 2. Actualizar estado local para reflejar el logout
    setIsLoggedIn(false);
    setUsername('');

    // 3. Opcional: Notificar a otras partes de la app si es necesario
    window.dispatchEvent(new Event('user-logout')); // Evento genérico de logout

    // 4. Disparar evento para la animación de apagado en App.jsx
    // Asegurarse que el modo retro está activo para la animación
    if (document.body.classList.contains('retro-active')) {
      window.dispatchEvent(new Event('trigger-logout-animation'));
    } else {
      // Si no hay modo retro, simplemente navegar
      navigate('/login');
    }
    // La navegación a /login ahora la maneja App.jsx después de la animación
  };

  // Listener para actualizar el estado de login si cambia por otra pestaña/ventana
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      const storedUsername = localStorage.getItem('username');
      if (token && storedUsername) {
        if (!isLoggedIn) {
          setIsLoggedIn(true);
          setUsername(storedUsername);
          document.body.classList.add('retro-active');
        }
      } else {
        if (isLoggedIn) {
          setIsLoggedIn(false);
          setUsername('');
          document.body.classList.remove('retro-active');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isLoggedIn]); // Depende de isLoggedIn para evitar setting innecesario

  return (
    <nav className="navbar-container">
      <ul>
        <div className="nav-left">
          <li>
            <Link to="/" className="navbar-logo">
              <img src={logo} className="logo" alt="Blog logo" />
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/" className="nav-links">
              Inicio
            </Link>
          </li>
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <>
              <li className="nav-item">
                <Link to="/create" className="nav-links">
                  Crear Post
                </Link>
              </li>
              <li className="nav-item">
                <span className="nav-links username">Bienvenido, {username}</span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-links nav-button">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-links">
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-links">
                  Register
                </Link>
              </li>
            </>
          )}
        </div>
      </ul>
    </nav>
    // El overlay de logout ya no se renderiza aquí, se maneja en App.jsx
  );
}

export default Navbar;