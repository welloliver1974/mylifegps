module.exports = {
  apps: [
    {
      name: 'my-life360-server',
      script: 'dist/index.js',
      cwd: '/home/ubuntu/my-life360/server',
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
