import React from 'react';
import color from 'color';
import { createShared } from '@zhujianshi/use-lens';

type RGB = readonly [number, number, number];
type Palette = Record<
  10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 95 | 99,
  RGB
>;

type ColorValue = Record<
  'primary' | 'secondary' | 'tertiary',
  {
    key: RGB;
    'on-key': RGB;
    container: RGB;
    'on-container': RGB;
  } & Palette
> & {
  neutral: {
    background: RGB;
    'on-background': RGB;
    surface: RGB;
    'on-surface': RGB;
  } & Palette;
  'neutral-variant': {
    surface: RGB;
    'on-surface': RGB;
    outline: RGB;
  } & Palette;
};

type ColorInput = Record<
  'primary' | 'secondary' | 'tertiary' | 'neutral' | 'neutral-variant',
  RGB
>;

export const ColorContextInfo = createShared<
  ColorInput & { theme: 'light' | 'dark' }
>({
  theme: 'light',
  primary: [58, 104, 29],
  secondary: [85, 100, 76],
  tertiary: [23, 103, 105],
  neutral: [93, 95, 90],
  'neutral-variant': [90, 96, 86],
});

const ColorValueContext = React.createContext<ColorValue | null>(null);
export const useColorValue = () => React.useContext(ColorValueContext)!;

// export const ColorProvider = ({}) => {};

const PaletteKey = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99] as const;
const calcColorValue = (colorInput: ColorInput, theme: 'light' | 'dark') => {
  const colorValue: ColorValue = {
    ...(['primary', 'secondary', 'tertiary'] as const).reduce((acc, key) => {
      const c = color.rgb(colorInput[key]);
      return {
        ...acc,
        [key]: {
          key:
            theme === 'light'
              ? c.lightness(40).rgb().array()
              : c.lightness(80).rgb().array(),
          'on-key':
            theme === 'light'
              ? c.lightness(100).rgb().array()
              : c.lightness(20).rgb().array(),
          container:
            theme === 'light'
              ? c.lightness(90).rgb().array()
              : c.lightness(30).rgb().array(),
          'on-container':
            theme === 'light'
              ? c.lightness(10).rgb().array()
              : c.lightness(90).rgb().array(),
          ...PaletteKey.reduce(
            (_a, k) => ({
              ..._a,
              [k]: c.lightness(k).rgb().array(),
            }),
            {},
          ),
        },
      };
    }, {} as any),
    ...(() => {
      const c = color.rgb(colorInput.neutral);
      return {
        neutral: {
          background:
            theme === 'light'
              ? c.lightness(99).rgb().array()
              : c.lightness(10).rgb().array(),
          'on-background':
            theme === 'light'
              ? c.lightness(10).rgb().array()
              : c.lightness(90).rgb().array(),
          surface:
            theme === 'light'
              ? c.lightness(99).rgb().array()
              : c.lightness(10).rgb().array(),
          'on-surface':
            theme === 'light'
              ? c.lightness(10).rgb().array()
              : c.lightness(90).rgb().array(),
          ...PaletteKey.reduce(
            (_a, k) => ({
              ..._a,
              [k]: c.lightness(k).rgb().array(),
            }),
            {},
          ),
        },
      };
    })(),
    ...(() => {
      const c = color.rgb(colorInput['neutral-variant']);
      return {
        'neutral-variant': {
          surface:
            theme === 'light'
              ? c.lightness(90).rgb().array()
              : c.lightness(30).rgb().array(),
          'on-surface':
            theme === 'light'
              ? c.lightness(30).rgb().array()
              : c.lightness(80).rgb().array(),
          outline:
            theme === 'light'
              ? c.lightness(50).rgb().array()
              : c.lightness(60).rgb().array(),
          ...PaletteKey.reduce(
            (_a, k) => ({
              ..._a,
              [k]: c.lightness(k).rgb().array(),
            }),
            {},
          ),
        },
      };
    })(),
  };

  const injectedCss = Object.entries(colorValue)
    .reduce(
      (acc, [category, info]) =>
        Object.entries(info).reduce(
          (a, [key, value]) =>
            a.concat(`--color-${category}-${key}: ${value.join(', ')};`),
          acc,
        ),
      [] as string[],
    )
    .join('\n');
  return [colorValue, injectedCss] as const;
};

export const ColorThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const colorInfo = React.useDeferredValue(
    ColorContextInfo.useGetting(ColorContextInfo.storeLens),
  );
  const [colorValue, injectedCss] = React.useMemo(
    () => calcColorValue(colorInfo, colorInfo.theme),
    [colorInfo],
  );
  React.useInsertionEffect(() => {
    const styleElement = document.createElement('style');
    const styleRule = `
      * {
        ${injectedCss}
      }
    `;
    styleElement.innerHTML = styleRule;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [injectedCss]);

  return (
    <ColorValueContext.Provider value={colorValue}>
      {children}
    </ColorValueContext.Provider>
  );
};
