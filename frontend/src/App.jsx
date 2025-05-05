import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  // Estado global para el glitch, inicializado según el token
  const [showGlitch, setShowGlitch] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    // Función para mostrar el glitch
    const handleShowGlitch = () => setShowGlitch(true);
    // Función para ocultar el glitch
    const handleHideGlitch = () => setShowGlitch(false);

    // Escuchar eventos personalizados
    window.addEventListener('show-glitch', handleShowGlitch);
    window.addEventListener('hide-glitch', handleHideGlitch);

    // Limpiar listeners al desmontar
    return () => {
      window.removeEventListener('show-glitch', handleShowGlitch);
      window.removeEventListener('hide-glitch', handleHideGlitch);
    };
  }, []); // Solo se ejecuta una vez al montar

  return (
    <>
      {showGlitch && (
        <div className="glitch-overlay glitch-fade">
          {[...Array(64)].map((_, i) => (
            <div key={i} className="glitch-line" style={{ top: `${i * 1.5625}%` }}></div>
          ))}
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
