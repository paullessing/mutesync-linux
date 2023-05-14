export interface Color {
  readonly red: number;
  readonly green: number;
  readonly blue: number;

  /**
   * Change the color's brightness, keeping ratios the same.
   * @param value
   * @returns
   */
  readonly brightness: (value: number) => Color;
}

export function parseHexToNumbers(hex: string): Color {
  hex = hex.replace(/^#/, '');
  return createColor({
    red: parseInt(hex[0], 16) * 16 + parseInt(hex[1], 16),
    green: parseInt(hex[2], 16) * 16 + parseInt(hex[3], 16),
    blue: parseInt(hex[4], 16) * 16 + parseInt(hex[5], 16),
  });
}

function createColor({
  red,
  green,
  blue,
}: {
  red: number;
  green: number;
  blue: number;
}): Color {
  const bounds = (value: number) =>
    Math.floor(Math.max(0, Math.min(255, value)));
  [red, green, blue] = [red, green, blue].map(bounds);
  const maxValue = Math.max(red, green, blue);
  return {
    red,
    green,
    blue,
    brightness: (value: number) => {
      if (maxValue === 0) {
        // Black
        return createColor({
          red: value * 255,
          green: value * 255,
          blue: value * 255,
        });
      }
      const scale = (value * maxValue) / 255;
      return createColor({
        red: red * scale,
        green: green * scale,
        blue: blue * scale,
      });
    },
  };
}
