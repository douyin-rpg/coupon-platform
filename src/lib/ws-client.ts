export interface WsMessage {
  type: string;
  payload?: Record<string, unknown> | null;
}

interface CreateWsConnectionOptions {
  path: string;
  onMessage: (msg: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
}

export interface WsConnection {
  send(msg: WsMessage): void;
  close(): void;
  readonly readyState: number;
}

export function createWsConnection({ path, onMessage, onOpen, onClose, onError }: CreateWsConnectionOptions): WsConnection {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}${path}`;

  let ws: WebSocket;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let alive = false;

  const heartbeat = () => {
    if (!alive) {
      ws.close();
      return;
    }
    alive = false;
    ws.send(JSON.stringify({ type: 'ping', payload: null }));
  };

  const cleanup = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    heartbeatTimer = null;
    reconnectTimer = null;
  };

  const connect = () => {
    ws = new WebSocket(url);

    ws.onopen = () => {
      alive = true;
      cleanup();
      heartbeatTimer = setInterval(heartbeat, 10000); // 10s 心跳，更快感知断线
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.type === 'pong') {
          alive = true;
          return;
        }
        onMessage(msg);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      cleanup();
      onClose?.();
      if (!closed) {
        reconnectTimer = setTimeout(connect, 1000); // 1s 快速重连，降低消息延迟
      }
    };

    ws.onerror = (err) => {
      onError?.(err);
    };
  };

  connect();

  return {
    send(msg: WsMessage) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    close() {
      closed = true;
      cleanup();
      try {
        ws?.close();
      } catch {
        // ignore
      }
    },
    get readyState() {
      return ws?.readyState ?? WebSocket.CLOSED;
    },
  };
}