import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '/logo.png';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPublicPage, setIsPublicPage] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      // No aplicar retro-active aquí directamente, se maneja en el useEffect anterior
    } else {
      setIsLoggedIn(false);
      setUsername('');
      document.body.classList.remove('retro-active');
    }
  }, [location.pathname]); // Re-evaluar en cambio de ruta por si el token se eliminó en otra pestaña

  useEffect(() => {
    const publicPaths = ['/', '/login', '/register', '/landing'];
    setIsPublicPage(publicPaths.includes(location.pathname));

    // Aplicar 'retro-active' solo si está logueado y no es página pública
    const token = localStorage.getItem('token');
    if (token && !publicPaths.includes(location.pathname)) {
      document.body.classList.add('retro-active');
    } else {
      document.body.classList.remove('retro-active');
    }
  }, [location.pathname]); // token es dependencia para reactivar/desactivar retro-active

  useEffect(() => {
    const handleStorageChange = (event) => {
      // Solo reaccionar a cambios en 'token' o 'username'
      if (event.key === 'token' || event.key === 'username') {
        const currentToken = localStorage.getItem('token');
        const currentUsername = localStorage.getItem('username');
        if (currentToken && currentUsername) {
          setIsLoggedIn(true);
          setUsername(currentUsername);
          // La lógica de retro-active se maneja en el primer useEffect
        } else {
          setIsLoggedIn(false);
          setUsername('');
          document.body.classList.remove('retro-active'); // Asegurar que se quite si se desloguea
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // No necesita isLoggedIn como dependencia aquí

  // Cierra el menú al navegar o hacer clic fuera
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]); // Cambiado de location a location.pathname

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('.navbar-menu') && !e.target.closest('.navbar-hamburger')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    document.body.classList.remove('retro-active'); // Quitar clase al hacer logout
    window.dispatchEvent(new CustomEvent('trigger-logout-animation'));
    // Esperar a que la animación de TV termine antes de navegar
    setTimeout(() => {
      navigate('/'); // Redirigir a la landing page después del logout
    }, 2700); // Ajusta este tiempo si es necesario
  };

  const logoLinkTo = isLoggedIn && !isPublicPage ? '/home' : '/';
  const shouldApplyLoggedInMenuClass = isLoggedIn && !isPublicPage;

  return (
    <nav className="navbar-container">
      <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">
        <span className="pixel-hamburger">
          <span className="pixel-bar"></span>
          <span className="pixel-bar"></span>
          <span className="pixel-bar"></span>
        </span>
      </button>
      <ul className={`navbar-menu${menuOpen ? ' open' : ''}${shouldApplyLoggedInMenuClass ? ' logged-in' : ''}`}>
        <li className="navbar-logo-li">
          <Link to={logoLinkTo} className="navbar-logo">
            <img src={logo} className="logo" alt="Blog logo" />
          </Link>
        </li>

        {/* Contenedor para los links de la derecha (Desktop) */}
        {!menuOpen && ( // Solo mostrar en desktop si el menú no está abierto
          <div className="navbar-links-desktop">
            {isLoggedIn && !isPublicPage && (
              <>
                <li className="nav-item">
                  <Link to="/home" className="nav-links">Inicio</Link>
                </li>
                <li className="nav-item">
                  <Link to="/create" className="nav-links">Crear Post</Link>
                </li>
                <li className="nav-item username-desktop">
                  <span className="nav-links username">Bienvenido, {username}</span>
                </li>
                <li className="nav-item navbar-logout-desktop">
                  <button onClick={handleLogout} className="nav-links nav-button">Logout</button>
                </li>
              </>
            )}
            {!isLoggedIn && (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-links">Login</Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-links">Registro</Link>
                </li>
              </>
            )}
          </div>
        )}

        {/* Items para el MENÚ HAMBURGUESA ABIERTO (Mobile) */}
        {menuOpen && (
          <div className="navbar-links-mobile">
            {isLoggedIn && ( // Items para logueados en menú hamburguesa
              <>
                <li className="nav-item">
                  <Link to="/home" className="nav-links">Inicio</Link>
                </li>
                <li className="nav-item">
                  <Link to="/create" className="nav-links">Crear Post</Link>
                </li>
                <li className="nav-item username-mobile">
                  <span className="nav-links username">Bienvenido, {username}</span>
                </li>
                <li className="nav-item navbar-logout-mobile">
                  <button onClick={handleLogout} className="nav-links nav-button">Logout</button>
                </li>
              </>
            )}
            {!isLoggedIn && ( // Items para no logueados en menú hamburguesa
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-links">Login</Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-links">Registro</Link>
                </li>
              </>
            )}
          </div>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;