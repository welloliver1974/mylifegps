const path = require('path');

// Permite sobrescrever o caminho com APP_DIR (útil se o usuário não for "ubuntu")
const appDir = process.env.APP_DIR || path.join(process.env.HOME || '/home/ubuntu', 'my-life360');

module.exports = {
  apps: [
    {
      name: 'my-life360-server',
      script: 'dist/index.js',
      cwd: path.join(appDir, 'server'),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        DATABASE_URL: 'file:./prod.db',
      },
    },
  ],
};
