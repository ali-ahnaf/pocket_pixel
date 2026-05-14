module.exports = {
  apps: [
    {
      name: 'pocket-pixel',
      script: 'packages/api/dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      out_file: '/var/logs/pocket_pixel/api-out.log',
      error_file: '/var/logs/pocket_pixel/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
