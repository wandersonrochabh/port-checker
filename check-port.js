// check-port.js
//const express = require('express');
//const dns = require('dns');
//const net = require('net');

//const router = express.Router();

//router.get('/check-port', async (req, res) => {
 // const { host, port } = req.query;

 // if (!host || !port) {
//    return res.status(400).json({ error: 'Informe host e porta' });
//  }

//  dns.lookup(host, (err, address) => {
//    if (err) {
//      return res.json({ open: false, reason: 'Erro DNS', detail: err.message });
//    }

//    const socket = new net.Socket();
//    socket.setTimeout(3000);

//    socket.on('connect', () => {
//      socket.destroy();
//      res.json({ open: true, ip: address });
//    });

//    socket.on('timeout', () => {
//      socket.destroy();
//      res.json({ open: false, reason: 'timeout', ip: address });
//    });

//    socket.on('error', (err) => {
//      res.json({ open: false, reason: err.message, ip: address });
//    });

//    socket.connect(port, address);
//  });
//});

//module.exports = router;
