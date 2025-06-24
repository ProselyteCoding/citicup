from flask import request, jsonify
from services.forex_service import get_forex_service
import traceback


def get_forex_realtime(currency_pairs=None):
    """获取外汇实时数据"""
    try:
        forex_service = get_forex_service()
        if not forex_service:
            return jsonify({"error": "外汇服务未初始化"}), 500

        # 默认货币对
        if not currency_pairs:
            currency_pairs = ["USDCNY.FX", "EURUSD.FX", "GBPUSD.FX", "USDJPY.FX"]

        # 转换为同花顺格式
        ifind_pairs = [
            pair + ".FX" if not pair.endswith(".FX") else pair
            for pair in currency_pairs
        ]
        pairs_str = ",".join(ifind_pairs)

        raw_data = forex_service.get_forex_realtime_data(pairs_str)
        formatted_data = forex_service.format_realtime_data(raw_data)

        return jsonify({"success": True, "data": formatted_data})

    except Exception as e:
        print(f"获取实时外汇数据错误: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def get_forex_chart_data():
    """获取外汇图表数据"""
    try:
        forex_service = get_forex_service()
        if not forex_service:
            return jsonify({"error": "外汇服务未初始化"}), 500

        # 获取请求参数
        currency_pair = request.args.get("currency_pair", "USDCNY")
        chart_type = request.args.get("chart_type", "line")
        period = request.args.get("period", "5min")  # 改为默认5分钟，因为1分钟数据为空
        count = int(request.args.get("count", 100))

        # 转换为同花顺格式
        ifind_pair = (
            currency_pair + ".FX"
            if not currency_pair.endswith(".FX")
            else currency_pair
        )

        # 根据周期选择不同的接口
        if period in ["1min", "5min", "15min", "30min", "60min"]:
            # 使用分钟级数据接口
            interval = period.replace("min", "")
            raw_data = forex_service.get_forex_minute_data(ifind_pair, interval, count)
        elif period in ["1d", "1w", "1m", "1q", "1y"]:
            # 使用K线数据接口
            raw_data = forex_service.get_forex_kline_data(ifind_pair, period, count)
        else:
            # 默认使用5分钟数据
            raw_data = forex_service.get_forex_minute_data(ifind_pair, "5", count)

        formatted_data = forex_service.format_chart_data(raw_data, chart_type)

        return jsonify(
            {
                "success": True,
                "data": formatted_data,
                "currency_pair": currency_pair,
                "chart_type": chart_type,
                "period": period,
            }
        )

    except Exception as e:
        print(f"获取图表数据错误: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def get_forex_indicators():
    """获取外汇技术指标数据"""
    try:
        forex_service = get_forex_service()
        if not forex_service:
            return jsonify({"error": "外汇服务未初始化"}), 500

        # 获取请求参数
        currency_pair = request.args.get("currency_pair", "USDCNY")
        indicator_type = request.args.get("indicator_type", "MA")
        period = int(request.args.get("period", 20))
        count = int(request.args.get("count", 100))
        interval = request.args.get("interval", "1")  # 分钟间隔

        # 转换为同花顺格式
        ifind_pair = (
            currency_pair + ".FX"
            if not currency_pair.endswith(".FX")
            else currency_pair
        )

        data = forex_service.get_forex_indicators(
            ifind_pair, indicator_type, period, count, interval
        )

        return jsonify(
            {
                "success": True,
                "data": data,
                "currency_pair": currency_pair,
                "indicator_type": indicator_type,
                "period": period,
            }
        )

    except Exception as e:
        print(f"获取技术指标数据错误: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def get_multiple_indicators():
    """获取多个技术指标数据（MA和MACD）"""
    try:
        forex_service = get_forex_service()
        if not forex_service:
            return jsonify({"error": "外汇服务未初始化"}), 500

        currency_pair = request.args.get("currency_pair", "USDCNY")
        count = int(request.args.get("count", 100))
        interval = request.args.get("interval", "1")

        # 转换为同花顺格式
        ifind_pair = (
            currency_pair + ".FX"
            if not currency_pair.endswith(".FX")
            else currency_pair
        )

        # 获取MA数据
        ma_data = forex_service.get_forex_indicators(
            ifind_pair, "MA", 20, count, interval
        )

        # 获取MACD数据
        macd_data = forex_service.get_forex_indicators(
            ifind_pair, "MACD", 12, count, interval
        )

        return jsonify(
            {
                "success": True,
                "data": {"ma": ma_data, "macd": macd_data},
                "currency_pair": currency_pair,
            }
        )

    except Exception as e:
        print(f"获取多指标数据错误: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
