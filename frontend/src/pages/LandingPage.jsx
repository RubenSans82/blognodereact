import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import Typewriter from '../components/Typewriter';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate(); // Hook para la navegación
  const welcomeText = "¡Hey, Ciber-Explorador! Bienvenido a Retro Post, tu máquina del tiempo personal a la era dorada de los blogs. Mientras nuestro fiel procesador de 8 bits calienta los tubos de rayos catódicos y el módem negocia la conexión (cortesía de nuestro plan de hosting que a veces viaja a 300 baudios), por favor, espera un momento. ¡La aventura digital de antaño está a punto de cargarse en tu pantalla!";

  useEffect(() => {
    // Redirigir a /login después de 2 segundos
    const timer = setTimeout(() => {
      navigate('/login');
    }, 32000); // 32000 milisegundos = 32 segundos

    // Limpiar el temporizador en caso de que el componente se desmonte antes de que se complete el tiempo
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        width: '100%', // Ocupar el ancho completo disponible
        margin: '0 auto', // Centrar el bloque de contenido
        padding: '8rem 1rem 2rem 1rem', // Reducido padding horizontal (de 2rem a 1rem)
        textAlign: 'center', // Centrar el título H1
        boxSizing: 'border-box',
        minHeight: '100vh', // Asegurar que ocupe al menos toda la altura de la ventana
        display: 'flex', // Usar flex para centrar verticalmente el contenido si es necesario
        flexDirection: 'column',
        alignItems: 'center', // Centrar horizontalmente el contenido flex
        // justifyContent: 'center', // Opcional: si quieres centrar verticalmente el contenido en la altura de la pantalla
      }}
    >
      <h1 style={{ marginBottom: '2.5rem', textShadow: '2px 2px 4px #000', fontSize: '2.8em' }}>
        Retro Post
      </h1>
      <Typewriter 
        text={welcomeText} 
        speed={65} // Ajustar velocidad si se desea
        style={{
          fontSize: '1.7em', // Tamaño de fuente para el texto del Typewriter
          color: '#fff', // Color del texto (asumiendo fondo oscuro de LandingPage)
          textShadow: '1px 1px 2px rgba(0,0,0,0.6)', // Sombra de texto sutil
          lineHeight: '1.65',
          maxWidth: '85ch', // Aumentado para permitir texto más ancho (antes 75ch)
          width: 'clamp(300px, 95%, 850px)', // Ajustado para ser más ancho (antes 90%, 750px)
          margin: '0 auto 2rem auto', // Centrar el Typewriter y margen inferior
          textAlign: 'left', // Texto dentro del Typewriter alineado a la izquierda
        }}
        maxLines={12} // Aumentar si el nuevo texto es más largo o ajustar según preferencia
      />
    </div>
  );
}

export default LandingPage;
