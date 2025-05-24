const express = require('express');
const net = require('net');
const tls = require('tls');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/check-port', async (req, res) => {
  const ip = req.query.ip;
  const port = parseInt(req.query.port);

  if (!ip || isNaN(port)) {
    return res.status(400).json({ success: false, message: 'IP e porta são obrigatórios.' });
  }

  const socket = new net.Socket();
  let isPortOpen = false;

  socket.setTimeout(3000);

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
    if (!isPortOpen) {
      return res.json({ success: true, status: 'closed', message: `Porta ${port} está FECHADA em ${ip}.` });
    }

    // Agora testamos conexão TLS se for porta HTTPS
    if (port === 443) {
      const tlsSocket = tls.connect(
        {
          host: ip,
          port: port,
          servername: ip,
          rejectUnauthorized: false, // ⚠️ Não bloqueia certificados inválidos
          timeout: 3000
        },
        () => {
          const cert = tlsSocket.getPeerCertificate();
          if (cert && cert.valid_to) {
            tlsSocket.end();
            return res.json({
              success: true,
              status: 'open',
              message: `Porta ${port} está ABERTA em ${ip}. Certificado VÁLIDO até ${cert.valid_to}.`
            });
          } else {
            tlsSocket.end();
            return res.json({
              success: true,
              status: 'open_cert_invalid',
              message: `Porta ${port} está ABERTA em ${ip}, mas o certificado é INVÁLIDO ou ausente.`
            });
          }
        }
      );

      tlsSocket.on('error', (err) => {
        return res.json({
          success: true,
          status: 'open_cert_invalid',
          message: `Porta ${port} está ABERTA em ${ip}, mas o certificado apresentou erro: ${err.message}`
        });
      });

      tlsSocket.setTimeout(3000, () => {
        tlsSocket.destroy();
        return res.json({
          success: true,
          status: 'open_cert_invalid',
          message: `Porta ${port} está ABERTA em ${ip}, mas a verificação do certificado falhou por TIMEOUT.`
        });
      });

    } else {
      return res.json({ success: true, status: 'open', message: `Porta ${port} está ABERTA em ${ip}.` });
    }
  });

  socket.connect(port, ip);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
