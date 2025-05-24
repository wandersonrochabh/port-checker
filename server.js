const express = require('express');
const cors = require('cors');
const net = require('net');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/api/check-port', (req, res) => {
  const ip = req.query.ip;
  const targetPort = parseInt(req.query.port, 10);

  if (!ip || isNaN(targetPort)) {
    return res.status(400).json({ success: false, message: 'IP ou porta inválidos' });
  }

  const socket = new net.Socket();
  socket.setTimeout(2000);
  socket.connect(targetPort, ip, () => {
    socket.destroy();
    res.json({ success: true, open: true });
  }).on('error', () => {
    res.json({ success: true, open: false });
  }).on('timeout', () => {
    socket.destroy();
    res.json({ success: true, open: false });
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
