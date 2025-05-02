import React, { useState, useEffect } from 'react';
// Importar useLocation
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '/logo.png'; // Import the logo

function Navbar() {
  const navigate = useNavigate();
  // Obtener el objeto location
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    } else {
      setIsLoggedIn(false);
      setUsername('');
    }
    // Añadir location al array de dependencias
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    navigate('/login');
  };

  return (
    <nav className="navbar-container"> {/* Add className here */}
      <ul>
        {/* Left group: Logo and Home */}
        <div className="nav-left">
          <li> {/* Wrap logo Link in li for semantic correctness */}
            <Link to="/" className="navbar-logo">
              <img src={logo} className="logo" alt="Blog logo" /> {/* Use img tag */}
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/" className="nav-links">
              Home
            </Link>
          </li>
        </div>

        {/* Right group: Conditional links */}
        <div className="nav-right">
          {isLoggedIn ? (
            <>
              <li className="nav-item">
                <Link to="/create" className="nav-links">
                  Create Post
                </Link>
              </li>
              <li className="nav-item">
                <span className="nav-links username">Welcome, {username}</span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-links nav-button">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-links">
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-links">
                  Register
                </Link>
              </li>
            </>
          )}
        </div>
      </ul>
    </nav>
  );
}

export default Navbar;