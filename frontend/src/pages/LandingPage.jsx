import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import Typewriter from '../components/Typewriter'; // Importamos el componente Typewriter

function LandingPage() {
  const navigate = useNavigate(); // Hook para la navegación
  const welcomeText = "Iniciando conexión con el servidor... Parece que nuestro Amstrad CPC 464 está calentando los circuitos. Como funciona con energía retro y un poco de magia, a veces tarda un poquito en despertar después de una siesta (cortesía del plan gratuito). ¡Ten paciencia, la nostalgia digital está en camino!";

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
          maxWidth: '220px', // Se aplicará al div contenedor en Typewriter
          margin: '0 auto 2rem auto', // Se aplicará al div contenedor en Typewriter
          textAlign: 'left', // Se aplicará al <p> interno en Typewriter
        }}
        maxLines={10} // Nueva propiedad para limitar las líneas visibles
      />
    </div>
  );
}

export default LandingPage;
