function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

const mainColor = ['primary', 'secondary', 'tertiary'];
const colorType = [
  'primary',
  'secondary',
  'tertiary',
  'neutral',
  'neutral-variant',
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,ts,tsx,jsx}'],
  theme: {
    extend: {
      colors: {
        ...mainColor.reduce(
          (acc, key) =>
            ['key', 'on-key', 'container', 'on-container'].reduce((a, k) => {
              const name = `${key}-${k}`;
              return {
                ...a,
                [name]: withOpacity(`--color-${name}`),
              };
            }, acc),
          {},
        ),
        ...['background', 'on-background', 'surface', 'on-surface'].reduce(
          (a, k) => {
            const name = `neutral-${k}`;
            return {
              ...a,
              [name]: withOpacity(`--color-${name}`),
            };
          },
          {},
        ),
        ...['surface', 'on-surface', 'outline'].reduce((a, k) => {
          const name = `neutral-variant-${k}`;
          return {
            ...a,
            [name]: withOpacity(`--color-${name}`),
          };
        }, {}),
        ...colorType.reduce(
          (acc, key) =>
            [
              '10',
              '20',
              '30',
              '40',
              '50',
              '60',
              '70',
              '80',
              '90',
              '95',
              '100',
            ].reduce((a, k) => {
              const name = `${key}-${k}`;
              return {
                ...a,
                [name]: withOpacity(`--color-${name}`),
              };
            }, acc),
          {},
        ),
      },
    },
  },
  plugins: [],
};
