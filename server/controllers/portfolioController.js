const calculationUtils = require('../utils/calculationUtils');
const aiService = require('../services/aiService');

// 保存当前上传的持仓数据
let currentPortfolio = [];

/**
 * 处理上传持仓数据
 */
exports.uploadPortfolio = async (req, res) => {
  try {
    const portfolioData = req.body;
    
    // 验证数据
    if (!Array.isArray(portfolioData) || portfolioData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的持仓数据格式' 
      });
    }
    
    // 存储数据
    currentPortfolio = portfolioData;
    
    // 计算相关指标
    const totalValue = calculationUtils.calculateTotalValue(portfolioData);
    const portfolioVolatility = calculationUtils.calculatePortfolioVolatility(portfolioData);
    const sharpeRatio = calculationUtils.calculateSharpeRatio(portfolioData);
    
    return res.status(200).json({ 
      success: true, 
      message: '持仓数据上传成功',
      data: {
        totalValue,
        portfolioVolatility,
        sharpeRatio
      }
    });
  } catch (error) {
    console.error('上传持仓数据出错:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器处理数据时发生错误' 
    });
  }
};

/**
 * 获取对冲建议
 */
exports.getHedgingAdvice = async (req, res) => {
  try {
    // 检查是否有持仓数据
    if (!currentPortfolio || currentPortfolio.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未找到持仓数据，请先上传'
      });
    }
    
    // 从大模型获取对冲建议
    const hedgingAdvice = await aiService.getHedgingAdvice(currentPortfolio);
    
    return res.status(200).json({
      success: true,
      data: hedgingAdvice
    });
  } catch (error) {
    console.error('获取对冲建议出错:', error);
    return res.status(500).json({
      success: false,
      message: '服务器处理数据时发生错误'
    });
  }
};