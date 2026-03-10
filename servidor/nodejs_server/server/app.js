const express = require('express');

const app = express();
const port = 3000;

// Detectar si está en Proxmox
const isProxmox = !!process.env.PM2_HOME;

// Servir carpeta public
app.use(express.static('public'));

// Ruta básica
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
