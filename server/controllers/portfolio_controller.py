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

        # 调用风险信号分析函数
        risk_signals = risk_signal_analysis(current_portfolio)
        
        return jsonify({"success": True, "data": risk_signals}), 200

    except Exception as error:
        print(f"获取风险信号分析出错: {error}")
        return jsonify({"success": False, "message": f"服务器处理数据时发生错误: {str(error)}"}), 500
