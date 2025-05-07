import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '/logo.png';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

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
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('justLoggedIn');

    setIsLoggedIn(false);
    setUsername('');

    window.dispatchEvent(new Event('user-logout'));

    if (document.body.classList.contains('retro-active')) {
      window.dispatchEvent(new Event('trigger-logout-animation'));
    } else {
      navigate('/login');
    }
  };

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
  }, [isLoggedIn]);

  // Cierra el menú al navegar o hacer clic fuera
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

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

  return (
    <nav className="navbar-container">
      <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">
        {/* Icono pixelart retro: hamburguesa en píxeles */}
        <span className="pixel-hamburger">
          <span className="pixel-bar"></span>
          <span className="pixel-bar"></span>
          <span className="pixel-bar"></span>
        </span>
      </button>
      <ul className={`navbar-menu${menuOpen ? ' open' : ''}`}>
        <li className="navbar-menu-spacer"></li>
        {/* Logo solo en escritorio */}
        <li className="navbar-logo-li">
          <Link to="/" className="navbar-logo">
            <img src={logo} className="logo" alt="Blog logo" />
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/" className="nav-links">Inicio</Link>
        </li>
        {isLoggedIn ? (
          <>
            <li className="nav-item">
              <Link to="/create" className="nav-links">Crear Post</Link>
            </li>
            <li className="nav-item">
              <span className="nav-links username">Bienvenido, {username}</span>
            </li>
            <li className="nav-item navbar-logout-mobile">
              <button onClick={handleLogout} className="nav-links nav-button">Logout</button>
            </li>
          </>
        ) : (
          <>
            <li className="nav-item">
              <Link to="/login" className="nav-links">Login</Link>
            </li>
            <li className="nav-item">
              <Link to="/register" className="nav-links">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;