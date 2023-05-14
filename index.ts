#!/usr/bin/env ts-node

import { SerialPort } from 'serialport';
import server, { MuteStatus } from './server';
import { Color, parseHexToNumbers } from './colors';

const SERIAL_UPDATE_RATE_MS = 200;

const BUTTON_DOWN = 0x33;
const BUTTON_UP = 0x34;

const Colors = {
  RED: parseHexToNumbers('#ff0000').brightness(0.4),
  GREEN: parseHexToNumbers('#00ff00').brightness(0.4),
  BLUE: parseHexToNumbers('#0000ff').brightness(0.4),
  YELLOW: parseHexToNumbers('#ffff00').brightness(0.4),
  BLACK: parseHexToNumbers('#000000'),
};

const StatusColors = {
  MUTED: Colors.RED,
  UNMUTED: Colors.GREEN,
  OFF: Colors.BLACK,
} as const;

const serialPort = new SerialPort({
  baudRate: 9600,
  path: '/dev/ttyUSB0',
});

server.start();

serialPort.on('open', async () => {
  console.log('Serial port connected');

  let currentColor: Color = Colors.BLACK;
  let currentStatus: MuteStatus = 'disabled';

  server.clearListeners();
  await runStartupAnimation();

  setInterval(() => writeColor(currentColor), SERIAL_UPDATE_RATE_MS);

  server.addMuteListener((status) => {
    setStatus(status);
  });

  serialPort.on('data', (data: Buffer) => {
    if (data[0] === BUTTON_UP) {
      server.toggleMute(toggleStatus);
    }
  });

  function writeColor(color: Color): void {
    serialPort.write(getColorCommand(color));
  }

  function setStatus(status: MuteStatus) {
    currentStatus = status;

    try {
      currentColor = getColorFromStatus(status);
      writeColor(currentColor);
    } catch (e) {
      console.error(e);
    }
  }

  function toggleStatus() {
    switch (currentStatus) {
      case 'muted':
        setStatus('unmuted');
        break;
      case 'unmuted':
        setStatus('muted');
        break;
      default:
      // Do nothing
    }
  }

  function getColorFromStatus(status: MuteStatus): Color {
    switch (status) {
      case 'muted':
        return StatusColors.MUTED;
      case 'unmuted':
        return StatusColors.UNMUTED;
      case 'disabled':
        return StatusColors.OFF;
      default:
        throw new Error('Unexpected status when determining color: ' + status);
    }
  }

  function getColorCommand({ red, green, blue }: Color) {
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

  async function runStartupAnimation() {
    const sleep = (time: number) =>
      new Promise((resolve) => setTimeout(resolve, time));

    serialPort.write(getColorCommand(Colors.RED));
    await sleep(400);
    serialPort.write(getColorCommand(Colors.YELLOW));
    await sleep(400);
    serialPort.write(getColorCommand(Colors.GREEN));
    await sleep(400);
  }
});

serialPort.on('error', (e) => {
  if (!e.message.includes('cannot open')) {
    console.error('Serial port error', e.message);
  }

  setTimeout(() => {
    serialPort.open();
  }, 1000);
});

serialPort.on('close', () => {
  console.log('Disconnected from serial port');

  // Closed is usually because the device was unplugged.
  // Try again in 1s.
  setTimeout(() => {
    serialPort.open();
  }, 1000);
});
