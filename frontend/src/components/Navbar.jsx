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

  // Determinar a dónde debe enlazar el logo
  const logoLinkTo = isLoggedIn && !isPublicPage ? '/home' : '/';
  // Determinar si se deben aplicar los estilos de menú para "logged-in"
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
        <li className="navbar-menu-spacer"></li>
        {/* Logo siempre visible, enlace dinámico */}
        <li className="navbar-logo-li">
          <Link to={logoLinkTo} className="navbar-logo">
            <img src={logo} className="logo" alt="Blog logo" />
          </Link>
        </li>

        {/* Ítems para usuarios logueados y en páginas no públicas (para la barra principal) */}
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

        {/* Ítems para usuarios no logueados (para la barra principal) */}
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

         {/* Username y Logout para el MENÚ HAMBURGUESA ABIERTO */}
         {/* Estos se mostrarán solo si está logueado Y el menú está abierto */}
         {isLoggedIn && menuOpen && (
          <>
            <li className="nav-item username-mobile">
              <span className="nav-links username">Bienvenido, {username}</span>
            </li>
            <li className="nav-item navbar-logout-mobile">
              <button onClick={handleLogout} className="nav-links nav-button">Logout</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;