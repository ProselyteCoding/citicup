import math


def calculate_total_value(portfolio_data):
    """
    计算投资组合总价值
    公式：总持仓价值 = ∑ (持仓量 × 该货币对汇率)
    Args:
        portfolio_data: 持仓数据
    Returns:
        总价值
    """
    if not isinstance(portfolio_data, list) or len(portfolio_data) == 0:
        return 0

    total = 0
    for position in portfolio_data:
        value = position.get("quantity", 0) * position.get("rate", 1)
        total += value

    return total


def calculate_position_ratios(portfolio_data):
    """
    计算持仓占比
    公式：持仓占比 = (单个货币对持仓量 / 总持仓价值) × 100%
    Args:
        portfolio_data: 所有持仓数据
    Returns:
        带有计算后持仓占比的投资组合
    """
    if not isinstance(portfolio_data, list) or len(portfolio_data) == 0:
        return []

    total_value = calculate_total_value(portfolio_data)
    if total_value == 0:
        return portfolio_data

    result = []
    for position in portfolio_data:
        position_value = position.get("quantity", 0) * position.get("rate", 1)
        proportion = position_value / total_value

        # 创建新的字典而不是修改原始对象
        new_position = position.copy()
        new_position["proportion"] = proportion
        result.append(new_position)

    return result


def calculate_profit_loss(position):
    """
    计算盈亏
    公式：盈亏 = (当前市场价格 - 开仓价格) × 持仓量
    Args:
        position: 单个持仓数据
    Returns:
        盈亏金额
    """
    if not position or "quantity" not in position:
        return 0

    current_price = position.get("currentPrice", 0)
    open_price = position.get("openPrice", 0)

    return (current_price - open_price) * position.get("quantity", 0)


def calculate_daily_volatility(historical_data):
    """
    计算日波动率
    公式：日波动率 = 该货币对价格的标准差（基于历史数据）
    Args:
        historical_data: 历史价格数据
    Returns:
        日波动率
    """
    if not isinstance(historical_data, list) or len(historical_data) <= 1:
        return 0

    # 计算价格的对数收益率
    returns = []
    for i in range(1, len(historical_data)):
        prev_price = historical_data[i - 1].get("price", 0)
        current_price = historical_data[i].get("price", 0)
        if prev_price > 0 and current_price > 0:
            returns.append(math.log(current_price / prev_price))

    if not returns:
        return 0

    # 计算收益率的标准差
    mean = sum(returns) / len(returns)
    squared_diffs = [(ret - mean) ** 2 for ret in returns]
    variance = sum(squared_diffs) / len(returns)

    return math.sqrt(variance)


def calculate_var(portfolio_value, daily_volatility):
    """
    计算VaR (95%)
    公式：VaR(95%) = 投资组合价值 × 日波动率 × 正态分布 95% 分位数（即Z值（95%）=1.645）
    Args:
        portfolio_value: 投资组合价值
        daily_volatility: 日波动率
    Returns:
        格式化的VaR值
    """
    if not portfolio_value or not daily_volatility:
        return "$0"

    z_score = 1.645  # 95%置信区间对应的Z值
    var95 = portfolio_value * daily_volatility * z_score

    return f"${round(var95):,}"


def calculate_beta(asset_returns, market_returns):
    """
    计算Beta系数
    公式：Beta = 该货币对收益率与市场基准收益率的协方差 / 市场收益率方差
    Args:
        asset_returns: 资产收益率数组
        market_returns: 市场基准收益率数组
    Returns:
        Beta系数
    """
    if (
        not isinstance(asset_returns, list)
        or not isinstance(market_returns, list)
        or len(asset_returns) != len(market_returns)
        or len(asset_returns) == 0
    ):
        return 1  # 默认值

    # 计算均值
    asset_mean = sum(asset_returns) / len(asset_returns)
    market_mean = sum(market_returns) / len(market_returns)

    # 计算协方差和市场方差
    covariance = 0
    market_variance = 0

    for i in range(len(asset_returns)):
        covariance += (asset_returns[i] - asset_mean) * (
            market_returns[i] - market_mean
        )
        market_variance += (market_returns[i] - market_mean) ** 2

    covariance /= len(asset_returns)
    market_variance /= len(market_returns)

    return 1 if market_variance == 0 else covariance / market_variance


