module.exports = {
  apps: [
    {
      name: "backend",
      script: "backend/server.js",
      cwd: "/app",
      env: {
        PORT: 4000
      }
    },
    {
      name: "frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/app",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
