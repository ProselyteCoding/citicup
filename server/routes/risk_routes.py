from flask import Blueprint
from controllers.risk_controller import process_stress_test

# 创建Blueprint
risk_bp = Blueprint("risk", __name__)

# 接口二：上传压力测试情景并获取结果
risk_bp.route("/stress-test", methods=["POST"])(process_stress_test)
