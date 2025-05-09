import React from 'react';
import Typewriter from '../components/Typewriter'; // Importamos el componente Typewriter

function LandingPage() {
  const welcomeText = "Bienvenido a Retro Post. Crea, comparte y revive la nostalgia.";

  return (
    // Contenedor principal: similar a LoginPage para mantener la estética
    <div
      style={{
        maxWidth: '600px', // Un poco más ancho para el texto
        margin: '2rem auto 0 auto',
        padding: '0 1rem',
        paddingTop: '6rem', // Espacio para la navbar en móvil
        textAlign: 'center', // Centrar el texto de la máquina de escribir
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '2.5rem', textShadow: '2px 2px 4px #000', fontSize: '2.5em' }}>
        Retro Post
      </h1>
      <Typewriter 
        text={welcomeText} 
        speed={100} 
        style={{
          fontSize: '1.8em',
          color: '#fff',
          textShadow: '1px 1px 3px #000',
          lineHeight: '1.6',
          minHeight: '100px' // Para evitar saltos de layout mientras escribe
        }}
      />
      {/* Podrías añadir un botón o enlace aquí si lo deseas, por ejemplo:
      <button 
        onClick={() => navigate('/login')} 
        style={{ marginTop: '2rem', padding: '10px 20px', fontSize: '1em' }}
      >
        Comenzar
      </button>
      */}
    </div>
  );
}

export default LandingPage;
