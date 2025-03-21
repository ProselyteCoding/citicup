"""
大模型接口适配器
"""

# 导入正确的函数名
from ml.page_three.风险信号分析 import scenario_analyzer as risk_signals_analyzer
from ml.page_three.压力测试接口 import scenario_analyzer as stress_test_analyzer
from ml.page_three.货币预测 import scenario_analyzer as currency_prediction_analyzer
from ml.page_three.主要风险敞口 import determine_risk_level
from ml.risk_info.risk import Risk_strategy

# 适配函数 - 对冲建议
def analyze_risk_signals(portfolio_data):
    """调用风险信号分析模型"""
    try:
        # 调用风险信号处理函数转换结果为前端所需格式
        result = risk_signals_analyzer({"positions": portfolio_data})
        
        # 这里需要将原始结果转换为前端期望的格式
        market_volatility = 0.125  # 默认值
        
        # 从其他模型获取更多信息
        currency_info = {}
        for position in portfolio_data:
            if position["currency"] not in currency_info:
                try:
                    prediction = currency_prediction_analyzer({"scenario": position["currency"]})
                    currency_info[position["currency"]] = prediction
                except Exception as e:
                    print(f"货币预测失败: {str(e)}")
        
        # 调用风险策略获取更多信息
        try:
            risk_info = Risk_strategy(portfolio_data)
        except Exception as e:
            print(f"风险策略分析失败: {str(e)}")
            risk_info = {}
        
        # 构建返回格式
        hedging_advice = {
            "historicalAnalysis": None,
            "currentHedgingAdvice": {
                "volatility": market_volatility,
                "emotion": "偏多" if market_volatility > 0.1 else "偏空" if market_volatility < 0.05 else "中性",
                "suggestion": "根据波动率分析，建议降低高波动货币敞口"
            },
            "positionRiskAssessment": {
                "risk": "高风险",
                "var": max([p["valueAtRisk"] for p in portfolio_data], default="$0"),
                "suggestion": "减少高风险货币敞口"
            },
            "correlationAnalysis": {
                "relative": "中等相关",
                "estimate": "中等",
                "suggestion": "分散持仓，降低集中度"
            },
            "costBenefitAnalysis": {
                "cost": min([p["hedgingCost"] for p in portfolio_data], default=0.001),
                "influence": "中",
                "suggestion": "使用成本效益最佳的对冲策略"
            },
            "recommendedPositions": []
        }
        
        # 添加建议持仓
        for position in portfolio_data:
            currency = position["currency"].split("/")[0]
            hedging_advice["recommendedPositions"].append({
                "currency": currency,
                "quantity": int(position["quantity"] * 0.8)  # 建议减少20%持仓
            })
        
        return hedging_advice
        
    except Exception as e:
        print(f"分析风险信号失败: {str(e)}")
        raise

# 适配函数 - 压力测试
def perform_stress_test(scenario):
    """调用压力测试模型"""
    try:
        # 创建输入数据结构
        input_data = {
            "scenario": scenario,
            "positions": []  # 示例持仓数据，可根据需要修改
        }
        
        # 调用压力测试分析函数
        result = stress_test_analyzer(input_data)
        
        # 确保返回格式符合前端要求
        stress_test_result = {
            "scenario": scenario,
            "influence": result.get("influence", "中"),
            "probability": result.get("probability", 0.05),
            "suggestion": result.get("suggestion", "保持当前持仓")
        }
        
        return stress_test_result
        
    except Exception as e:
        print(f"压力测试分析失败: {str(e)}")
        raise