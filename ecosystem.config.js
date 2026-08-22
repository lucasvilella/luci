module.exports = {
  apps: [
    {
      name: "luci-core-api",
      script: "python",
      args: "-m uvicorn app.main:app --host 0.0.0.0 --port 8000",
      cwd: "./",
      interpreter: "none",
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 8000,
        PYTHONUNBUFFERED: "1"
      }
    },
    {
      name: "luci-cloudflared-tunnel",
      script: "cloudflared",
      args: "tunnel run --url http://127.0.0.1:8000",
      cwd: "./",
      interpreter: "none",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        TUNNEL_METRICS: "localhost:2000"
      }
    }
  ]
};
