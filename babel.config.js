module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle migrations are bundled as inline .sql strings.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
