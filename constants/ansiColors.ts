export interface AnsiPalette {
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export const AnsiColorsLight: AnsiPalette = {
  black: '#1A1A1A',
  red: '#CF222E',
  green: '#2D8A4E',
  yellow: '#BF8700',
  blue: '#0969DA',
  magenta: '#8250DF',
  cyan: '#1B7C83',
  white: '#D0D7DE',
  brightBlack: '#6E7781',
  brightRed: '#E5534B',
  brightGreen: '#3DA665',
  brightYellow: '#D4A017',
  brightBlue: '#539BF5',
  brightMagenta: '#B87FFF',
  brightCyan: '#39C5CF',
  brightWhite: '#FFFFFF',
};

export const AnsiColorsDark: AnsiPalette = {
  black: '#6E7781',
  red: '#E5534B',
  green: '#3DA665',
  yellow: '#D4A017',
  blue: '#539BF5',
  magenta: '#B87FFF',
  cyan: '#39C5CF',
  white: '#E8E0D8',
  brightBlack: '#8B949E',
  brightRed: '#FF7B72',
  brightGreen: '#69DB7C',
  brightYellow: '#FFE066',
  brightBlue: '#91D5FF',
  brightMagenta: '#DA77F2',
  brightCyan: '#99E9F2',
  brightWhite: '#FFFFFF',
};

export function ansiToArray(p: AnsiPalette): string[] {
  return [p.black, p.red, p.green, p.yellow, p.blue, p.magenta, p.cyan, p.white];
}

export function ansiBrightToArray(p: AnsiPalette): string[] {
  return [p.brightBlack, p.brightRed, p.brightGreen, p.brightYellow, p.brightBlue, p.brightMagenta, p.brightCyan, p.brightWhite];
}
