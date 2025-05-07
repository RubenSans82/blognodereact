import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.jsx' // App será ahora el layout principal
import HomePage from './pages/HomePage.jsx';
import PostPage from './pages/PostPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import CreatePostPage from './pages/CreatePostPage.jsx';
import EditPostPage from './pages/EditPostPage.jsx';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router> {/* Envolver la aplicación con el Router */}
      <Routes>
        {/* Usar App como layout que contiene el Navbar y el Outlet para las páginas */}
        <Route path="/" element={<App />}>
          {/* Rutas anidadas que se renderizarán dentro del Outlet de App */}
          <Route index element={<HomePage />} /> {/* Ruta raíz */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="create" element={<CreatePostPage />} /> {/* Ruta para crear post */}
          <Route path="post/:id" element={<PostPage />} /> {/* Ruta para post individual */}
          <Route path="edit-post/:id" element={<EditPostPage />} />
          {/* Puedes añadir una ruta para página no encontrada (404) aquí si quieres */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Route>
      </Routes>
    </Router>
  </React.StrictMode>,
)
