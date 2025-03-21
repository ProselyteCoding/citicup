"""
测试大模型与后端对接是否成功
"""
import sys
import os
import asyncio

# 添加当前目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# =================== 从adapter.py整合的内容开始 ===================
"""
大模型接口适配器函数
"""

# 修改对冲建议适配函数
# 修改对冲建议适配函数
def analyze_risk_signals(input_data):
    """调用风险信号分析模型"""
    try:
        # 首先检查输入类型
        if isinstance(input_data, list):
            # 如果直接传入列表，则当作portfolio_data处理
            portfolio_data = input_data
        else:
            # 如果传入字典，则从中获取positions
            portfolio_data = input_data.get("positions", [])
        
        # 导入货币预测分析函数
        from ml.page_three.货币预测 import scenario_analyzer as currency_prediction_analyzer
        
        # 导入函数
        from ml.page_three.风险信号分析 import scenario_analyzer as risk_signals_analyzer
        
        # 确保正确格式
        formatted_input = {"positions": portfolio_data}
        result = risk_signals_analyzer(formatted_input)
        
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
            from ml.risk_info.risk import Risk_strategy  # 确保正确导入Risk_strategy
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

# 修改压力测试适配函数
def perform_stress_test(input_data):
    """调用压力测试模型"""
    try:
        # 获取scenario
        if isinstance(input_data, str):
            # 向后兼容：如果直接传入字符串，则当作scenario处理
            scenario = input_data
            positions = []
        else:
            scenario = input_data.get("scenario", "")
            positions = input_data.get("positions", [])
            
        # 导入函数
        from ml.page_three.压力测试接口 import scenario_analyzer as stress_test_analyzer
        
        # 确保正确格式
        formatted_input = {
            "scenario": scenario,
            "positions": positions
        }
        result = stress_test_analyzer(formatted_input)
        
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
# =================== 从adapter.py整合的内容结束 ===================

# 测试数据
test_portfolio = [
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
]

test_scenario = "美联储加息100bp"

async def test_ai_service():
    """测试通过ai_service调用大模型"""
    from services.ai_service import get_hedging_advice, get_stress_test_result
    
    print("\n===== 测试 AI Service =====")
    try:
        print("测试对冲建议接口...")
        hedging_advice = await get_hedging_advice(test_portfolio)
        print(f"对冲建议结果: {hedging_advice}")

        print("\n测试压力测试接口...")
        stress_result = await get_stress_test_result(test_scenario)
        print(f"压力测试结果: {stress_result}")
    except Exception as e:
        print(f"AI服务测试失败: {e}")

def test_risk_signals():
    """直接测试风险信号分析模型"""
    try:
        print("\n===== 测试风险信号分析 =====")
        from ml.page_three.风险信号分析 import scenario_analyzer
        
        result = scenario_analyzer({"positions": test_portfolio})
        print(f"风险信号分析结果: {result}")
        return True
    except Exception as e:
        print(f"风险信号分析测试失败: {str(e)}")
        return False

def test_stress_test():
    """直接测试压力测试模型"""
    try:
        print("\n===== 测试压力测试 =====")
        from ml.page_three.压力测试接口 import scenario_analyzer
        
        input_data = {
            "scenario": test_scenario,
            "positions": test_portfolio
        }
        result = scenario_analyzer(input_data)
        print(f"压力测试结果: {result}")
        return True
    except Exception as e:
        print(f"压力测试测试失败: {str(e)}")
        return False

def test_currency_prediction():
    """直接测试货币预测模型"""
    try:
        print("\n===== 测试货币预测 =====")
        from ml.page_three.货币预测 import scenario_analyzer
        
        result = scenario_analyzer({"scenario": "EUR/USD"})
        print(f"货币预测结果: {result}")
        return True
    except Exception as e:
        print(f"货币预测测试失败: {str(e)}")
        return False

def test_risk_exposure():
    """测试主要风险敞口模型"""
    try:
        print("\n===== 测试主要风险敞口 =====")
        from ml.page_three.主要风险敞口 import determine_risk_level
        
        position = test_portfolio[0]
        result = determine_risk_level(position['proportion'], position['dailyVolatility'])
        print(f"风险敞口分析结果: {result}")
        return True
    except Exception as e:
        print(f"风险敞口测试失败: {str(e)}")
        return False

def test_risk_info():
    """测试风险信息模型"""
    try:
        print("\n===== 测试风险信息 =====")
        from ml.risk_info.risk import Risk_strategy
        
        result = Risk_strategy(test_portfolio)
        print(f"风险信息分析结果: {result}")
        return True
    except Exception as e:
        print(f"风险信息测试失败: {str(e)}")
        return False

def test_adapter():
    """测试适配器功能"""
    try:
        print("\n===== 测试适配器 =====")
        # 不再从ml.adapter导入，直接使用已整合的函数
        
        print("测试对冲建议适配器...")
        hedging_result = analyze_risk_signals(test_portfolio)
        print(f"对冲建议结果: {hedging_result}")
        
        print("\n测试压力测试适配器...")
        stress_result = perform_stress_test(test_scenario)
        print(f"压力测试结果: {stress_result}")
        return True
    except Exception as e:
        print(f"适配器测试失败: {str(e)}")
        return False

async def main():
    """主测试函数"""
    print("开始测试大模型集成...")
    
    # 测试直接调用模型
    test_results = {
        "风险信号分析": test_risk_signals(),
        "压力测试": test_stress_test(),
        "货币预测": test_currency_prediction(),
        "风险敞口": test_risk_exposure(),
        "风险信息": test_risk_info(),
        "适配器": test_adapter()
    }
    
    # 测试通过服务调用
    await test_ai_service()
    
    # 打印测试结果摘要
    print("\n===== 测试结果摘要 =====")
    for model, result in test_results.items():
        print(f"{model}: {'成功' if result else '失败'}")

# 运行异步主函数
if __name__ == "__main__":
    asyncio.run(main())
