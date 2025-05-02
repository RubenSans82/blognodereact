import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // Importar Outlet
import Navbar from './components/Navbar'; // Importar Navbar
import './App.css';

function App() {
  // Puedes mantener estado global aquí si lo necesitas (ej. estado de autenticación)
  // const [message, setMessage] = useState(''); // Ya no necesitamos el mensaje de prueba aquí

  // useEffect(() => { // Ya no necesitamos la llamada de prueba aquí
  //   fetch('http://localhost:3001/api')
  //     .then(response => response.json())
  //     .then(data => {
  //       setMessage(data.message);
  //       console.log(data);
  //     })
  //     .catch(error => console.error('Error al llamar a la API:', error));
  // }, []);

  return (
    <>
      <Navbar /> {/* Mostrar la barra de navegación en todas las páginas */}
      <main>
        <Outlet /> {/* Aquí se renderizarán los componentes de las rutas anidadas */}
      </main>
      {/* Puedes añadir un Footer aquí si quieres */}
    </>
  )
}

export default App
