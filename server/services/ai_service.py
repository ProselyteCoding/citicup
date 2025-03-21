import logging
import sys
import os

# 添加大模型目录到路径
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.join(os.path.dirname(current_dir), 'ml')
sys.path.append(ml_dir)

# 导入大模型模块
try:
    from ml.page_three.风险信号分析 import scenario_analyzer as analyze_risk_signals
    from ml.page_three.压力测试接口 import scenario_analyzer as perform_stress_test
except ImportError as e:
    print(f"导入大模型模块失败: {e}")

def format_model_output(raw_output):
    """
    将大模型的原始输出格式化为前端所需格式
    Args:
        raw_output: 大模型原始输出
    Returns:
        格式化后的数据
    """
    # 根据实际大模型输出格式编写转换逻辑
    # 这里是一个示例实现
    formatted_output = {
        "historicalAnalysis": None,
        "currentHedgingAdvice": {},
        "positionRiskAssessment": {},
        "correlationAnalysis": {},
        "costBenefitAnalysis": {},
        "recommendedPositions": []
    }
    
    # 提取volatility和emotion等信息
    if isinstance(raw_output, dict):
        # 处理市场波动信息
        if "market_volatility" in raw_output:
            formatted_output["currentHedgingAdvice"]["volatility"] = raw_output.get("market_volatility", 0.125)
        if "market_sentiment" in raw_output:
            formatted_output["currentHedgingAdvice"]["emotion"] = raw_output.get("market_sentiment", "偏多")
        if "hedging_advice" in raw_output:
            formatted_output["currentHedgingAdvice"]["suggestion"] = raw_output.get("hedging_advice", "减少EUR敞口")
            
        # 处理风险评估
        if "risk_level" in raw_output:
            formatted_output["positionRiskAssessment"]["risk"] = raw_output.get("risk_level", "高风险")
        if "var_value" in raw_output:
            formatted_output["positionRiskAssessment"]["var"] = raw_output.get("var_value", "$25,000")
        if "risk_advice" in raw_output:
            formatted_output["positionRiskAssessment"]["suggestion"] = raw_output.get("risk_advice", "减少EUR敞口")
            
        # 处理相关性分析
        if "correlation" in raw_output:
            formatted_output["correlationAnalysis"]["relative"] = raw_output.get("correlation", "强正相关")
        if "hedge_effectiveness" in raw_output:
            formatted_output["correlationAnalysis"]["estimate"] = raw_output.get("hedge_effectiveness", "中等")
        if "correlation_advice" in raw_output:
            formatted_output["correlationAnalysis"]["suggestion"] = raw_output.get("correlation_advice", "选择负相关货币对进行对冲")
            
        # 处理成本效益分析
        if "hedge_cost" in raw_output:
            formatted_output["costBenefitAnalysis"]["cost"] = raw_output.get("hedge_cost", 0.0015)
        if "return_impact" in raw_output:
            formatted_output["costBenefitAnalysis"]["influence"] = raw_output.get("return_impact", "低")
        if "cost_advice" in raw_output:
            formatted_output["costBenefitAnalysis"]["suggestion"] = raw_output.get("cost_advice", "进行策略性对冲")
            
        # 处理建议持仓
        if "recommended_positions" in raw_output and isinstance(raw_output["recommended_positions"], list):
            formatted_output["recommendedPositions"] = raw_output["recommended_positions"]
    
    # 确保所有必要字段都有默认值
    if "volatility" not in formatted_output["currentHedgingAdvice"]:
        formatted_output["currentHedgingAdvice"]["volatility"] = 0.125
    if "emotion" not in formatted_output["currentHedgingAdvice"]:
        formatted_output["currentHedgingAdvice"]["emotion"] = "偏多"
    if "suggestion" not in formatted_output["currentHedgingAdvice"]:
        formatted_output["currentHedgingAdvice"]["suggestion"] = "减少EUR敞口"
        
    # 其他字段的默认值处理...
    
    return formatted_output

def format_stress_test_output(raw_output, scenario):
    """
    将大模型的压力测试原始输出格式化为前端所需格式
    Args:
        raw_output: 大模型原始输出
        scenario: 原始情景描述
    Returns:
        格式化后的数据
    """
    # 根据实际大模型输出格式编写转换逻辑
    formatted_output = {
        "scenario": scenario,
        "influence": "中",
        "probability": 0.05,
        "suggestion": "保持当前持仓"
    }
    
    # 提取相关信息
    if isinstance(raw_output, dict):
        if "impact" in raw_output:
            formatted_output["influence"] = raw_output.get("impact", "中")
        if "probability" in raw_output:
            formatted_output["probability"] = raw_output.get("probability", 0.05)
        if "recommendation" in raw_output:
            formatted_output["suggestion"] = raw_output.get("recommendation", "保持当前持仓")
    
    return formatted_output

# 修改对冲建议接口函数
async def get_hedging_advice(portfolio_data):
    """
    从大模型获取对冲建议
    Args:
        portfolio_data: 持仓数据
    Returns:
        对冲建议数据
    """
    try:
        # 首先尝试使用大模型
        try:
            # 调用大模型模块中的分析函数
            # 注意：直接传递portfolio_data，而不是包装为字典
            # 因为我们已在adapter中处理了这种情况
            result = analyze_risk_signals(portfolio_data)
            return result
                
        except Exception as model_error:
            print(f"调用大模型失败，使用备用方案: {model_error}")
            # 备用方案: 使用原有模拟数据
            return {
                "historicalAnalysis": None,
                "currentHedgingAdvice": {
                    "volatility": 0.125,
                    "emotion": "偏多",
                    "suggestion": "减少EUR敞口",
                },
                # 其余代码不变...
            }
    except Exception as error:
        print(f"获取对冲建议出错: {error}")
        raise error

# 修改压力测试接口函数
async def get_stress_test_result(scenario):
    """
    从大模型获取压力测试结果
    Args:
        scenario: 压力测试情景
    Returns:
        压力测试结果
    """
    try:
        # 首先尝试使用大模型
        try:
            # 调用大模型模块中的压力测试函数
            # 注意：直接传递scenario字符串，而不是包装为字典
            # 因为我们已在adapter中处理了这种情况
            result = perform_stress_test(scenario)
            return result
                
        except Exception as model_error:
            print(f"调用大模型失败，使用备用方案: {model_error}")
            # 备用方案: 使用原有模拟数据
            return {
                "scenario": scenario,
                "influence": "高",
                "probability": 0.01,
                "suggestion": "减少EUR敞口",
            }
    except Exception as error:
        print(f"获取压力测试结果出错: {error}")
        raise error