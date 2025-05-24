const express = require('express');
const cors = require('cors');
const tls = require('tls');
const net = require('net');
const dns = require('dns');

const app = express();
app.use(cors());

app.get('/api/check-port', (req, res) => {
  const host = req.query.ip;
  const port = parseInt(req.query.port);

  if (!host || isNaN(port)) {
    return res.status(400).json({ success: false, message: 'IP ou porta inválida.' });
  }

  dns.lookup(host, (err, address) => {
    if (err) {
      return res.json({ success: false, message: 'Erro DNS: ' + err.message });
    }

    // Para HTTPS (porta 443) vamos tentar uma conexão TLS
    if (port === 443) {
      const socket = tls.connect(
        {
          host: address,
          port: port,
          servername: host,
          rejectUnauthorized: false, // Aceita certificado inválido, mas podemos detectar isso
          timeout: 3000,
        },
        () => {
          const cert = socket.getPeerCertificate();
          if (socket.authorized) {
            res.json({
              success: true,
              message: `Porta ${port} está ABERTA com certificado válido.`,
              certificate: cert.subject
            });
          } else {
            res.json({
              success: true,
              message: `Porta ${port} está ABERTA, mas o certificado é inválido.`,
              error: socket.authorizationError
            });
          }
          socket.end();
        }
      );

      socket.on('error', (e) => {
        res.json({ success: true, message: `Porta ${port} está ABERTA, mas erro SSL: ${e.message}` });
      });

      socket.on('timeout', () => {
        socket.destroy();
        res.json({ success: false, message: 'Timeout na conexão TLS.' });
      });

    } else {
      // Teste genérico com net.Socket para outras portas
      const socket = new net.Socket();
      let isOpen = false;

      socket.setTimeout(3000);

      socket.on('connect', () => {
        isOpen = true;
        socket.destroy();
      });

      socket.on('timeout', () => {
        socket.destroy();
      });

      socket.on('error', () => {
        socket.destroy();
      });

      socket.on('close', () => {
        if (isOpen) {
          res.json({ success: true, message: `Porta ${port} está ABERTA.` });
        } else {
          res.json({ success: true, message: `Porta ${port} está FECHADA.` });
        }
      });

      socket.connect(port, address);
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