def calculate_hedging_cost(hedging_tool_cost, portfolio_value):
    """
    计算对冲成本
    公式：对冲成本 = (对冲工具成本 / 总持仓价值) × 100%
    Args:
        hedging_tool_cost: 对冲工具成本
        portfolio_value: 总持仓价值
    Returns:
        对冲成本比例
    """
    if not hedging_tool_cost or not portfolio_value or portfolio_value == 0:
        return 0

    return hedging_tool_cost / portfolio_value


def calculate_portfolio_volatility(portfolio_data):
    """
    计算投资组合波动率
    考虑资产间相关性的完整计算较为复杂，此处提供简化版本
    Args:
        portfolio_data: 持仓数据
    Returns:
        投资组合波动率
    """
    if not isinstance(portfolio_data, list) or len(portfolio_data) == 0:
        return 0

    # 简化计算：加权平均日波动率
    total_value = calculate_total_value(portfolio_data)

    if total_value == 0:
        return 0

    weighted_volatility = 0

    for position in portfolio_data:
        weight = (position.get("quantity", 0) * position.get("rate", 1)) / total_value
        weighted_volatility += weight * position.get("dailyVolatility", 0)

    return weighted_volatility


def calculate_sharpe_ratio(portfolio_data, risk_free_rate=0.03):
    """
    计算夏普比率
    公式：（投资组合的预期收益率 - 无风险收益率）/ 投资组合的标准差
    Args:
        portfolio_data: 持仓数据
        risk_free_rate: 无风险收益率（默认3%）
    Returns:
        夏普比率
    """
    if not isinstance(portfolio_data, list) or len(portfolio_data) == 0:
        return 0

    # 计算投资组合的预期收益率(简化)
    expected_return = 0.08  # 这里使用固定值，实际应该基于历史数据计算

    # 计算投资组合波动率
    volatility = calculate_portfolio_volatility(portfolio_data)

    if volatility == 0:
        return 0

    return (expected_return - risk_free_rate) / volatility


def process_portfolio_data(raw_data):
    """
    处理上传的持仓数据，计算所有需要的指标
    Args:
        raw_data: 原始上传数据
    Returns:
        处理后的完整数据
    """
    if not isinstance(raw_data, list) or len(raw_data) == 0:
        return []

    # 标准化数据
    processed_data = []
    for item in raw_data:
        processed_data.append(
            {
                "currency": item.get("currency", ""),
                "quantity": float(item.get("quantity", 0)),
                "rate": float(item.get("rate", 1)),
                "currentPrice": float(item.get("currentPrice", 0)),
                "openPrice": float(item.get("openPrice", 0)),
                "dailyVolatility": float(item.get("dailyVolatility", 0)),
            }
        )

    # 计算持仓占比
    processed_data = calculate_position_ratios(processed_data)

    # 计算每个持仓的盈亏
    result = []
    for position in processed_data:
        new_position = position.copy()
        new_position["benefit"] = calculate_profit_loss(position)
        result.append(new_position)

    return result


def format_currency(value):
    """
    格式化币值显示
    Args:
        value: 数值
    Returns:
        格式化的币值字符串
    """
    return f"${abs(value):,}"


def calculate_cumulative_return(final_value, initial_value):
    """
    计算累计收益率
    Args:
        final_value: 最终价值
        initial_value: 初始价值
    Returns:
        百分比形式的收益率
    """
    if not final_value or not initial_value or initial_value == 0:
        return 0

    return (final_value - initial_value) / initial_value


def calculate_max_drawdown(value_history):
    """
    计算最大回撤
    Args:
        value_history: 价值历史数据
    Returns:
        最大回撤（百分比形式）
    """
    if not isinstance(value_history, list) or len(value_history) <= 1:
        return 0

    max_drawdown = 0
    peak = value_history[0]

    for value in value_history:
        if value > peak:
            peak = value
        elif peak > 0:
            drawdown = (peak - value) / peak
            max_drawdown = max(max_drawdown, drawdown)

    return max_drawdown
