import { SerialPort } from 'serialport';

const BUTTON_DOWN = 0x33;
const BUTTON_UP = 0x34;

type HexColor = `#${string}`;

function getColorCommand(red: number, green: number, blue: number) {
  const data = new Uint8Array(16);
  data[0] = 0x41;
  function split(value: number): [number, number] {
    return [Math.floor(value / 16) % 16, value % 16];
  }

  let index = 1;
  for (let i = 0; i < 5; i++) {
    data[index++] = red;
    data[index++] = green;
    data[index++] = blue;
  }

  return Buffer.from(data);
}

const server = new SerialPort({
  baudRate: 9600,
  path: '/dev/ttyUSB0',
});

server.on('open', () => {
  console.log('port opened');
  server.on('data', (data: Buffer) => {
    console.log('Data received', data.toString());

    if (data[0] === BUTTON_DOWN) {
      console.log('down');

      server.write(getColorCommand(255, 255, 255));
    }
    if (data[0] === BUTTON_UP) {
      console.log('up');

      server.write(
        getColorCommand(
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256)
        )
      );
    }
  });
});
