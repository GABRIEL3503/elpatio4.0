const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./restaurant.db');

app.use(cors());
app.use(express.json()); // Reemplaza a bodyParser.json()
app.use(express.static('public')); 


const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Hardcoded user for demonstration purposes
const hardcodedUser = {
  username: "admin",
  password: bcrypt.hashSync("1234", 8)  // Hashed password
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
app.post('/api/menu', (req, res) => {
  const { nombre, precio, descripcion, tipo, img_url } = req.body;
  const query = 'INSERT INTO menu_items (nombre, precio, descripcion, tipo, img_url) VALUES (?, ?, ?, ?, ?)';
  
    
  db.run(query, [nombre, precio, descripcion, tipo, img_url], function(err) {
    if (err) {
        console.log("Error:", err);  // Añadir log para depurar
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    });
});

  
  
  app.get('/api/menu', (req, res) => {
    const query = 'SELECT * FROM menu_items';
    
    db.all(query, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ data: rows });
    });
  });
  
  
  app.put('/api/menu/:id', (req, res) => {
    console.log("Solicitud PUT recibida para ID:", req.params.id);  // Nuevo log
    console.log("Datos recibidos en el cuerpo de la solicitud:", req.body);  // Nuevo log
  
    const { id } = req.params;
    const { nombre, precio, descripcion, tipo } = req.body;
    const query = 'UPDATE menu_items SET nombre = ?, precio = ?, descripcion = ?, tipo = ? WHERE id = ?';
    
    db.run(query, [nombre, precio, descripcion, tipo, id], function(err) {
      if (err) {
        console.log("Error al ejecutar la consulta:", err.message);  // Nuevo log
        res.status(500).json({ error: err.message });
        return;
      }
      console.log("Número de cambios realizados:", this.changes);  // Nuevo log
      res.json({ changes: this.changes });
    });
  });
  
  app.delete('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM menu_items WHERE id = ?';
    
    db.run(query, id, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ deleted: this.changes });
    });
  });
  
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });