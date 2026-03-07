// Vercel Serverless 入口
const app = require('./server');

// Vercel serverless 需要导出 handler
module.exports = (req, res) => {
  return app(req, res);
};
