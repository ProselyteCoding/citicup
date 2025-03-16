/**
 * 计算工具函数库
 * 实现对外汇风险管理所需的各类指标计算
 */

/**
 * 计算投资组合总价值
 * 公式：总持仓价值 = ∑ (持仓量 × 该货币对汇率)
 * @param {Array} portfolioData - 持仓数据
 * @returns {number} 总价值
 */
exports.calculateTotalValue = (portfolioData) => {
    if (!Array.isArray(portfolioData) || portfolioData.length === 0) {
      return 0;
    }
  
    return portfolioData.reduce((total, position) => {
      // 假设每个position对象包含quantity和rate属性
      const value = position.quantity * (position.rate || 1);
      return total + value;
    }, 0);
  };
  
  /**
   * 计算持仓占比
   * 公式：持仓占比 = (单个货币对持仓量 / 总持仓价值) × 100%
   * @param {Array} portfolioData - 所有持仓数据
   * @returns {Array} 带有计算后持仓占比的投资组合
   */
  exports.calculatePositionRatios = (portfolioData) => {
    if (!Array.isArray(portfolioData) || portfolioData.length === 0) {
      return [];
    }
  
    const totalValue = exports.calculateTotalValue(portfolioData);
    if (totalValue === 0) return portfolioData;
    
    return portfolioData.map(position => {
      const positionValue = position.quantity * (position.rate || 1);
      const proportion = (positionValue / totalValue);
      return {
        ...position,
        proportion
      };
    });
  };
  
  /**
   * 计算盈亏
   * 公式：盈亏 = (当前市场价格 - 开仓价格) × 持仓量
   * @param {Object} position - 单个持仓数据
   * @returns {number} 盈亏金额
   */
  exports.calculateProfitLoss = (position) => {
    if (!position || !position.quantity) {
      return 0;
    }
    
    const currentPrice = position.currentPrice || 0;
    const openPrice = position.openPrice || 0;
    
    return (currentPrice - openPrice) * position.quantity;
  };
  
  /**
   * 计算日波动率
   * 公式：日波动率 = 该货币对价格的标准差（基于历史数据）
   * @param {Array} historicalData - 历史价格数据
   * @returns {number} 日波动率
   */
  exports.calculateDailyVolatility = (historicalData) => {
    if (!Array.isArray(historicalData) || historicalData.length <= 1) {
      return 0;
    }
    
    // 计算价格的对数收益率
    const returns = [];
    for (let i = 1; i < historicalData.length; i++) {
      const prevPrice = historicalData[i-1].price;
      const currentPrice = historicalData[i].price;
      if (prevPrice > 0 && currentPrice > 0) {
        returns.push(Math.log(currentPrice / prevPrice));
      }
    }
    
    // 计算收益率的标准差
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
    
    return Math.sqrt(variance);
  };
  
  /**
   * 计算VaR (95%)
   * 公式：VaR(95%) = 投资组合价值 × 日波动率 × 正态分布 95% 分位数（即Z值（95%）=1.645）
   * @param {number} portfolioValue - 投资组合价值
   * @param {number} dailyVolatility - 日波动率
   * @returns {string} 格式化的VaR值
   */
  exports.calculateVaR = (portfolioValue, dailyVolatility) => {
    if (!portfolioValue || !dailyVolatility) return "$0";
    
    const zScore = 1.645; // 95%置信区间对应的Z值
    const var95 = portfolioValue * dailyVolatility * zScore;
    
    return `$${Math.round(var95).toLocaleString()}`;
  };
  
  /**
   * 计算Beta系数
   * 公式：Beta = 该货币对收益率与市场基准收益率的协方差 / 市场收益率方差
   * @param {Array} assetReturns - 资产收益率数组
   * @param {Array} marketReturns - 市场基准收益率数组
   * @returns {number} Beta系数
   */
  exports.calculateBeta = (assetReturns, marketReturns) => {
    if (!Array.isArray(assetReturns) || !Array.isArray(marketReturns) || 
        assetReturns.length !== marketReturns.length || assetReturns.length === 0) {
      return 1; // 默认值
    }
    
    // 计算均值
    const assetMean = assetReturns.reduce((sum, val) => sum + val, 0) / assetReturns.length;
    const marketMean = marketReturns.reduce((sum, val) => sum + val, 0) / marketReturns.length;
    
    // 计算协方差和市场方差
    let covariance = 0;
    let marketVariance = 0;
    
    for (let i = 0; i < assetReturns.length; i++) {
      covariance += (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
      marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }
    
    covariance /= assetReturns.length;
    marketVariance /= marketReturns.length;
    
    return marketVariance === 0 ? 1 : covariance / marketVariance;
  };
  
  /**
   * 计算对冲成本
   * 公式：对冲成本 = (对冲工具成本 / 总持仓价值) × 100%
   * @param {number} hedgingToolCost - 对冲工具成本
   * @param {number} portfolioValue - 总持仓价值
   * @returns {number} 对冲成本比例
   */
  exports.calculateHedgingCost = (hedgingToolCost, portfolioValue) => {
    if (!hedgingToolCost || !portfolioValue || portfolioValue === 0) {
      return 0;
    }
    
    return hedgingToolCost / portfolioValue;
  };
  
  /**
   * 计算投资组合波动率
   * 考虑资产间相关性的完整计算较为复杂，此处提供简化版本
   * @param {Array} portfolioData - 持仓数据
   * @returns {number} 投资组合波动率
   */
  exports.calculatePortfolioVolatility = (portfolioData) => {
    if (!Array.isArray(portfolioData) || portfolioData.length === 0) {
      return 0;
    }
    
    // 简化计算：加权平均日波动率
    const totalValue = exports.calculateTotalValue(portfolioData);
    
    if (totalValue === 0) return 0;
    
    let weightedVolatility = 0;
    
    portfolioData.forEach(position => {
      const weight = (position.quantity * (position.rate || 1)) / totalValue;
      weightedVolatility += weight * (position.dailyVolatility || 0);
    });
    
    return weightedVolatility;
  };
  
  /**
   * 计算夏普比率
   * 公式：（投资组合的预期收益率 - 无风险收益率）/ 投资组合的标准差
   * @param {Array} portfolioData - 持仓数据
   * @param {number} riskFreeRate - 无风险收益率（默认3%）
   * @returns {number} 夏普比率
   */
  exports.calculateSharpeRatio = (portfolioData, riskFreeRate = 0.03) => {
    if (!Array.isArray(portfolioData) || portfolioData.length === 0) {
      return 0;
    }
    
    // 计算投资组合的预期收益率(简化)
    const expectedReturn = 0.08; // 这里使用固定值，实际应该基于历史数据计算
    
    // 计算投资组合波动率
    const volatility = exports.calculatePortfolioVolatility(portfolioData);
    
    if (volatility === 0) return 0;
    
    return (expectedReturn - riskFreeRate) / volatility;
  };
  
  /**
   * 处理上传的持仓数据，计算所有需要的指标
   * @param {Array} rawData - 原始上传数据
   * @returns {Array} 处理后的完整数据
   */
  exports.processPortfolioData = (rawData) => {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }
    
    // 标准化数据
    let processedData = rawData.map(item => {
      return {
        currency: item.currency || '',
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 1,
        currentPrice: Number(item.currentPrice) || 0,
        openPrice: Number(item.openPrice) || 0,
        dailyVolatility: Number(item.dailyVolatility) || 0
      };
    });
    
    // 计算持仓占比
    processedData = exports.calculatePositionRatios(processedData);
    
    // 计算每个持仓的盈亏
    processedData = processedData.map(position => {
      return {
        ...position,
        benefit: exports.calculateProfitLoss(position)
      };
    });
    
    return processedData;
  };
  
  /**
   * 格式化币值显示
   * @param {number} value - 数值
   * @returns {string} 格式化的币值字符串
   */
  exports.formatCurrency = (value) => {
    return `$${Math.abs(value).toLocaleString()}`;
  };
  
  /**
   * 计算累计收益率
   * @param {number} finalValue - 最终价值
   * @param {number} initialValue - 初始价值
   * @returns {number} 百分比形式的收益率
   */
  exports.calculateCumulativeReturn = (finalValue, initialValue) => {
    if (!finalValue || !initialValue || initialValue === 0) {
      return 0;
    }
    
    return ((finalValue - initialValue) / initialValue);
  };
  
  /**
   * 计算最大回撤
   * @param {Array} valueHistory - 价值历史数据
   * @returns {number} 最大回撤（百分比形式）
   */
  exports.calculateMaxDrawdown = (valueHistory) => {
    if (!Array.isArray(valueHistory) || valueHistory.length <= 1) {
      return 0;
    }
    
    let maxDrawdown = 0;
    let peak = valueHistory[0];
    
    for (const value of valueHistory) {
      if (value > peak) {
        peak = value;
      } else if (peak > 0) {
        const drawdown = (peak - value) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    return maxDrawdown;
  };