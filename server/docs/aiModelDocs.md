# AI 模型接入文档

## 概述

本文档描述了外汇风险管理系统中需要接入大模型的接口，以及大模型预期的输入输出格式。系统中有两个主要接口需要大模型提供数据支持：

- 获取对冲建议（页面三）
- 获取压力测试结果（页面二）

---

## 1. 对冲建议接口（getHedgingAdvice）

### 接口说明

该接口用于根据用户上传的持仓数据，生成智能对冲建议，包括市场波动性分析、头寸风险评估、相关性分析和成本效益分析等。

### 输入数据

大模型接收的是用户上传的持仓数据数组，格式如下：

```json
[
  {
    "currency": "EUR/USD", // 货币对
    "quantity": 1000000, // 持仓量
    "proportion": 0.35, // 持仓占比（可由系统计算得出）
    "benefit": 2500, // 盈亏
    "dailyVolatility": 0.125, // 日波动率
    "valueAtRisk": "$15,000", // VaR(95%)
    "beta": 1.2, // Beta系数
    "hedgingCost": 0.0015 // 对冲成本
  },
  {
    "currency": "USD/JPY",
    "quantity": 2000000,
    "proportion": 0.45,
    "benefit": -1200,
    "dailyVolatility": 0.085,
    "valueAtRisk": "$25,000",
    "beta": 0.9,
    "hedgingCost": 0.0012
  }
  // 更多货币对数据...
]
```

### 输出格式

大模型需要返回以下格式的对冲建议：

```json
{
  "historicalAnalysis": null, // 预留字段，暂时未使用

  "currentHedgingAdvice": {
    "volatility": 0.125, // 市场波动率，数值型，范围0-1
    "emotion": "偏多", // 市场情绪，字符串，例如"偏多"、"偏空"、"中性"
    "suggestion": "减少EUR敞口" // 对冲建议，简短描述性文本
  },

  "positionRiskAssessment": {
    "risk": "高风险", // 风险评级，字符串，例如"高风险"、"中风险"、"低风险"
    "var": "$25,000", // 风险价值，格式化的字符串
    "suggestion": "减少EUR敞口" // 风险管理建议，简短描述性文本
  },

  "correlationAnalysis": {
    "relative": "强正相关", // 货币对相关性，字符串，例如"强正相关"、"弱负相关"、"无相关"等
    "estimate": "中等", // 对冲效果预估，字符串，例如"高"、"中等"、"低"
    "suggestion": "选择负相关货币对进行对冲" // 相关性建议，简短描述性文本
  },

  "costBenefitAnalysis": {
    "cost": 0.0015, // 对冲成本，数值型，范围0-1
    "influence": "低", // 收益率影响，字符串，例如"高"、"中"、"低"
    "suggestion": "进行策略性对冲" // 成本收益建议，简短描述性文本
  },

  "recommendedPositions": [
    // 建议持仓，数组
    {
      "currency": "USD", // 货币
      "quantity": 10000 // 建议持仓量
    },
    {
      "currency": "EUR",
      "quantity": 8000
    }
    // 更多建议持仓...
  ]
}
```

### 大模型处理逻辑

大模型应基于以下逻辑生成对冲建议：

- **波动率分析：**

分析每个货币对的日波动率，计算组合波动率
根据市场整体波动情况，给出市场情绪判断

- **风险评估：**

基于 VaR 值和持仓规模，评估当前风险等级
对风险较高的货币对提出相应的对冲建议

- **相关性分析：**

分析各货币对之间的相关性，识别强相关和弱相关的货币对
提出利用低相关或负相关货币对进行对冲的建议

- **成本效益分析：**

考虑对冲成本与潜在风险的对比
给出最具成本效益的对冲策略

- **建议持仓：**

根据上述分析，提出具体的建议持仓量
建议持仓与现有持仓的差额即为对冲量

## 2. 压力测试接口（getStressTestResult）

### 接口说明

该接口用于根据用户提供的压力测试情景，生成相应的压力测试结果，评估特定情况下的潜在风险和损失。

### 输入数据

大模型接收的是一个情景描述字符串，例如：

```json
{
  "scenario": "美联储加息100bp"
}
```

其他可能的情景例子：

- "欧债危机恶化"
- "英国脱欧影响"
- "中东地缘政治紧张"
- "全球经济衰退"

### 输出格式

大模型需要返回以下格式的压力测试结果：

```json
{
  "scenario": "美联储加息100bp", // 测试情景
  "influence": "高", // 影响程度，字符串，例如"高"、"中"、"低"
  "probability": 0.15, // 发生概率，数值型，范围0-1
  "suggestion": "增加USD/JPY对冲比例" // 建议措施，简短描述性文本
}
```

### 大模型处理逻辑

大模型应基于以下逻辑生成压力测试结果：

- **情景分析：**

理解输入的情景描述，识别其涉及的货币对和市场影响
根据情景的严重性，评估其对不同货币对的影响程度

- **发生概率评估：**

基于历史数据和当前市场环境，估计该情景的发生概率

- **建议措施：**

根据情景和影响分析，提出具体的风险缓解措施
包括可能的对冲策略、头寸调整或风险转移方案

## 代码集成说明

大模型的接入点位于 `aiService.js` 文件中，需要实现以下两个函数：

```javascript
exports.getHedgingAdvice = async (portfolioData) => { ... }
exports.getStressTestResult = async (scenario) => { ... }
```

## 数据格式参考

### 持仓数据示例

```json
[
  {
    "currency": "EUR/USD",
    "quantity": 1000000,
    "proportion": 0.35,
    "benefit": 2500,
    "dailyVolatility": 0.125,
    "valueAtRisk": "$15,000",
    "beta": 1.2,
    "hedgingCost": 0.0015
  },
  {
    "currency": "GBP/USD",
    "quantity": 800000,
    "proportion": 0.25,
    "benefit": 1800,
    "dailyVolatility": 0.112,
    "valueAtRisk": "$12,000",
    "beta": 1.1,
    "hedgingCost": 0.0018
  },
  {
    "currency": "USD/JPY",
    "quantity": 2000000,
    "proportion": 0.4,
    "benefit": -1200,
    "dailyVolatility": 0.085,
    "valueAtRisk": "$25,000",
    "beta": 0.9,
    "hedgingCost": 0.0012
  }
]
```

### 对冲建议响应示例

```json
{
  "historicalAnalysis": null,

  "currentHedgingAdvice": {
    "volatility": 0.125,
    "emotion": "偏空",
    "suggestion": "增加JPY敞口，减少EUR敞口"
  },

  "positionRiskAssessment": {
    "risk": "中风险",
    "var": "$42,000",
    "suggestion": "分散持仓，降低单一货币敞口"
  },

  "correlationAnalysis": {
    "relative": "中等正相关",
    "estimate": "高效",
    "suggestion": "利用JPY对冲EUR和GBP风险"
  },

  "costBenefitAnalysis": {
    "cost": 0.0014,
    "influence": "中",
    "suggestion": "成本合理，建议实施对冲"
  },

  "recommendedPositions": [
    {
      "currency": "EUR",
      "quantity": 800000
    },
    {
      "currency": "GBP",
      "quantity": 700000
    },
    {
      "currency": "JPY",
      "quantity": 2200000
    }
  ]
}
```

### 压力测试情景示例

```json
{
  "scenario": "中东地缘政治紧张导致原油价格上涨30%"
}
```

### 压力测试结果响应示例

```json
{
  "scenario": "中东地缘政治紧张导致原油价格上涨30%",
  "influence": "中",
  "probability": 0.22,
  "suggestion": "增加对石油出口国货币的对冲"
}
```
