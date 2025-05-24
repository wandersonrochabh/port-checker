const express = require('express');
const cors = require('cors');
const net = require('net');
const dns = require('dns');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // permite CORS para todas as origens (frontend pode acessar)

// Endpoint 1: Verifica porta diretamente por IP
app.get('/api/check-port-ip', (req, res) => {
  const ip = req.query.ip;
  const targetPort = parseInt(req.query.port, 10);

  if (!ip || isNaN(targetPort)) {
    return res.status(400).json({ success: false, message: 'IP ou porta inválidos' });
  }

  const socket = new net.Socket();
  let responded = false;

  socket.setTimeout(3000);

  socket.connect(targetPort, ip, () => {
    if (!responded) {
      responded = true;
      socket.destroy();
      res.json({ success: true, open: true, ip });
    }
  });

  socket.on('error', () => {
    if (!responded) {
      responded = true;
      res.json({ success: true, open: false, ip });
    }
  });

  socket.on('timeout', () => {
    if (!responded) {
      responded = true;
      socket.destroy();
      res.json({ success: true, open: false, ip });
    }
  });
});

// ✅ Novo Endpoint: Verifica porta por host (resolve DNS antes)
app.get('/api/check-port', (req, res) => {
  const { host, port } = req.query;

  if (!host || !port) {
    return res.status(400).json({ success: false, message: 'Host e porta são obrigatórios' });
  }

  dns.lookup(host, (err, address) => {
    if (err) {
      return res.json({ success: false, open: false, reason: 'Erro DNS', detail: err.message });
    }

    const socket = new net.Socket();
    let responded = false;

    socket.setTimeout(3000);

    socket.connect(port, address, () => {
      if (!responded) {
        responded = true;
        socket.destroy();
        res.json({ success: true, open: true, ip: address });
      }
    });

    socket.on('error', (err) => {
      if (!responded) {
        responded = true;
        res.json({ success: true, open: false, reason: err.message, ip: address });
      }
    });

    socket.on('timeout', () => {
      if (!responded) {
        responded = true;
        socket.destroy();
        res.json({ success: true, open: false, reason: 'timeout', ip: address });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`);
});
