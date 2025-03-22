from flask import Blueprint
from controllers.risk_controller import process_stress_test, currency_prediction

# 创建Blueprint
risk_bp = Blueprint("risk", __name__)

# 压力测试：上传压力测试情景并获取结果
risk_bp.route("/stress-test", methods=["POST"])(process_stress_test)

# 货币预测接口
risk_bp.route("/currency-prediction", methods=["POST"])(currency_prediction)

