import { Server, Socket } from 'socket.io';

export type MuteStatus = 'muted' | 'unmuted' | 'disabled';

interface MuteStatusUpdate {
  data: `chromeMute:${MuteStatus},chromeVideo:${MuteStatus}`;
  id: unknown; // null
}
interface MuteToggledResponse {
  data: 'done';
  id: unknown; // null
}

export type MuteListener = (status: MuteStatus) => void;

export class WebsocketServer {
  private server: Server | null = null;
  private muteListeners: Set<MuteListener> = new Set();
  private connectedSockets: Socket[] = [];

  public addMuteListener(listener: MuteListener): void {
    this.muteListeners.add(listener);
  }

  public clearListeners(): void {
    this.muteListeners.clear();
  }

  public toggleMute(onSuccess?: () => void): void {
    for (const socket of this.connectedSockets) {
      socket.once('muteStatusToggled', () => {
        onSuccess?.();
      });
      socket.emit('toggleMuteStatus', {});
    }
  }

  public start(): void {
    if (this.server) {
      throw new Error('Already started');
    }
    this.server = new Server(8249);

    setInterval(() => {
      const latestSocket = this.connectedSockets[0];
      if (latestSocket) {
        latestSocket.emit('getMuteStatus', {});
      }
    }, 2000);

    this.server.on('connection', (socket) => {
      this.onSocketConnected(socket);
    });
  }

  private onSocketConnected(socket: Socket): void {
    if (this.connectedSockets.includes(socket)) {
      return;
    }
    this.connectedSockets.unshift(socket);

    socket.on('disconnect', () => {
      this.connectedSockets = this.connectedSockets.filter(
        (_socket) => _socket !== socket
      );
      if (!this.connectedSockets.length) {
        for (const listener of this.muteListeners) {
          listener('disabled');
        }
      }
    });

    socket.on('muteStatus', ({ data }: MuteStatusUpdate) => {
      // console.log('mute status', data);

      const match = data.match(/chromeMute:(muted|unmuted|disabled)/);
      if (!match) {
        console.error('Unexpected status', data);
        return;
      }

      const status = ensureStatus(match[1]);

      for (const listener of this.muteListeners) {
        listener(status);
      }

      // ["muteStatus",{"data":"chromeMute:muted,chromeVideo:disabled,","id":null}]
      // ["muteStatus",{"data":"chromeMute:unmuted,chromeVideo:disabled,","id":null}]
      // offline
      // ["muteStatus",{"data":"chromeMute:disabled,chromeVideo:disabled,","id":null}]
    });

    // Toggle request
    // ["toggleMuteStatus",{}]
    // Toggle response
    // ["muteStatusToggled",{"data":"done","id":null}]
  }
}

function ensureStatus(value: string): MuteStatus {
  if (['muted', 'unmuted', 'disabled'].includes(value)) {
    return value as MuteStatus;
  }
  throw new Error('Unexpected mute status: ' + value);
}

export default new WebsocketServer();
