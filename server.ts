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
  private connectedSockets: Set<Socket> = new Set();

  public addMuteListener(listener: MuteListener): void {
    this.muteListeners.add(listener);
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

    this.server.on('connection', (socket) => {
      console.log('connected');

      this.connectedSockets.add(socket);

      setInterval(() => {
        socket.emit('getMuteStatus', {});
      }, 2000);

      socket.on('disconnect', () => {
        for (const listener of this.muteListeners) {
          listener('disabled');
        }
        this.connectedSockets.delete(socket);
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
    });
  }
}

function ensureStatus(value: string): MuteStatus {
  if (['muted', 'unmuted', 'disabled'].includes(value)) {
    return value as MuteStatus;
  }
  throw new Error('Unexpected mute status: ' + value);
}

export default new WebsocketServer();
