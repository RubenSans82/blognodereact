require('dotenv').config(); // Cargar variables de entorno desde .env
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const express = require('express');
const { Pool } = require('pg'); // Cambiado de mysql2/promise a pg
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

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

// Configuración de Multer para guardar archivos temporalmente
const upload = multer({ dest: 'uploads/tmp/' });

// Asegura que la carpeta de uploads existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
      SELECT p.id, p.title, p.body, p.created_at, u.username, p.user_id, p.image_url
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
      SELECT p.id, p.title, p.body, p.created_at, u.username, p.image_url
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
  const { title, body, image_url } = req.body;
  const userId = req.user.userId;

  if (!title || !body) {
    return res.status(400).json({ message: 'Título y cuerpo son requeridos.' });
  }

  try {
    const result = await dbPool.query(
      'INSERT INTO posts (title, body, user_id, image_url) VALUES ($1, $2, $3, $4) RETURNING id',
      [title, body, userId, image_url || null]
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
  const { title, body, image_url } = req.body;
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

    // Actualizar post (incluyendo image_url)
    await dbPool.query(
      'UPDATE posts SET title = $1, body = $2, image_url = $3 WHERE id = $4',
      [title, body, image_url || null, postId]
    );
    res.json({ message: 'Post actualizado con éxito.' });
  } catch (error) {
    console.error('Error actualizando post:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Ruta para subir y procesar imagen a estilo pixel art retro
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se subió ninguna imagen' });
    const outputFilename = `retro_${Date.now()}.png`;
    const outputPath = path.join(uploadsDir, outputFilename);
    // Procesar imagen: reducir tamaño y colores para efecto pixel art
    await sharp(file.path)
      .resize(96, 96, { fit: 'inside' }) // tamaño pequeño
      .png({ colors: 16 }) // paleta limitada
      .toFile(outputPath);
    // Eliminar archivo temporal
    fs.unlinkSync(file.path);
    // Devolver la URL de la imagen procesada
    res.json({ url: `/uploads/${outputFilename}` });
  } catch (err) {
    res.status(500).json({ error: 'Error procesando la imagen', details: err.message });
  }
});

// Cambia la ruta de subida de imagen para usar Cloudinary
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }
    // Sube la imagen a Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'blog',
      resource_type: 'image',
    });
    // Elimina el archivo temporal local si lo deseas
    const fs = require('fs');
    fs.unlink(req.file.path, () => {});
    // Devuelve la URL segura de Cloudinary
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Error al subir la imagen a Cloudinary.' });
  }
});

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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