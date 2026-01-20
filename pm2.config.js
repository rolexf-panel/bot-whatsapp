module.exports = {
  apps: [
    {
      name: 'companion',
      script: 'server/src/server.js',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'companion-updater',
      script: 'server/src/updater/updater.js',
      env: { NODE_ENV: 'production' }
    }
  ]
};
