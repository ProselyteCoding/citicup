const express = require('express');
const riskController = require('../controllers/riskController');

const router = express.Router();

// 接口二：上传压力测试情景并获取结果
router.post('/stress-test', riskController.processStressTest);

module.exports = router;