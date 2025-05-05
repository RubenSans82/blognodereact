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
    const [users] = await dbPool.query('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      console.log(`Login fallido: Usuario "${username}" no encontrado.`);
      // Es importante devolver 401 aquí también para no revelar si el usuario existe o no
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const user = users[0];
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
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expira en 1 hora

    console.log(`Login exitoso para "${username}". Token generado.`);
    console.log('--- Fin Petición Login ---');
    // Añadir userId a la respuesta JSON
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
    // Obtener posts, el nombre de usuario del autor y el user_id del post
    const [posts] = await dbPool.query(`
      SELECT p.id, p.title, p.body, p.created_at, u.username, p.user_id
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

// Borrar un post (protegido por JWT y verificación de autoría)
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId; // ID del usuario autenticado

  try {
    // 1. Verificar que el post existe y obtener su user_id
    const [posts] = await dbPool.query('SELECT user_id FROM posts WHERE id = ?', [postId]);

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post no encontrado.' });
    }

    const postUserId = posts[0].user_id;

    // 2. Verificar si el usuario autenticado es el autor del post
    if (postUserId !== userId) {
      return res.status(403).json({ message: 'No autorizado para borrar este post.' }); // 403 Forbidden
    }

    // 3. Si es el autor, proceder a borrar
    const [result] = await dbPool.query('DELETE FROM posts WHERE id = ?', [postId]);

    if (result.affectedRows === 0) {
      // Esto no debería pasar si la verificación anterior funcionó, pero es una comprobación extra
      return res.status(404).json({ message: 'Post no encontrado para borrar.' });
    }

    console.log(`Post ${postId} borrado por usuario ${userId}`);
    res.status(200).json({ message: 'Post borrado con éxito.' }); // O res.sendStatus(204) si no quieres enviar cuerpo

  } catch (error) {
    console.error(`Error borrando post ${postId}:`, error);
    res.status(500).json({ message: 'Error interno del servidor al intentar borrar el post.' });
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