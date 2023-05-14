import { Server } from "socket.io";

export class WebsocketServer {
  private server: Server | null = null;

  constructor() {
  }

  public start(): void {
    if (this.server) {
      throw new Error('Already started');
    }
    this.server = new Server(8249);

    this.server.on("connection", (socket) => {
      console.log('connected');

      setInterval(() => {
        socket.emit('getMuteStatus', {});
      }, 2000);

      socket.on('muteStatus', ({ data }) => {
        // console.log('mute status', data);

        const match = data.match(/chromeMute:(muted|unmuted|disabled)/);
        if (!match) {
          console.error('Unexpected status', data);
          return;
        }

        switch (match[1]) {
          case 'muted':
            console.log('Microphone is muted');
            break;
          case 'unmuted':
            console.log('Microphone is unmuted');
            break;
          case 'disabled':
            console.log('Call is disconnected');
            break;
          default:
            throw new Error('Unexpected mute status match: ' + match[1]);
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

// export default new WebsocketServer();

new WebsocketServer().start();
