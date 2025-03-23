# RiskFX 后端服务文档

## 项目概述

RiskFX 是一个外汇风险管理系统，本后端服务负责处理持仓数据分析、风险评估、对冲建议生成等功能，为前端页面提供必要的 API 支持。

## 文件结构

```bash
server/
├── app.py                     # 应用入口文件
├── controllers/               # 控制器目录
│   ├── portfolio_controller.py  # 处理持仓相关请求
│   └── risk_controller.py       # 处理风险相关请求
├── routes/                    # 路由目录
│   ├── portfolio_routes.py      # 持仓相关路由
│   └── risk_routes.py           # 风险相关路由
├── services/                  # 服务目录
│   └── ai_service.py            # AI 模型服务
├── utils/                     # 工具函数目录
│   └── calculation_utils.py     # 计算工具函数
└── docs/                      # 文档目录
    └── ai_model_docs.md         # AI 模型接口文档
```

````markdown
## 依赖项

项目主要依赖以下包：

flask - Web 框架
flask-cors - 跨域资源共享
python-dotenv - 环境变量管理

## 安装与启动

### 安装依赖

```bash
cd server
pip install -r requirements.txt
```
````

### 启动服务器

#### 正常启动

```bash
python app.py
```

#### 使用 Flask CLI 启动（开发模式）

```bash
flask --app app --debug run
```

服务器默认在端口 5000 上运行。可以通过环境变量 `PORT` 修改端口：

```bash
# Linux/Mac
export FLASK_RUN_PORT=3000
flask run

# Windows
set FLASK_RUN_PORT=3000
flask run
```

## API 接口文档

### 1. 持仓数据管理

#### 1.1 上传持仓数据

- **接口：** POST /api/portfolio/upload
- **功能：** 上传并存储持仓数据，计算相关风险指标
- **请求体：**

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
    "currency": "USD/JPY",
    "quantity": 2000000,
    "proportion": 0.45,
    "benefit": -1200,
    "dailyVolatility": 0.085,
    "valueAtRisk": "$25,000",
    "beta": 0.9,
    "hedgingCost": 0.0012
  }
  // 其他数据
]
```

#### 1.2 获取对冲建议

- **接口：** GET /api/portfolio/hedging-advice
- **功能：** 获取基于当前持仓的对冲建议
  **前提条件：** 必须先上传持仓数据
- **响应：**

```json
{
  "success": true,
  "data": {
    "historicalAnalysis": null,
    "currentHedgingAdvice": {
      "volatility": 0.125,
      "emotion": "偏多",
      "suggestion": "减少EUR敞口"
    },
    "positionRiskAssessment": {
      "risk": "高风险",
      "var": "$25,000",
      "suggestion": "减少高风险货币敞口"
    },
    "correlationAnalysis": {
      "relative": "强正相关",
      "estimate": "中等",
      "suggestion": "减少EUR敞口"
    },
    "costBenefitAnalysis": {
      "cost": 0.0015,
      "influence": "高",
      "suggestion": "减少EUR敞口"
    },
    "recommendedPositions": [
      {
        "currency": "USD",
        "quantity": 10000
      },
      {
        "currency": "EUR",
        "quantity": 8000
      }
    ]
  }
}
```

#### 1.3 货币预测

- **URL**: /api/risk/currency-prediction
- **方法**: POST
- **参数格式**:

```json
{
  "currency": "EUR/USD"
}
```

- **返回格式**:

```json
{
  "success": true,
  "data": {
    "upper": 1.12,
    "lower": 1.08
  }
}
```

### 2. 风险管理

#### 2.1 风险信号分析

- **URL**: /api/portfolio/risk-signals
- **方法**: GET
- **参数**: 无（使用之前上传的持仓数据）
- **返回格式**:

```json
{
  "success": true,
  "data": {
    "current": {
      "credit": 4.0,
      "policy": 6.0,
      "market": 2.0,
      "politician": 4.0,
      "economy": 5.0
    },
    "warning": {
      "credit": 6.0,
      "policy": 7.0,
      "market": 4.0,
      "politician": 6.0,
      "economy": 6.0
    }
  }
}
```

#### 2.2 压力测试

- **接口：** POST /api/risk/stress-test
- **功能：** 根据提供的情景进行压力测试
- **请求体：**

```json
{
  "scenario": "美联储加息100bp"
}
```

- **响应：**

```json
{
  "success": true,
  "data": {
    "scenario": "美联储加息100bp",
    "influence": "高",
    "probability": 0.4,
    "suggestion": "减少EUR敞口",
    "money": 25000.0
  }
}
```

## 健康检查

访问 [http://localhost:5000/health](http://localhost:5000/health) 可以检查服务是否正常运行。

### 前端调用举例

```js
// 上传持仓数据
const uploadPortfolio = async (portfolioData) => {
  const response = await fetch("/api/portfolio/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(portfolioData),
  });
  return await response.json();
};

// 获取对冲建议
const fetchHedgingAdvice = async () => {
  try {
    const response = await fetch('/api/portfolio/hedging-advice');
    if (!response.ok) throw new Error('请求失败');
    const data = await response.json();
    if (data.success) {
      // 处理返回的对冲建议
      console.log(data.data);
    }
  } catch (error) {
    console.error('获取对冲建议失败:', error);
  }
};
// 获取风险信号分析
const getRiskSignals = async () => {
  const response = await fetch("/api/portfolio/risk-signals");
  return await response.json();
};

// 提交压力测试
const submitStressTest = async (scenario) => {
  try {
    const response = await fetch('/api/risk/stress-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    if (!response.ok) throw new Error('请求失败');
    const data = await response.json();
    if (data.success) {
      // 处理返回的压力测试结果
      console.log(data.data);
    }
  } catch (error) {
    console.error('提交压力测试失败:', error);
  }
};

// 获取货币预测
const getCurrencyPrediction = async (currency) => {
  const response = await fetch("/api/risk/currency-prediction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currency }),
  });
  return await response.json();
};
```
