# RiskFX 项目交互文档

接口部分需要前后端结合实现，请仔细阅读并参考构建。

## 接口一：页面三上传持仓数据

前端向后端以post方式发送json格式的持仓数据表格

json数据格式：

```json
[
  {
    "currency": "USD/JPY",     // 货币对 string
    "quantity": 10000,         // 持仓量 number
    "proportion": 0.5,         // 持仓占比 number
    "benefit": -1000,          // 盈亏 number（修正冒号为英文符号）
    "dailyVolatility": 0.125,  // 日波动率 number
    "valueAtRisk": "15000",  // VaR(95%) string ！这里需要修改，不要加逗号，和$这个符号
    "beta": 1.2,               // Beta number
    "hedgingCost": 0.0015      // 对冲成本 number
  }
  // ...（多个持仓对象）
]
```

## 接口二：页面三上传压力测试情景

前端向后端以post方式发送json格式的压力测试情景并获取测试分析结果

发送json数据格式：

```json
{
  scenario:"爆发新一轮全球经济危机" // 压力测试情景描述 string
}
```

返回json数据格式：

```json
{
    scenario:"爆发新一轮全球经济危机" // 压力测试情景描述 string
    influence: "高", // 影响程度 string 高/中/低
    probability: 0.01, // 发生概率 number
    suggestion: "减少EUR敞口" // 建议措施 string
}
```

## 接口三：页面三接受页面三相关信息

前端向后端以get方式获取页面三相关信息

后端返回json数据格式：

```json
{
  "historicalAnalysis": null,  // 历史回测分析（暂未提供）
  
  "currentHedgingAdvice": {
    "volatility": 0.125,       // 波动率 number（12.5%转换为小数）
    "emotion": "偏多",         // 市场情绪指标 string
    "suggestion": "减少EUR敞口"
  },
  
  "positionRiskAssessment": {
    "risk": "高风险",          // 当前风险敞口 string
    "var": "$25,000",          // VaR(95%)
    "suggestion": "减少EUR敞口"
  },
  
  "correlationAnalysis": {
    "relative": "强正相关",     // 货币对相关性 string
    "estimate": "中等",        // 对冲效果预估 string
    "suggestion": "减少EUR敞口"  // 修正拼写错误
  },
  
  "costBenefitAnalysis": {
    "cost": 0.0015,            // 对冲成本 number（0.15%转换为小数）
    "influence": "高",         // 影响程度 string
    "suggestion": "减少EUR敞口"
  },
  
  "recommendedPositions": [    // 货币建议持仓
    {
      "currency": "USD/JPY",  // 货币对 string
      "quantity": 10000 // 持仓量 number
    },
    // ...其他持仓
  ]
}
```

## 接口四：获取页面二相关风险信息

向后端发送get请求，请求页面二相关风险信息

后端发送数据格式(json)：

``` json
{
  "currencyExposure": [      // 高风险货币列表
    {
      "currency": "USD/JPY",  // 货币对 string
      "riskRate": "高风险", // 风险率 string
      "tendency": "上" // 趋势 string
    },
    // ...其他货币对
  ],    

  "termRiskDistribution": [    // 账期风险分布
    {
      "time": 30,              // 时间分区（单位：天）
      "risk": 0.01
    }
    // ...其他时间段
  ],
  
  "riskTransmissionPath": ["JPY30","GBP40","USD50"], // 风险传导路径
  
  "macroRiskCoefficients": [   // 宏观风险系数(ERI)
    {
      "month": 1,              // 月份
      "all": 80,               // 综合指数
      "economy": 60,           // 经济指数
      "policy": 40,            // 政策指标
      "market": 20             // 市场指标
    },
    // ...其他月份
  ],
  
  "riskSignalAnalysis": {
    "current": {
      "credit": 80,            // 信用风险
      "policy": 20,            // 政策风险
      "market": 10,            // 市场流动性
      "politician": 30,        // 政治风险
      "economy": 40            // 经济风险
    },
    "warning": {               // 预警阈值
      "credit": 80,
      "policy": 20,
      "market": 10,
      "politician": 30,
      "economy": 40
    }
  },
  
  "singleCurrencyAnalysis": [  // 单一货币对回测分析
    {
      "currency": "USD",
      "upper": 1.0513,         // 预测上限
      "lower": 0.9487          // 预测下限
    },
    // ...其他货币对
  ]
}
```
