from flask import Blueprint
from controllers.portfolio_controller import (
    upload_portfolio,
    get_hedging_advice_controller,
)

# 创建Blueprint
portfolio_bp = Blueprint("portfolio", __name__)

# 接口一：上传持仓数据
portfolio_bp.route("/upload", methods=["POST"])(upload_portfolio)

# 接口三：获取页面三相关信息
portfolio_bp.route("/hedging-advice", methods=["GET"])(get_hedging_advice_controller)
