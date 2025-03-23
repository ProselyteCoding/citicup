from flask import Blueprint
from controllers.portfolio_controller import (
    upload_portfolio,
    get_hedging_advice_controller,
    get_risk_signals,
)

# 创建Blueprint
portfolio_bp = Blueprint("portfolio", __name__)

# 接口一：上传持仓数据
portfolio_bp.route("/upload", methods=["POST"])(upload_portfolio)

# 接口二：获取对冲建议
portfolio_bp.route("/hedging-advice", methods=["GET"])(get_hedging_advice_controller)

# 接口三：获取风险信号分析
portfolio_bp.route("/risk-signals", methods=["GET"])(get_risk_signals)