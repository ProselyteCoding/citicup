from flask import Blueprint
from controllers.forex_controller import (
    get_forex_realtime,
    get_forex_chart_data,
    get_forex_indicators,
    get_multiple_indicators,
)

# 创建Blueprint
forex_bp = Blueprint("forex", __name__)

# 外汇实时数据接口
forex_bp.route("/realtime", methods=["GET"])(get_forex_realtime)

# 外汇图表数据接口（支持分时线和K线）
forex_bp.route("/chart", methods=["GET"])(get_forex_chart_data)

# 外汇技术指标接口
forex_bp.route("/indicators", methods=["GET"])(get_forex_indicators)

# 多指标数据接口
forex_bp.route("/multi-indicators", methods=["GET"])(get_multiple_indicators)
