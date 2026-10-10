// Flat colors and zero-blur depth are shared by every mobile screen.
export const palette = {
  ink: '#111111', paper: '#FFFDF4', yellow: '#FFE335', blue: '#2455FF',
  pink: '#FF82BF', mint: '#8FE8BC', red: '#D92532', coral: '#FF5148', purple: '#BB9AFF',
};

export const COLORS = {
  primary: palette.ink, background: palette.yellow, secondary: palette.yellow,
  surface: palette.paper, surfaceOff: '#F2F0E6', inputFill: palette.paper,
  border: palette.ink, textDark: palette.ink, textMuted: '#454545', muted: '#454545',
  pinkRed: palette.red, greenLight: '#16633B', orangeShine: '#8F4500',
  blueSea: '#2148CE', accent: palette.red, error: palette.red, inactive: '#454545',
};

export const frame = { borderWidth: 3, borderColor: palette.ink, borderRadius: 0 };
// React Native's New Architecture boxShadow has true, unblurred Android/iOS depth.
export const hardShadow = { boxShadow: '4px 4px 0px 0px #111111' };
export const fonts = { title: 'Silkscreen_700Bold', pixel: 'Silkscreen_400Regular', body: 'Poppins_400Regular', bold: 'Poppins_700Bold' };
