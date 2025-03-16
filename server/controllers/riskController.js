const aiService = require('../services/aiService');

/**
 * 处理压力测试情景
 */
exports.processStressTest = async (req, res) => {
  try {
    const { scenario } = req.body;
    
    // 验证数据
    if (!scenario || typeof scenario !== 'string') {
      return res.status(400).json({
        success: false,
        message: '无效的压力测试情景'
      });
    }
    
    // 从大模型获取压力测试结果
    const stressTestResult = await aiService.getStressTestResult(scenario);
    
    return res.status(200).json({
      success: true,
      data: stressTestResult
    });
  } catch (error) {
    console.error('压力测试出错:', error);
    return res.status(500).json({
      success: false,
      message: '服务器处理数据时发生错误'
    });
  }
};