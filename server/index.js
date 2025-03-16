const express = require('express');
const cors = require('cors');
const portfolioRoutes = require('./routes/portfolioRoutes');
const riskRoutes = require('./routes/riskRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 从app.js添加

// 路由
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/risk', riskRoutes);

// 基础路由，用于测试服务器是否正常运行
app.get('/', (req, res) => {
  res.send('RiskFX API 服务运行正常');
});

// 健康检查路由 (从app.js添加)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'RiskFX服务运行正常' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`RiskFX 服务器正在端口 ${PORT} 上运行`);
});

// 添加模块导出
module.exports = app;