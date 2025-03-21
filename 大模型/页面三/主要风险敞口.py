def determine_risk_level(proportion, daily_volatility):
    # 根据持仓比例判断风险等级
    if proportion > 1 / 3:
        proportion_risk = '高风险'
    elif proportion > 1 / 4:
        proportion_risk = '中到高风险'
    else:
        proportion_risk = '低风险'

    # 根据波动率判断风险等级
    if daily_volatility > 0.02:
        volatility_risk = '高风险'
    elif daily_volatility > 0.01:
        volatility_risk = '中风险'
    else:
        volatility_risk = '低风险'

    # 只要满足一个条件就判断为高风险
    if '高风险' in [proportion_risk, volatility_risk]:
        return '高风险'
    elif '中到高风险' in [proportion_risk, volatility_risk] or '中风险' in [proportion_risk, volatility_risk]:
        return '中到高风险'
    else:
        return '低风险'


# 输入数据
positions = [
    {
        "currency": "EUR/USD",
        "quantity": 1000000,
        "proportion": 0.172,
        "benefit": 2500,
        "dailyVolatility": 0.125,
        "valueAtRisk": "$15,000",
        "beta": 1.2,
        "hedgingCost": 0.0015
    },
    {
        "currency": "GBP/USD",
        "quantity": 800000,
        "proportion": 0.138,
        "benefit": 1800,
        "dailyVolatility": 0.112,
        "valueAtRisk": "$12,000",
        "beta": 1.1,
        "hedgingCost": 0.0018
    },
    {
        "currency": "USD/JPY",
        "quantity": 2000000,
        "proportion": 0.345,
        "benefit": -1200,
        "dailyVolatility": 0.085,
        "valueAtRisk": "$25,000",
        "beta": 0.9,
        "hedgingCost": 0.0012
    },
    {
        "currency": "USD/CHF",
        "quantity": 500000,
        "proportion": 0.086,
        "benefit": 950,
        "dailyVolatility": 0.078,
        "valueAtRisk": "$8,000",
        "beta": 0.8,
        "hedgingCost": 0.0014
    },
    {
        "currency": "AUD/USD",
        "quantity": 1500000,
        "proportion": 0.259,
        "benefit": -800,
        "dailyVolatility": 0.132,
        "valueAtRisk": "$18,000",
        "beta": 1.3,
        "hedgingCost": 0.0016
    }
]

# 判断每个货币对的风险等级
for position in positions:
    risk_level = determine_risk_level(position['proportion'], position['dailyVolatility'])
    print(f"货币对: {position['currency']}, 风险等级: {risk_level}")