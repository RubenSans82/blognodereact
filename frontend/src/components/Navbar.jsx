import React, { useState, useEffect } from 'react';
// Importar useLocation
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '/logo.png'; // Import the logo

function Navbar() {
  const navigate = useNavigate();
  // Obtener el objeto location
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  // Estado para controlar la animación de logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showOverlayActive, setShowOverlayActive] = useState(false); // Nuevo estado

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    } else {
      setIsLoggedIn(false);
      setUsername('');
    }
    // Añadir location al array de dependencias
    // Resetear animación si cambiamos de ruta mientras está activa (poco probable)
    setIsLoggingOut(false);
    setShowOverlayActive(false); // Resetear overlay al cambiar de ruta
  }, [location]);

  const handleLogout = () => {
    // Ocultar glitch INMEDIATAMENTE al hacer click
    window.dispatchEvent(new Event('hide-glitch'));

    // Iniciar la animación de logout
    setIsLoggingOut(true);
    setTimeout(() => {
      setShowOverlayActive(true); // Activar el fade-in del overlay negro
    }, 0);

    // Esperar a que termine la animación para limpiar y redirigir
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      setIsLoggedIn(false);
      setUsername('');
      // Notificar logout globalmente (si es necesario para otras partes)
      window.dispatchEvent(new Event('user-logout'));
      navigate('/login');
    }, 2700); // Duración total de la animación
  };

  return (
    <> {/* Usar Fragment para envolver nav y overlay */}
      <nav className="navbar-container">
        <ul>
          {/* Left group: Logo and Home */}
          <div className="nav-left">
            <li> {/* Wrap logo Link in li for semantic correctness */}
              <Link to="/" className="navbar-logo">
                <img src={logo} className="logo" alt="Blog logo" /> {/* Use img tag */}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/" className="nav-links">
                Inicio
              </Link>
            </li>
          </div>

          {/* Right group: Conditional links */}
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
                  {/* Asegurarse que el botón llama a la nueva función handleLogout */}
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

      {/* Overlay de Logout (se muestra condicionalmente) */}
      {isLoggingOut && (
        <div className={`logout-overlay${showOverlayActive ? ' active' : ''}`}>
          {showOverlayActive && (
            <div
              className="tv-line"
              style={{ opacity: 0, animation: "tv-shutdown-enhanced 2s linear forwards", animationDelay: "0.7s" }}
            ></div>
          )}
        </div>
      )}
    </>
  );
}

export default Navbar;