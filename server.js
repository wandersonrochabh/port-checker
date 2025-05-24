const express = require('express');
const cors = require('cors');
const net = require('net');
const tls = require('tls');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

function checkSSLCertificate(ip, callback) {
  const options = {
    host: ip,
    port: 443,
    rejectUnauthorized: false, // para receber o certificado mesmo se inválido
    servername: ip // importante para SNI
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

    // tudo ok
    callback(null, true, null);
  });

  socket.on('error', (err) => {
    callback(err);
  });
}

app.get('/api/check-port', (req, res) => {
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

      if (targetPort === 443) {
        // Verifica certificado SSL
        checkSSLCertificate(ip, (err, valid, message) => {
          if (err) {
            return res.json({ success: true, open: true, ssl: false, error: err.message });
          }

          if (!valid) {
            return res.json({ success: true, open: true, ssl: false, error: message });
          }

          // Certificado válido
          res.json({ success: true, open: true, ssl: true });
        });
      } else {
        // Porta aberta, mas não HTTPS
        res.json({ success: true, open: true });
      }
    }
  });

  socket.on('error', (err) => {
    if (!responded) {
      responded = true;
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
