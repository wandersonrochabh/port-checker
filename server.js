const express = require('express');
const cors = require('cors');
const net = require('net');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // permite CORS para todas as origens (frontend pode acessar)

app.get('/api/check-port', (req, res) => {
  const ip = req.query.ip;
  const targetPort = parseInt(req.query.port, 10);

  if (!ip || isNaN(targetPort)) {
    return res.status(400).json({ success: false, message: 'IP ou porta inválidos' });
  }

  const socket = new net.Socket();

  // Flag para evitar múltiplas respostas
  let responded = false;

  // Timeout maior para garantir resposta
  socket.setTimeout(3000);

  socket.connect(targetPort, ip, () => {
    if (!responded) {
      responded = true;
      socket.destroy();
      res.json({ success: true, open: true });
    }
  });

  socket.on('error', (err) => {
    if (!responded) {
      responded = true;
      // console.error('Erro no socket:', err.message); // para debug
      res.json({ success: true, open: false });
    }
  });

  socket.on('timeout', () => {
    if (!responded) {
      responded = true;
      socket.destroy();
      res.json({ success: true, open: false });
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
