const express = require('express');
const net = require('net');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/check-port', (req, res) => {
  const ip = req.query.ip;
  const port = parseInt(req.query.port);

  if (!ip || isNaN(port)) {
    return res.status(400).json({ success: false, message: 'IP e porta são obrigatórios.' });
  }

  const socket = new net.Socket();
  let isPortOpen = false;

  socket.setTimeout(3000); // 3 segundos

  socket.on('connect', () => {
    isPortOpen = true;
    socket.destroy();
  });

  socket.on('timeout', () => {
    socket.destroy();
  });

  socket.on('error', () => {
    socket.destroy();
  });

  socket.on('close', () => {
    if (isPortOpen) {
      res.json({ success: true, message: `Porta ${port} está ABERTA em ${ip}.` });
    } else {
      res.json({ success: true, message: `Porta ${port} está FECHADA em ${ip}.` });
    }
  });

  socket.connect(port, ip);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
