const express = require('express');
const portfolioController = require('../controllers/portfolioController');

const router = express.Router();

// 接口一：上传持仓数据
router.post('/upload', portfolioController.uploadPortfolio);

// 接口三：获取页面三相关信息
router.get('/hedging-advice', portfolioController.getHedgingAdvice);

module.exports = router;