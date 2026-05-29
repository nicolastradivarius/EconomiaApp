const http = require('http');
const WebSocket = require('ws');

const PORT = Number(process.env.WS_PORT) || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = new Map();
let clientCounter = 1;

const normalizeIp = (ip) => {
  if (!ip) return null;
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
};

const createClientId = () => {
  clientCounter += 1;
  return `c${Date.now().toString(36)}${clientCounter.toString(36)}`;
};

const leaveRoom = (ws) => {
  if (!ws.roomId) return null;
  const roomId = ws.roomId;
  const room = rooms.get(roomId);
  if (!room) return;
  room.delete(ws);
  if (!room.size) {
    rooms.delete(roomId);
  }
  ws.roomId = null;
  return roomId;
};

const joinRoom = (ws, roomId) => {
  if (!roomId) return;
  if (ws.roomId && ws.roomId !== roomId) {
    leaveRoom(ws);
  }
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(ws);
  ws.roomId = roomId;
};

const getRoomUsers = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room).map((client) => ({
    id: client.user?.id,
    name: client.user?.name,
    device: client.user?.device,
    ip: client.user?.ip,
  })).filter((user) => user.id && user.name);
};

const sendRoomUsers = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const message = {
    type: 'users',
    roomId,
    sender: 'server',
    payload: {
      users: getRoomUsers(roomId),
    },
    sentAt: Date.now(),
  };
  const payload = JSON.stringify(message);
  room.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

const broadcastToRoom = (roomId, message, sender) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  room.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

wss.on('connection', (ws, req) => {
  ws.roomId = null;
  ws.user = {
    id: createClientId(),
    name: `Guest ${Math.floor(Math.random() * 9000 + 1000)}`,
    device: 'unknown',
    ip: normalizeIp(req?.socket?.remoteAddress),
  };

  ws.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (_error) {
      return;
    }

    if (!message || !message.roomId) return;

    if (message.type === 'join') {
      if (message.payload?.user) {
        ws.user = {
          ...ws.user,
          ...message.payload.user,
          ip: ws.user.ip,
        };
      }
      joinRoom(ws, message.roomId);
      sendRoomUsers(message.roomId);
      return;
    }

    if (!ws.roomId) {
      joinRoom(ws, message.roomId);
    }

    broadcastToRoom(message.roomId, message, ws);
  });

  ws.on('close', () => {
    const roomId = leaveRoom(ws);
    if (roomId) {
      sendRoomUsers(roomId);
    }
  });
  ws.on('error', () => {
    const roomId = leaveRoom(ws);
    if (roomId) {
      sendRoomUsers(roomId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[ws] listening on ws://localhost:${PORT}`);
});
