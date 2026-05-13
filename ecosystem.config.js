module.exports = {
  apps: [
    {
      name: 'expense-tracker-api',
      script: 'packages/api/dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      out_file: '/var/logs/pixel_pocket/api-out.log',
      error_file: '/var/logs/pixel_pocket/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
