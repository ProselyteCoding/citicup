from flask import request, jsonify
from utils.calculation_utils import (
    calculate_total_value,
    calculate_portfolio_volatility,
    calculate_sharpe_ratio,
)
from services.ai_service import get_hedging_advice

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

        # 计算相关指标
        total_value = calculate_total_value(portfolio_data)
        portfolio_volatility = calculate_portfolio_volatility(portfolio_data)
        sharpe_ratio = calculate_sharpe_ratio(portfolio_data)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "持仓数据上传成功",
                    "data": {
                        "totalValue": total_value,
                        "portfolioVolatility": portfolio_volatility,
                        "sharpeRatio": sharpe_ratio,
                    },
                }
            ),
            200,
        )

    except Exception as error:
        print(f"上传持仓数据出错: {error}")
        return jsonify({"success": False, "message": "服务器处理数据时发生错误"}), 500


def get_hedging_advice_controller():
    """获取对冲建议"""
    try:
        # 检查是否有持仓数据
        if not current_portfolio or len(current_portfolio) == 0:
            return (
                jsonify({"success": False, "message": "未找到持仓数据，请先上传"}),
                400,
            )

        # 从大模型获取对冲建议
        hedging_advice = get_hedging_advice(current_portfolio)

        return jsonify({"success": True, "data": hedging_advice}), 200

    except Exception as error:
        print(f"获取对冲建议出错: {error}")
        return jsonify({"success": False, "message": "服务器处理数据时发生错误"}), 500
