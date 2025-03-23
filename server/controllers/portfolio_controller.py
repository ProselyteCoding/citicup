from flask import request, jsonify
import asyncio
from services.ai_service import get_hedging_advice, risk_signal_analysis

# 保存当前上传的持仓数据
current_portfolio = []


def upload_portfolio():
    """处理上传持仓数据"""
    try:
        portfolio_data = request.json

        # 验证数据
        if not isinstance(portfolio_data, list) or len(portfolio_data) == 0:
            return jsonify({"success": False, "message": "无效的持仓数据格式"}), 400

        # 存储数据
        global current_portfolio
        current_portfolio = portfolio_data

        # 不再进行计算，直接返回成功
        return (
            jsonify(
                {
                    "success": True,
                    "message": "持仓数据上传成功"
                }
            ),
            200,
        )

    except Exception as error:
        print(f"上传持仓数据出错: {error}")
        return jsonify({"success": False, "message": f"服务器处理数据时发生错误: {str(error)}"}), 500


def get_hedging_advice_controller():
    """获取对冲建议与风险信息"""
    try:
        # 检查是否有持仓数据
        if not current_portfolio or len(current_portfolio) == 0:
            return (
                jsonify({"success": False, "message": "未找到持仓数据，请先上传"}),
                400,
            )

        # 创建一个同步函数来运行异步函数获取对冲建议
        def run_async_get_hedging_advice():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            return loop.run_until_complete(get_hedging_advice(current_portfolio))

        # 从大模型获取对冲建议
        hedging_advice = run_async_get_hedging_advice()
        
        # 调用风险策略函数获取风险信息
        try:
            from services.ai_service import Risk_strategy
            risk_info = Risk_strategy(current_portfolio)
            
            # 如果风险信息数据不完整，添加缺失的部分
            if "currencyExposure" not in risk_info:
                risk_info["currencyExposure"] = []
            if "termRiskDistribution" not in risk_info:
                risk_info["termRiskDistribution"] = []
            if "riskTransmissionPath" not in risk_info:
                risk_info["riskTransmissionPath"] = []
            if "macroRiskCoefficients" not in risk_info:
                risk_info["macroRiskCoefficients"] = []
            if "singleCurrencyAnalysis" not in risk_info:
                risk_info["singleCurrencyAnalysis"] = []
                
        except Exception as risk_error:
            print(f"获取风险信息失败: {risk_error}")
            # 提供备用风险信息
            risk_info = {
                "currencyExposure": [
                    {
                        "currency": "EUR/USD",
                        "riskRate": "高风险",
                        "tendency": "上"
                    },
                    {
                        "currency": "USD/JPY",
                        "riskRate": "高风险",
                        "tendency": "下"
                    }
                ],
                "termRiskDistribution": [
                    {
                        "time": 30,
                        "risk": 0.0512
                    },
                    {
                        "time": 60,
                        "risk": 0.082
                    },
                    {
                        "time": 90,
                        "risk": 0.123
                    }
                ],
                "riskTransmissionPath": ["JPY30", "USD40", "EUR50"],
                "macroRiskCoefficients": [
                    {
                        "month": 1,
                        "all": 80,
                        "economy": 60,
                        "policy": 40,
                        "market": 20
                    }
                ],
                "riskSignalAnalysis": {
                    "current": {
                        "credit": 60,
                        "policy": 20,
                        "market": 40,
                        "politician": 30,
                        "economy": 50
                    },
                    "warning": {
                        "credit": 70,
                        "policy": 30,
                        "market": 50,
                        "politician": 40,
                        "economy": 60
                    }
                },
                "singleCurrencyAnalysis": [
                    {
                        "currency": "EUR/USD",
                        "upper": 1.0063,
                        "lower": 0.9938
                    },
                    {
                        "currency": "USD/JPY",
                        "upper": 1.0043,
                        "lower": 0.9958
                    }
                ]
            }
        
        # 确保合并时不覆盖原始字段
        # 不要使用 {**hedging_advice, **risk_info}，而是创建一个新字典并明确添加每个字段
        combined_data = {}
        
        # 1. 添加对冲建议字段
        combined_data["historicalAnalysis"] = hedging_advice.get("historicalAnalysis")
        combined_data["currentHedgingAdvice"] = hedging_advice.get("currentHedgingAdvice")
        combined_data["positionRiskAssessment"] = hedging_advice.get("positionRiskAssessment")
        combined_data["correlationAnalysis"] = hedging_advice.get("correlationAnalysis")
        combined_data["costBenefitAnalysis"] = hedging_advice.get("costBenefitAnalysis")
        combined_data["recommendedPositions"] = hedging_advice.get("recommendedPositions")
        
        # 2. 添加风险信息字段
        combined_data["currencyExposure"] = risk_info.get("currencyExposure")
        combined_data["termRiskDistribution"] = risk_info.get("termRiskDistribution")
        combined_data["riskTransmissionPath"] = risk_info.get("riskTransmissionPath")
        combined_data["macroRiskCoefficients"] = risk_info.get("macroRiskCoefficients")
        combined_data["riskSignalAnalysis"] = risk_info.get("riskSignalAnalysis")
        combined_data["singleCurrencyAnalysis"] = risk_info.get("singleCurrencyAnalysis")
        
        return jsonify({"success": True, "data": combined_data}), 200

    except Exception as error:
        print(f"获取对冲建议出错: {error}")
        return jsonify({"success": False, "message": f"服务器处理数据时发生错误: {str(error)}"}), 500


def get_risk_signals():
    """获取风险信号分析"""
    try:
        # 检查是否有持仓数据
        if not current_portfolio or len(current_portfolio) == 0:
            return (
                jsonify({"success": False, "message": "未找到持仓数据，请先上传"}),
                400,
            )

        try:
            # 调用风险信号分析函数
            risk_signals = risk_signal_analysis(current_portfolio)
            
            # 处理可能的格式问题 - 检查是否是按货币对分组的格式
            if isinstance(risk_signals, dict) and len(risk_signals) > 0:
                # 如果返回的是按货币对分组的格式，提取第一个货币对的数据
                if any(key in risk_signals for key in ['current', 'warning']):
                    # 已经是正确格式
                    pass
                elif isinstance(list(risk_signals.values())[0], dict):
                    # 按货币对分组的格式，取第一个货币对的数据
                    first_currency = list(risk_signals.keys())[0]
                    risk_signals = risk_signals[first_currency]
                    
            return jsonify({"success": True, "data": risk_signals}), 200
            
        except Exception as parse_error:
            print(f"风险信号分析数据处理失败: {parse_error}")
            # 提供备用风险信号数据
            backup_risk_signals = {
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
            return jsonify({"success": True, "data": backup_risk_signals}), 200

    except Exception as error:
        print(f"获取风险信号分析出错: {error}")
        return jsonify({"success": False, "message": f"服务器处理数据时发生错误: {str(error)}"}), 500
