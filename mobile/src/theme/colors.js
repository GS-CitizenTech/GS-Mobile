const palettes = {
  light: {
    primary: '#075B78',
    primaryDark: '#06445C',
    primaryLight: '#E2F3F7',
    secondary: '#087E8B',
    secondaryLight: '#DDF3F1',
    background: '#F3F7FA',
    surface: '#FFFFFF',
    surfaceMuted: '#F8FAFC',
    text: '#102A43',
    textSecondary: '#526779',
    textLight: '#FFFFFF',
    border: '#DCE6ED',
    success: '#16794B',
    successLight: '#E1F4E9',
    warning: '#A85B08',
    warningLight: '#FFF2D8',
    danger: '#B42332',
    dangerLight: '#FDE8E9',
    critical: '#7A1D2B',
    criticalLight: '#F9DADD',
    disabled: '#91A2B2',
    overlay: '#102A4380',
  },
  dark: {
    primary: '#20A4BF',
    primaryDark: '#9ADCE8',
    primaryLight: '#183B49',
    secondary: '#39B8AD',
    secondaryLight: '#173F3B',
    background: '#0B1420',
    surface: '#121F2D',
    surfaceMuted: '#192A3A',
    text: '#EAF2F8',
    textSecondary: '#A9BAC8',
    textLight: '#06131B',
    border: '#2A3B4B',
    success: '#53D49A',
    successLight: '#173C32',
    warning: '#F2BD70',
    warningLight: '#44351F',
    danger: '#FF8791',
    dangerLight: '#44252D',
    critical: '#FF9AA3',
    criticalLight: '#4A242D',
    disabled: '#718496',
    overlay: '#02070CCC',
  },
};

let activeMode = 'light';
let activeColors = palettes.light;
let themeVersion = 0;

export function setActiveTheme(mode) {
  const nextMode = mode === 'dark' ? 'dark' : 'light';
  if (nextMode !== activeMode) {
    activeMode = nextMode;
    activeColors = palettes[nextMode];
    themeVersion += 1;
  }
}

export function getActiveTheme() {
  return activeMode;
}

export function getActiveColors() {
  return activeColors;
}

export function getThemeVersion() {
  return themeVersion;
}

const colors = new Proxy({}, {
  get(_target, property) {
    return activeColors[property];
  },
  ownKeys() {
    return Reflect.ownKeys(activeColors);
  },
  getOwnPropertyDescriptor(_target, property) {
    if (Object.prototype.hasOwnProperty.call(activeColors, property)) {
      return { enumerable: true, configurable: true, value: activeColors[property] };
    }
    return undefined;
  },
});

export default colors;
