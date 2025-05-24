const express = require('express');
const cors = require('cors');
const net = require('net');
const tls = require('tls');
const dns = require('dns');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

function checkSSLCertificate(ip, callback) {
  const options = {
    host: ip,
    port: 443,
    rejectUnauthorized: false, // Para receber o certificado mesmo se inválido
    servername: ip, // importante para SNI
    timeout: 3000
  };

  const socket = tls.connect(options, () => {
    const cert = socket.getPeerCertificate();
    socket.end();

    if (!cert || Object.keys(cert).length === 0) {
      return callback(null, false, 'Nenhum certificado encontrado');
    }

    const validFrom = new Date(cert.valid_from);
    const validTo = new Date(cert.valid_to);
    const now = new Date();

    if (now < validFrom || now > validTo) {
      return callback(null, false, 'Certificado expirado ou ainda não válido');
    }

    // Certificado válido
    callback(null, true, null);
  });

  socket.on('error', (err) => {
    callback(err);
  });

  socket.setTimeout(3000, () => {
    socket.destroy();
    callback(new Error('Timeout na verificação do certificado'));
  });
}

app.get('/api/check-port', (req, res) => {
  const host = req.query.ip || req.query.host;
  const targetPort = parseInt(req.query.port, 10);

  if (!host || isNaN(targetPort)) {
    return res.status(400).json({ success: false, message: 'IP ou porta inválidos' });
  }

  dns.lookup(host, (err, address) => {
    if (err) {
      return res.json({ success: false, open: false, error: 'Erro DNS: ' + err.message });
    }

    const socket = new net.Socket();
    let responded = false;
    socket.setTimeout(3000);

    socket.connect(targetPort, address, () => {
      if (responded) return;
      responded = true;
      socket.destroy();

      if (targetPort === 443) {
        checkSSLCertificate(address, (err, valid, message) => {
          if (err) {
            return res.json({ success: true, open: true, ssl: false, error: err.message });
          }

          if (!valid) {
            return res.json({ success: true, open: true, ssl: false, error: message });
          }

          res.json({ success: true, open: true, ssl: true });
        });
      } else {
        // Porta aberta, mas não HTTPS
        res.json({ success: true, open: true, ssl: null });
      }
    });

    socket.on('error', (err) => {
      if (responded) return;
      responded = true;
      res.json({ success: true, open: false, ssl: null, error: err.message });
    });

    socket.on('timeout', () => {
      if (responded) return;
      responded = true;
      socket.destroy();
      res.json({ success: true, open: false, ssl: null, error: 'timeout' });
    });
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
