const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const db = new sqlite3.Database('./restaurant.db');

app.use(cors());
app.use(express.json()); // Reemplaza a bodyParser.json()
app.use(express.static('public')); 



// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function(_, __, cb) {  // Ignorando req y file
    cb(null, 'public/img')  // Asegúrate de que esta carpeta exista
  },
  filename: function(_, file, cb) {
    // Crear un nombre de archivo único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'imagen-' + uniqueSuffix + path.extname(file.originalname))
  
  }
});


const upload = multer({ storage: storage });


const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


let menuVersion = 0; // O usa un timestamp inicial

// Hardcoded user for demonstration purposes
const hardcodedUser = {
  username: "admin",
  password: bcrypt.hashSync("123", 8)  // Hashed password
};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // In a real-world app, you'd fetch the user from the database
  if (username === hardcodedUser.username && bcrypt.compareSync(password, hardcodedUser.password)) {
    const token = jwt.sign({ id: hardcodedUser.username }, "your-secret-key", {
   
    });

    res.status(200).send({ auth: true, token });
  } else {
    res.status(401).send({ auth: false, message: "Invalid credentials" });
  }
});




// CRUD Endpoints

// CREATE: Añadir un nuevo elemento al menú
app.post('/api/menu', upload.single('imagen'), (req, res) => {
  const { nombre, precio, descripcion, tipo } = req.body;
  // Asegúrate de que esta ruta sea relativa al directorio 'public'
  const img_url = req.file ? `img/${req.file.filename}` : ''; // Cambia la ruta aquí

  const query = 'INSERT INTO menu_items (nombre, precio, descripcion, tipo, img_url) VALUES (?, ?, ?, ?, ?)';
  
  db.run(query, [nombre, precio, descripcion, tipo, img_url], function(err) {
    if (err) {
      console.log("Error:", err);  // Añadir log para depurar
      res.status(500).json({ error: err.message });
      return;
    }
    menuVersion++; // Incrementa la versión del menú

    res.json({ id: this.lastID, img_url: img_url });
  });
});


  
  
app.get('/api/menu', (req, res) => {
  const query = 'SELECT * FROM menu_items';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    console.log("Datos devueltos:", rows);  // Añadir esto para depurar
    res.json({ data: rows });
  });
});

  
// PUT: Actualizar un elemento existente en el menú
const fs = require('fs');




