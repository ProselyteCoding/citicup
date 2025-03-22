from flask import request, jsonify
import asyncio
from services.ai_service import get_stress_test_result, huobi_scenario_analyzer
from controllers.portfolio_controller import current_portfolio

def process_stress_test():
    """处理压力测试情景"""
    try:
        data = request.json
        scenario = data.get("scenario")

        # 验证数据
        if not scenario or not isinstance(scenario, str):
            return jsonify({"success": False, "message": "无效的压力测试情景"}), 400

        # 创建一个同步函数来运行异步函数
        def run_async_get_stress_test_result():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            return loop.run_until_complete(get_stress_test_result(scenario))

        # 从大模型获取压力测试结果
        stress_test_result = run_async_get_stress_test_result()

        return jsonify({"success": True, "data": stress_test_result}), 200

    except Exception as error:
        print(f"压力测试出错: {error}")
        return jsonify({"success": False, "message": f"服务器处理数据时发生错误: {str(error)}"}), 500

def currency_prediction():
    """获取货币预测"""
    try:
        data = request.json
        currency_pair = data.get("currency")
        
        # 验证数据
        if not currency_pair or not isinstance(currency_pair, str):
            return jsonify({"success": False, "message": "无效的货币对"}), 400
            
        # 调用货币预测函数
        prediction = huobi_scenario_analyzer(currency_pair)
        
        return jsonify({"success": True, "data": prediction}), 200
        
    except Exception as error:
        print(f"货币预测出错: {error}")
        return jsonify({"success": False, "message": f"服务器处理数据时发生错误: {str(error)}"}), 500
