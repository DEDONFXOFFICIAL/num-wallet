module.exports = function (api) {
  api.cache(true);
  const isProd = process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production';
  return {
    presets: ['babel-preset-expo'],
    plugins: isProd ? [['transform-remove-console', { exclude: ['error', 'warn'] }]] : [],
  };
};
