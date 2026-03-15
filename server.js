const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- Config ---
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('admin123', 10);
const PORT = process.env.PORT || 3000;
const HEARTBEAT_TIMEOUT_MS = 15000; // 15 detik timeout (heartbeat tiap 5 detik)

// --- Session store (in-memory) ---
const sessions = new Map(); // sessionId -> session object

function createSession(socketId, name) {
  const sessionId = uuidv4();
  const sess = {
    sessionId,
    name: name || `User-${sessionId.slice(0, 6)}`,
    socketId,
    startTime: new Date(),
    lastHeartbeat: new Date(),
    status: 'active'
  };
  sessions.set(sessionId, sess);
  return sess;
}

function removeSession(sessionId) {
  sessions.delete(sessionId);
}

function getActiveSessions() {
  return Array.from(sessions.values()).filter(s => s.status === 'active');
}

function getSessionBySocketId(socketId) {
  for (const s of sessions.values()) {
    if (s.socketId === socketId) return s;
  }
  return null;
}

// --- Middleware ---
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'camera-stream-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Proteksi halaman admin.html — harus sebelum static middleware
app.get('/admin.html', (req, res, next) => {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin-login.html');
});

app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---
app.get('/', (req, res) => res.redirect('/admin-login.html'));

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  const validUser = username === ADMIN_USERNAME;
  const validPass = validUser && await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (validPass) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/sessions', requireAdmin, (req, res) => {
  res.json(getActiveSessions());
});

// Cek status login admin
app.get('/api/admin/check', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// --- Socket.IO ---
io.on('connection', (socket) => {
  // User joins
  socket.on('user:join', ({ name }) => {
    // Cek apakah ada session offline dengan nama yang sama, reuse jika ada
    let existingSess = null;
    for (const s of sessions.values()) {
      if (s.name === (name || `User-${s.sessionId.slice(0, 6)}`) && s.status === 'offline') {
        existingSess = s;
        break;
      }
    }

    let sess;
    if (existingSess) {
      // Reuse session lama
      existingSess.socketId = socket.id;
      existingSess.status = 'active';
      existingSess.lastHeartbeat = new Date();
      sess = existingSess;
    } else {
      sess = createSession(socket.id, name);
    }

    socket.join('users');
    socket.emit('user:joined', sess);
    io.to('admins').emit('user:joined', sess);
    socket.sessionId = sess.sessionId;
  });

  // WebRTC signaling
  socket.on('webrtc:offer', ({ sessionId, offer, targetAdminId }) => {
    if (targetAdminId) {
      // Kirim ke admin spesifik
      io.to(targetAdminId).emit('webrtc:offer', { sessionId, offer });
    } else {
      // Broadcast ke semua admin
      io.to('admins').emit('webrtc:offer', { sessionId, offer });
    }
  });

  socket.on('webrtc:answer', ({ sessionId, answer }) => {
    const sess = sessions.get(sessionId);
    if (sess) io.to(sess.socketId).emit('webrtc:answer', { answer });
  });

  socket.on('webrtc:ice-candidate', ({ sessionId, candidate, fromAdmin }) => {
    if (fromAdmin) {
      const sess = sessions.get(sessionId);
      if (sess) io.to(sess.socketId).emit('webrtc:ice-candidate', { candidate });
    } else {
      io.to('admins').emit('webrtc:ice-candidate', { sessionId, candidate });
    }
  });

  // Heartbeat
  socket.on('heartbeat', ({ sessionId }) => {
    const sess = sessions.get(sessionId);
    if (sess) sess.lastHeartbeat = new Date();
  });

  // Admin joins dashboard
  socket.on('admin:join', () => {
    socket.join('admins');
    const activeSessions = getActiveSessions();
    socket.emit('sessions:list', activeSessions);
    // Minta semua user aktif kirim ulang offer ke admin baru ini
    activeSessions.forEach(sess => {
      io.to(sess.socketId).emit('webrtc:request-offer', { adminSocketId: socket.id });
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const sess = getSessionBySocketId(socket.id);
    if (sess) {
      removeSession(sess.sessionId);
      io.to('admins').emit('user:left', { sessionId: sess.sessionId });
    }
  });
});

// --- Heartbeat timeout checker ---
setInterval(() => {
  const now = Date.now();
  for (const sess of sessions.values()) {
    if (sess.status === 'active' && now - new Date(sess.lastHeartbeat).getTime() > HEARTBEAT_TIMEOUT_MS) {
      sess.status = 'offline';
      io.to('admins').emit('user:left', { sessionId: sess.sessionId });
    }
  }
}, 5000); // cek setiap 5 detik

if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = { createSession, removeSession, getActiveSessions, getSessionBySocketId, sessions };
