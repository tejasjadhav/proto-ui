module.exports = {
  webpack: {
    configure: {
      target: 'electron-renderer',
    },
  },
  jest: {
    configure: {
      roots: [
        '<rootDir>/electron',
      ],
      testMatch: [
        '<rootDir>/electron/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/electron/**/*.{spec,test}.{js,jsx,ts,tsx}',
      ],
    },
  },
};
