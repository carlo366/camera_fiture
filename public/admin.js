const grid = document.getElementById('grid');
const emptyMsg = document.getElementById('empty');
const fullview = document.getElementById('fullview');
const fullVideo = document.getElementById('fullVideo');

const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const peers = {};
let socket = null;

// Cek session login dulu sebelum apapun
(async () => {
  initDashboard();
})();

function initDashboard() {
  socket = io();

  socket.emit('admin:join');

  socket.on('sessions:list', (sessions) => {
    sessions.forEach(addUserCard);
    updateEmpty();
  });

  socket.on('user:joined', (sess) => {
    // Update card kalau sudah ada (reconnect), atau tambah baru
    removeUserCard(sess.sessionId);
    addUserCard(sess);
    updateEmpty();
  });

  socket.on('user:left', ({ sessionId }) => {
    removeUserCard(sessionId);
    if (peers[sessionId]) { peers[sessionId].close(); delete peers[sessionId]; }
    updateEmpty();
  });

  socket.on('webrtc:offer', async ({ sessionId, offer }) => {
    console.log('[ADMIN] Received offer for', sessionId);
    if (peers[sessionId]) { peers[sessionId].close(); delete peers[sessionId]; }

    const pc = new RTCPeerConnection(rtcConfig);
    peers[sessionId] = pc;

    const remoteStream = new MediaStream();

    pc.ontrack = (event) => {
      console.log('[ADMIN] ontrack fired, tracks:', event.streams[0]?.getTracks().length);
      event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
      const videoEl = document.getElementById(`video-${sessionId}`);
      if (videoEl) {
        videoEl.srcObject = remoteStream;
        videoEl.play().catch(e => console.error('[ADMIN] play error:', e));
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('webrtc:ice-candidate', { sessionId, candidate, fromAdmin: true });
    };

    pc.onconnectionstatechange = () => {
      console.log('[ADMIN] connection state:', pc.connectionState);
    };

    pc.onicegatheringstatechange = () => {
      console.log('[ADMIN] ICE gathering state:', pc.iceGatheringState);
    };

    pc.onsignalingstatechange = () => {
      console.log('[ADMIN] signaling state:', pc.signalingState);
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[ADMIN] setRemoteDescription OK');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[ADMIN] sending answer');
      socket.emit('webrtc:answer', { sessionId, answer });
    } catch(e) {
      console.error('[ADMIN] WebRTC error:', e);
    }
  });

  socket.on('webrtc:ice-candidate', async ({ sessionId, candidate }) => {
    const pc = peers[sessionId];
    if (pc) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
    }
  });
}

function addUserCard(sess) {
  if (document.getElementById(`card-${sess.sessionId}`)) return;
  const card = document.createElement('div');
  card.className = 'card';
  card.id = `card-${sess.sessionId}`;
  const startTime = new Date(sess.startTime).toLocaleTimeString('id-ID');
  card.innerHTML = `
    <video id="video-${sess.sessionId}" autoplay playsinline muted></video>
    <div class="info">
      <strong>${escapeHtml(sess.name)}</strong><br>
      Mulai: ${startTime}
    </div>
  `;
  card.onclick = () => openFullView(sess.sessionId);
  grid.appendChild(card);
}

function removeUserCard(sessionId) {
  const card = document.getElementById(`card-${sessionId}`);
  if (card) card.remove();
}

function openFullView(sessionId) {
  const videoEl = document.getElementById(`video-${sessionId}`);
  if (videoEl && videoEl.srcObject) {
    fullVideo.srcObject = videoEl.srcObject;
    fullview.style.display = 'flex';
  }
}

function closeFullView() {
  fullview.style.display = 'none';
  fullVideo.srcObject = null;
}

function updateEmpty() {
  emptyMsg.style.display = grid.children.length === 0 ? 'block' : 'none';
}

async function logout() {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin-login.html';
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