// PUT: Actualizar un elemento existente en el menú
app.put('/api/menu/:id', upload.single('imagen'), (req, res) => {
  const { id } = req.params;
  const { nombre, precio, descripcion, tipo } = req.body;

  // Paso 1: Consultar la imagen actual
  db.get('SELECT img_url FROM menu_items WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error("Error al obtener la imagen actual:", err);
      return res.status(500).json({ error: err.message });
    }

    const oldImgUrl = row ? row.img_url : null;  // Ruta de la imagen anterior

    // Paso 2: Realizar la actualización con la nueva imagen
    const newImgUrl = req.file ? `img/${req.file.filename}` : oldImgUrl;  // Usa la nueva imagen o la anterior si no hay una nueva
    const query = 'UPDATE menu_items SET nombre = ?, precio = ?, descripcion = ?, tipo = ?, img_url = ? WHERE id = ?';
    db.run(query, [nombre, precio, descripcion, tipo, newImgUrl, id], function(err) {
      if (err) {
        console.error("Error al ejecutar la consulta:", err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      menuVersion++; // Incrementa la versión del menú

      // Paso 3: Eliminar la imagen antigua si se actualizó
      if (oldImgUrl && newImgUrl !== oldImgUrl) {
        const fullPath = path.join(__dirname, 'public', oldImgUrl);
        fs.unlink(fullPath, err => {
          if (err) console.error("Error al eliminar la imagen antigua:", err);
          else console.log("Imagen antigua eliminada con éxito");
        });
      }

      res.json({ changes: this.changes, img_url: newImgUrl });
    });
  });
});




  
app.delete('/api/menu/:id', (req, res) => {
  const { id } = req.params;

  // Primero, obtén la ubicación actual de la imagen para ese elemento
  const querySelect = 'SELECT img_url FROM menu_items WHERE id = ?';
  db.get(querySelect, [id], (err, row) => {
    if (err) {
      console.error("Error al obtener la imagen:", err);
      return res.status(500).json({ error: err.message });
    }

    if (row && row.img_url) {
      const imgPath = row.img_url; // Ruta de la imagen actual

      // Procede a eliminar el elemento de la base de datos
      const queryDelete = 'DELETE FROM menu_items WHERE id = ?';
      db.run(queryDelete, [id], function(err) {
        if (err) {
          console.error("Error al eliminar el elemento:", err);
          return res.status(500).json({ error: err.message });
        }

        if (this.changes > 0) {
          // Eliminar la imagen del sistema de archivos
          const fullPath = path.join(__dirname, 'public', imgPath);
          fs.unlink(fullPath, err => {
            if (err) {
              console.error("Error al eliminar la imagen:", err);
            } else {
              console.log("Imagen eliminada con éxito");
            }
          });
        }

        // Enviar respuesta de eliminación exitosa
        menuVersion++; // Incrementa la versión del menú
        res.json({ deleted: this.changes });
      });
    } else {
      res.status(404).json({ error: "Item not found or no image to delete" });
    }
  });
});

  
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });


  app.post('/api/announcements', upload.single('image'), (req, res) => {

    console.log("Has new image:", !!req.file); // Verifica si se detecta una nueva imagen
console.log("Req.file details:", req.file); // Detalles del archivo
    const { text, paragraph, state } = req.body;
    const hasNewImage = !!req.file;
    const newImageUrl = hasNewImage ? `/img/${req.file.filename}` : '';

    // Verificar si existe un anuncio para actualizarlo o crear uno nuevo
    const checkAnnouncementExists = 'SELECT id, image_url FROM announcements WHERE id = 1';
    
    db.get(checkAnnouncementExists, [], (err, row) => {
      console.log("Current image URL:", row ? row.image_url : "No image");

        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        let query;
        let params;

        if (row) { 
// Cuando actualizas un anuncio existente:
const currentImageUrl = hasNewImage ? newImageUrl : row.image_url;
          query = 'UPDATE announcements SET image_url = ?, text = ?, paragraph = ?, state = ? WHERE id = 1';
          params = [currentImageUrl, text, paragraph, state];
      } else { // Crear un nuevo anuncio
          query = 'INSERT INTO announcements (image_url, text, paragraph, state) VALUES (?, ?, ?, ?)';
          // Nota: como es un nuevo anuncio, si no hay imagen nueva, se establecerá como vacío
          params = [newImageUrl, text, paragraph, state];
      }

        // Ejecutar la creación o actualización
        db.run(query, params, function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, id: this.lastID, image_url: hasNewImage ? newImageUrl : (row ? row.image_url : '') });
        });
    });
});


// Ruta GET para obtener el anuncio activo
app.get('/api/announcements', (req, res) => {
  console.log("Solicitud GET recibida para obtener el anuncio activo.");

  const getActiveAnnouncement = 'SELECT * FROM announcements WHERE state = \'true\' ORDER BY id DESC LIMIT 1';

  db.get(getActiveAnnouncement, [], (err, row) => {
    console.log("Resultado de la consulta SQL:", row);  // Ver qué se está obteniendo de la base de datos

    if (err) {
      console.error("Error al intentar obtener el anuncio activo de la base de datos:", err.message);

      res.status(500).json({ error: err.message });
      return;
    }
    console.log("Anuncio activo obtenido con éxito:", row);

    res.json(row ? { success: true, announcement: row } : { success: false, message: 'No active announcement found' });
  });
});


app.get('/api/menuVersion', (req, res) => {
    res.json({ version: menuVersion });
});
