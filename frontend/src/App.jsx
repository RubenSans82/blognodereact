import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [showGlitch, setShowGlitch] = useState(() => Boolean(localStorage.getItem('token')));
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleShowGlitch = () => setShowGlitch(true);
    const handleHideGlitch = () => setShowGlitch(false);
    window.addEventListener('show-glitch', handleShowGlitch);
    window.addEventListener('hide-glitch', handleHideGlitch);

    const handleTriggerLoginAnimation = () => {
      setShowLoginAnimation(true);
      setTimeout(() => {
        setShowLoginAnimation(false);
        setShowGlitch(true); // <-- AHORA SE ACTIVA AQUÍ, DESPUÉS DE 1.5s
      }, 1500); // Duración de la animación tv-turn-on
    };
    window.addEventListener('login-success-animation', handleTriggerLoginAnimation);

    const handleTriggerLogoutAnimation = () => {
      setShowGlitch(false); // <-- AÑADIDO: Desactivar glitch global al iniciar animación de logout
      setShowLogoutAnimation(true);
      setTimeout(() => {
        setShowLogoutAnimation(false);
        navigate('/login');
      }, 2700);
    };
    window.addEventListener('trigger-logout-animation', handleTriggerLogoutAnimation);

    return () => {
      window.removeEventListener('show-glitch', handleShowGlitch);
      window.removeEventListener('hide-glitch', handleHideGlitch);
      window.removeEventListener('login-success-animation', handleTriggerLoginAnimation);
      window.removeEventListener('trigger-logout-animation', handleTriggerLogoutAnimation);
    };
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/landing') {
      document.body.classList.add('login-bg');
      document.body.classList.remove('main-bg');
    } else {
      document.body.classList.add('main-bg');
      document.body.classList.remove('login-bg');
    }
    // Limpieza al desmontar
    return () => {
      document.body.classList.remove('login-bg');
      document.body.classList.remove('main-bg');
    };
  }, [location.pathname]);

  return (
    <>
      {showGlitch && (
        <div className="glitch-overlay glitch-fade">
          {[...Array(64)].map((_, i) => (
            <div key={i} className="glitch-line" style={{ top: `${i * 1.5625}%` }}></div>
          ))}
        </div>
      )}

      {showLoginAnimation && (
        <div className="login-overlay active">
          <div className="tv-line-on"></div>
        </div>
      )}

      {showLogoutAnimation && (
        <div className="logout-overlay active">
          <div className="tv-line"></div>
        </div>
      )}

      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default App;
