const http = require('http');
const https = require('https');

const BACKEND_URL = process.env.BACKEND_URL || 'https://seadi-backend.onrender.com';

module.exports = async (req, res) => {
  const targetUrl = `${BACKEND_URL}${req.url}`;

  const proxyReq = https.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(BACKEND_URL).host,
        'x-forwarded-for': req.headers['x-real-ip'] || req.socket.remoteAddress,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ message: 'Backend unavailable' }));
  });

  req.pipe(proxyReq);
};
