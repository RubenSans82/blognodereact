const express = require('express');
const mysql = require('mysql2/promise'); // Usar la versión con promesas para async/await
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = 'tu_secreto_jwt_muy_seguro'; // ¡Cambia esto por algo seguro y guárdalo fuera del código!
const SALT_ROUNDS = 10; // Coste para bcrypt

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Conexión a la Base de Datos (Pool) ---
// Usar un pool es mejor para manejar múltiples conexiones
const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'blog_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware simple para verificar JWT (proteger rutas)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // Si no hay token, no autorizado

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Si el token no es válido, prohibido
    req.user = user; // Guarda la información del usuario decodificada en la request
    next(); // Pasa al siguiente middleware o ruta
  });
};


// --- Rutas de Autenticación ---

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
  }

  try {
    // Verificar si el usuario ya existe
    const [existingUsers] = await dbPool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insertar usuario
    const [result] = await dbPool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);

    res.status(201).json({ message: 'Usuario registrado con éxito.', userId: result.insertId });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Login de usuario
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
  }

  try {
    // Buscar usuario
    console.log(`Intento de login para usuario: ${username}`); // Log añadido
    const [users] = await dbPool.query('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      console.log(`Login fallido: Usuario "${username}" no encontrado.`); // Log añadido
      return res.status(401).json({ message: 'Credenciales inválidas.' }); // Usuario no encontrado
    }

    const user = users[0];

    // Comparar contraseña
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log(`Login fallido: Contraseña incorrecta para usuario "${username}".`); // Log añadido
      return res.status(401).json({ message: 'Credenciales inválidas.' }); // Contraseña incorrecta
    }

    // Generar JWT
    const tokenPayload = { userId: user.id, username: user.username };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' }); // Token expira en 1 hora

    console.log(`Login exitoso para usuario: ${username}`); // Log añadido
    res.json({ message: 'Login exitoso.', token: token });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// --- Rutas de Posts ---

// Obtener todos los posts (público)
app.get('/api/posts', async (req, res) => {
  try {
    // Obtener posts y el nombre de usuario del autor
    const [posts] = await dbPool.query(`
      SELECT p.id, p.title, p.body, p.created_at, u.username
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(posts);
  } catch (error) {
    console.error('Error obteniendo posts:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Obtener un post por ID (público)
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [posts] = await dbPool.query(`
      SELECT p.id, p.title, p.body, p.created_at, u.username
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post no encontrado.' });
    }
    res.json(posts[0]);
  } catch (error) {
    console.error('Error obteniendo post por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Crear un nuevo post (protegido por JWT)
app.post('/api/posts', authenticateToken, async (req, res) => {
  const { title, body } = req.body;
  const userId = req.user.userId; // Obtenido del token verificado

  if (!title || !body) {
    return res.status(400).json({ message: 'Título y cuerpo son requeridos.' });
  }

  try {
    const [result] = await dbPool.query('INSERT INTO posts (title, body, user_id) VALUES (?, ?, ?)', [title, body, userId]);
    res.status(201).json({ message: 'Post creado con éxito.', postId: result.insertId });
  } catch (error) {
    console.error('Error creando post:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// --- Iniciar Servidor ---
// Usar una función async para asegurar que el pool esté listo (opcional pero buena práctica)
async function startServer() {
  try {
    // Probar conexión al pool (opcional)
    await dbPool.query('SELECT 1');
    console.log('Conectado a la base de datos MySQL (Pool).');

    app.listen(port, () => {
      console.log(`Servidor backend escuchando en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor o conectar a la DB:', error);
    process.exit(1); // Salir si no se puede conectar a la DB
  }
}

startServer();