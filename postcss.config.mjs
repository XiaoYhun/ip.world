/** @type {import('postcss').ProcessOptions} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    ...(process.env.NODE_ENV === 'production' && {
      autoprefixer: {},
      cssnano: {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          mergeLonghand: true,
          colormin: true,
          convertValues: true,
          discardDuplicates: true,
        }],
      },
    }),
  },
}

export default config
