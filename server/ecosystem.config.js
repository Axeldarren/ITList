module.exports = {
  apps: [
    {
      name: 'pm-app-backend',
      script: 'dist/src/index.js',
      cwd: '/var/www/bmrapi/tf_itlist_new/server',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8008
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      watch: false,
      autorestart: true
    }
  ]
};