require('dotenv').config(); // Cargar variables de entorno desde .env

const express = require('express');
const { Pool } = require('pg'); // Cambiado de mysql2/promise a pg
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_muy_seguro'; // Usar variable de entorno
const SALT_ROUNDS = 10;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Conexión a la Base de Datos (Pool para PostgreSQL) ---
// Render proporciona DATABASE_URL. Para desarrollo local, puedes configurarla.
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Si DATABASE_URL incluye sslmode=require (común en Render), necesitas esto:
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
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
    const existingUsersResult = await dbPool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUsersResult.rows.length > 0) {
      return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insertar usuario y devolver el ID
    const result = await dbPool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, passwordHash]
    );

    res.status(201).json({ message: 'Usuario registrado con éxito.', userId: result.rows[0].id });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  // Log 1: Ver qué datos llegan en el cuerpo de la solicitud
  console.log('--- Inicio Petición Login ---');
  console.log('Datos recibidos en req.body:', req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    console.log('Login fallido: Faltan usuario o contraseña en la solicitud.');
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
  }

  try {
    // Buscar usuario
    console.log(`Buscando usuario: "${username}" en la base de datos.`);
    const usersResult = await dbPool.query('SELECT id, username, password_hash FROM users WHERE username = $1', [username]);

    if (usersResult.rows.length === 0) {
      console.log(`Login fallido: Usuario "${username}" no encontrado.`);
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const user = usersResult.rows[0];
    console.log(`Usuario encontrado: ID=${user.id}, Username=${user.username}`);

    // Log 2: Ver la contraseña recibida y el hash almacenado ANTES de comparar
    console.log(`Comparando contraseña recibida (texto plano): "${password}"`);
    console.log(`Con hash almacenado para ${user.username}: "${user.password_hash}"`);

    // Comparar contraseña
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      // Log 3: Indicar explícitamente que la comparación falló
      console.log(`Resultado de bcrypt.compare para "${username}": false (Contraseña incorrecta)`);
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Log 4: Indicar que la comparación fue exitosa
    console.log(`Resultado de bcrypt.compare para "${username}": true (Contraseña correcta)`);

    // Generar JWT
    const payload = { userId: user.id, username: user.username };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    console.log(`Login exitoso para "${username}". Token generado.`);
    console.log('--- Fin Petición Login ---');
    res.json({ message: 'Login exitoso.', token: token, userId: user.id });

  } catch (error) {
    console.error('Error grave durante el login:', error);
    console.log('--- Fin Petición Login (con error) ---');
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- Rutas de Posts ---

// Obtener todos los posts (público)
app.get('/api/posts', async (req, res) => {
  try {
    const postsResult = await dbPool.query(`
      SELECT p.id, p.title, p.body, p.created_at, u.username, p.user_id
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(postsResult.rows);
  } catch (error) {
    console.error('Error obteniendo posts:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Obtener un post por ID (público)
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const postsResult = await dbPool.query(`
      SELECT p.id, p.title, p.body, p.created_at, u.username
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [id]);

    if (postsResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post no encontrado.' });
    }
    res.json(postsResult.rows[0]);
  } catch (error) {
    console.error('Error obteniendo post por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Crear un nuevo post (protegido por JWT)
app.post('/api/posts', authenticateToken, async (req, res) => {
  const { title, body } = req.body;
  const userId = req.user.userId;

  if (!title || !body) {
    return res.status(400).json({ message: 'Título y cuerpo son requeridos.' });
  }

  try {
    const result = await dbPool.query(
      'INSERT INTO posts (title, body, user_id) VALUES ($1, $2, $3) RETURNING id',
      [title, body, userId]
    );
    res.status(201).json({ message: 'Post creado con éxito.', postId: result.rows[0].id });
  } catch (error) {
    console.error('Error creando post:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Borrar un post (protegido por JWT y verificación de autoría)
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;

  try {
    const postCheckResult = await dbPool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);

    if (postCheckResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post no encontrado.' });
    }

    const postUserId = postCheckResult.rows[0].user_id;

    if (postUserId !== userId) {
      return res.status(403).json({ message: 'No autorizado para borrar este post.' });
    }

    const deleteResult = await dbPool.query('DELETE FROM posts WHERE id = $1', [postId]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Post no encontrado para borrar (esto no debería ocurrir si la comprobación anterior fue exitosa).' });
    }

    console.log(`Post ${postId} borrado por usuario ${userId}`);
    res.status(200).json({ message: 'Post borrado con éxito.' });

  } catch (error) {
    console.error(`Error borrando post ${postId}:`, error);
    res.status(500).json({ message: 'Error interno del servidor al intentar borrar el post.' });
  }
});

// Actualizar un post (protegido por JWT y verificación de autoría)
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const { title, body } = req.body;
  const userId = req.user.userId;

  if (!title || !body) {
    return res.status(400).json({ message: 'Título y cuerpo son requeridos.' });
  }

  try {
    // Verificar autoría
    const postCheckResult = await dbPool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postCheckResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post no encontrado.' });
    }
    if (postCheckResult.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'No autorizado para editar este post.' });
    }

    // Actualizar post
    await dbPool.query(
      'UPDATE posts SET title = $1, body = $2 WHERE id = $3',
      [title, body, postId]
    );
    res.json({ message: 'Post actualizado con éxito.' });
  } catch (error) {
    console.error('Error actualizando post:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- Iniciar Servidor ---
async function startServer() {
  try {
    await dbPool.query('SELECT 1'); // Probar conexión
    console.log('Conectado a la base de datos PostgreSQL (Pool).');

    app.listen(port, () => {
      console.log(`Servidor backend escuchando en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor o conectar a la DB:', error);
    process.exit(1);
  }
}

startServer();