from flask import request, jsonify
from services.ai_service import get_stress_test_result


def process_stress_test():
    """处理压力测试情景"""
    try:
        data = request.json
        scenario = data.get("scenario")

        # 验证数据
        if not scenario or not isinstance(scenario, str):
            return jsonify({"success": False, "message": "无效的压力测试情景"}), 400

        # 从大模型获取压力测试结果
        stress_test_result = get_stress_test_result(scenario)

        return jsonify({"success": True, "data": stress_test_result}), 200

    except Exception as error:
        print(f"压力测试出错: {error}")
        return jsonify({"success": False, "message": "服务器处理数据时发生错误"}), 500
