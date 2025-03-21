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

- **接口：**  POST /api/portfolio/upload
- **功能：** 上传并存储持仓数据，计算相关风险指标
- **请求体：**

```json
[
    {
        "currency": "EUR/USD",
        "quantity": 1000000,
        "proportion": 0.172,
        "benefit": 2500,
        "dailyVolatility": 0.125,
        "valueAtRisk": "15000", #除了数字不要加特殊符号
        "beta": 1.2,
        "hedgingCost": 0.0015
    },
    // 更多数据
]
```

- **响应：**
相应给前端如下数据：
组合波动率，夏普比率，~~累计收益率，最大回撤，胜率，收益撤回比(可能缺少数据，可以先不做)~~

#### 1.2 获取对冲建议

- **接口：** GET /hedging-advice
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
      "suggestion": "减少EUR敞口"
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

### 2. 风险管理

#### 2.1 压力测试

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
    "probability": 0.01,
    "suggestion": "减少EUR敞口"
  }
}
```

## 数据流程

1. 前端上传持仓数据到 /api/portfolio/upload 端点
2. 后端保存持仓数据并计算基本风险指标
3. 前端请求对冲建议或压力测试结果
4. 后端根据保存的持仓数据调用 AI 服务获取结果
5. 返回结果给前端展示

## AI 模型集成

系统中有两个关键点需要 AI 模型支持：

- 对冲建议生成 - aiService.getHedgingAdvice()
- 压力测试结果 - aiService.getStressTestResult()

详细的 AI 模型接口规范请参考 `docs/aiModelDocs.md`。

## 计算工具

`utils/calculation_utils.js` 提供了多种风险计算功能：

- 计算持仓总价值
- 计算持仓占比
- 计算日波动率
- 计算 VaR
- 计算 Beta 系数
- 计算对冲成本
- 计算投资组合波动率
- 计算夏普比率
- 计算最大回撤等

## 健康检查

访问 [http://localhost:5000/health](http://localhost:5000/health) 可以检查服务是否正常运行。
