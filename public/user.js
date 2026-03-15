const params = new URLSearchParams(window.location.search);
const userName = params.get('name') || null;

let sessionId = null;
let peerConnection = null;
let localStream = null;
let heartbeatTimer = null;
let reconnectTimer = null;
let wakeLock = null;
let isRebuilding = false;

const HEARTBEAT_INTERVAL = 4000;
const RECONNECT_DELAY = 500;

const statusEl = document.getElementById('status');
const errorEl = document.getElementById('error');
const videoEl = document.getElementById('localVideo');
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

let audioCtx = null;
function startSilentAudio() {
  try {
    audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.001;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
  } catch (e) {}
}

const socket = io({
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 2000,
  timeout: 4000
});

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      if (wakeLock) return;
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) {}
  }
}

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    await requestWakeLock();
    if (!socket.connected) {
      socket.connect();
    } else if (sessionId) {
      const state = peerConnection ? peerConnection.connectionState : 'closed';
      if (state !== 'connected') rebuildPeerConnection();
    }
  }
});

// --- Kamera ---
async function startCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    videoEl.srcObject = localStream;
    errorEl.style.display = 'none';
    statusEl.textContent = 'Menghubungkan...';
    await requestWakeLock();
    startSilentAudio();
    socket.connect();
  } catch (err) {
    console.error('[USER] Camera error:', err);
    errorEl.style.display = 'block';
    statusEl.textContent = 'Gagal: ' + err.message;
  }
}

// --- Socket ---
socket.on('connect', () => {
  socket.emit('user:join', { name: userName });
});

socket.on('user:joined', (sess) => {
  sessionId = sess.sessionId;
  statusEl.textContent = 'Live';
  statusEl.className = 'status-badge live';
  rebuildPeerConnection();
  startHeartbeat();
});

socket.on('webrtc:request-offer', ({ adminSocketId }) => {
  if (!sessionId || !localStream) return;
  rebuildPeerConnection(adminSocketId);
});

socket.on('webrtc:answer', async ({ answer }) => {
  if (!peerConnection) return;
  try {
    if (peerConnection.signalingState === 'have-local-offer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  } catch (e) { console.error(e); }
});

socket.on('webrtc:ice-candidate', async ({ candidate }) => {
  if (peerConnection && peerConnection.remoteDescription) {
    try { await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
  }
});

socket.on('disconnect', () => {
  statusEl.textContent = 'Reconnecting...';
  statusEl.className = 'status-badge';
});

socket.on('reconnect', () => {
  socket.emit('user:join', { name: userName });
});

// --- WebRTC ---
async function rebuildPeerConnection(targetAdminId) {
  if (isRebuilding) return;
  isRebuilding = true;
  clearTimeout(reconnectTimer);

  if (peerConnection) {
    peerConnection.onicecandidate = null;
    peerConnection.onconnectionstatechange = null;
    peerConnection.close();
    peerConnection = null;
  }

  const pc = new RTCPeerConnection(rtcConfig);
  peerConnection = pc;

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit('webrtc:ice-candidate', { sessionId, candidate, fromAdmin: false });
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      statusEl.textContent = 'Live';
      statusEl.className = 'status-badge live';
      isRebuilding = false;
    }
    if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
      isRebuilding = false;
      reconnectTimer = setTimeout(() => rebuildPeerConnection(), RECONNECT_DELAY);
    }
  };

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('webrtc:offer', { sessionId, offer, targetAdminId: targetAdminId || null });
  } catch (e) {
    console.error('[USER] offer error:', e);
  }
  isRebuilding = false;
}

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (sessionId && socket.connected) socket.emit('heartbeat', { sessionId });
  }, HEARTBEAT_INTERVAL);
}
