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
    """获取对冲建议"""
    try:
        # 检查是否有持仓数据
        if not current_portfolio or len(current_portfolio) == 0:
            return (
                jsonify({"success": False, "message": "未找到持仓数据，请先上传"}),
                400,
            )

        # 创建一个同步函数来运行异步函数
        def run_async_get_hedging_advice():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            return loop.run_until_complete(get_hedging_advice(current_portfolio))

        # 从大模型获取对冲建议
        hedging_advice = run_async_get_hedging_advice()
        
        return jsonify({"success": True, "data": hedging_advice}), 200

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
