import http from 'http';
import crypto from 'crypto';

const PORT = 8085;
const clients = new Set();

function createFrame(data) {
  const payload = Buffer.from(data);
  const length = payload.length;
  let header;

  if (length <= 125) {
    header = Buffer.from([0x81, length]);
  } else if (length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, payload]);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        console.log('[WebSocket Hub] Broadcast Event:', payload.type, payload.order?.order_code || '');

        const frame = createFrame(JSON.stringify(payload));
        let count = 0;
        for (const socket of clients) {
          if (!socket.destroyed) {
            socket.write(frame);
            count++;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', clients: clients.size }));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '\r\n',
  ];

  socket.write(headers.join('\r\n'));
  clients.add(socket);

  console.log(`[WebSocket Hub] Client connected. Total clients: ${clients.size}`);

  socket.write(
    createFrame(
      JSON.stringify({
        type: 'CONNECTED',
        message: 'Connected to STI Realtime Order Stream',
      })
    )
  );

  socket.on('close', () => {
    clients.delete(socket);
    console.log(`[WebSocket Hub] Client disconnected. Total clients: ${clients.size}`);
  });

  socket.on('error', () => {
    clients.delete(socket);
  });
});

server.listen(PORT, () => {
  console.log(`[STI Realtime WebSocket Hub] Running on ws://localhost:${PORT}`);
});
