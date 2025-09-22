module.exports = {
  apps: [
    {
      name: "backend",
      script: "backend/server.js",
      watch: false
    },
    {
      name: "frontend",
      script: "npm",
      args: "start --prefix src/app",
      watch: false
    }
  ]
};
