import type { WebSocket, WebSocketServer } from 'ws';

let activeWss: WebSocketServer | null = null;
const connectedClients = new Map<WebSocket, { userId?: number; connectedAt: string }>();

export function registerWebSocketServer(wss: WebSocketServer) {
  activeWss = wss;
  wss.on('connection', (ws, req) => {
    let userId: number | undefined;
    try {
      const url = new URL(req.url || '/ws/notifications', 'http://localhost');
      const uid = url.searchParams.get('userId');
      if (uid && !isNaN(Number(uid))) {
        userId = Number(uid);
      }
    } catch {
      // ignore malformed URL
    }

    connectedClients.set(ws, { userId, connectedAt: new Date().toISOString() });

    ws.send(
      JSON.stringify({
        type: 'WS_CONNECTED',
        channel: 'tatito_realtime_notifications',
        timestamp: new Date().toISOString(),
        message: 'Connected to Tatito Real-Time Notification Stream'
      })
    );

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (msg?.type === 'AUTH' && msg.userId) {
          connectedClients.set(ws, { userId: Number(msg.userId), connectedAt: new Date().toISOString() });
        } else if (msg?.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        }
      } catch {
        // ignore invalid frames
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
    });
  });
}

export function broadcastRealtimeNotification(
  targetUserId: number | 'all',
  payload: {
    title: string;
    message: string;
    category?: string;
    reference?: string;
    amount?: number;
  }
) {
  if (!activeWss) return;
  const frame = JSON.stringify({
    type: 'NOTIFICATION_EVENT',
    ...payload,
    timestamp: new Date().toISOString()
  });

  connectedClients.forEach((meta, ws) => {
    if (ws.readyState !== 1) return; // WebSocket.OPEN === 1
    if (targetUserId === 'all' || !meta.userId || meta.userId === targetUserId) {
      try {
        ws.send(frame);
      } catch {
        // ignore closed sockets
      }
    }
  });
}

export function getRealtimeStats() {
  return {
    websocket_enabled: Boolean(activeWss),
    connected_clients: connectedClients.size
  };
}
