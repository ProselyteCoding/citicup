import axios from "axios";

/**
 * 发送交易数据到后端，并返回响应的 JSON 数据（POST 请求）
 *
 * @param {string} url - 请求的 URL 地址
 * @param {Array} payload - 包含交易数据的数组
 * @returns {Promise<Object>} 后端返回的 JSON 数据
 */
export const postTradeData = async (url, payload) => {
  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data; // 返回后端处理的响应数据
  } catch (error) {
    console.error("数据请求失败（POST）：", error);
    throw error; // 抛出错误，交给调用者处理
  }
};

/**
 * 从后端获取交易数据，并返回响应的 JSON 数据（GET 请求）
 *
 * @param {string} url - 请求的 URL 地址
 * @returns {Promise<Object>} 后端返回的 JSON 数据
 */
export const getTradeData = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data; // 返回后端处理的响应数据
  } catch (error) {
    console.error("数据请求失败（GET）：", error);
    throw error; // 抛出错误，交给调用者处理
  }
};

/**
 * 获取外汇实时数据
 * @param {Array} currencyPairs - 货币对数组，如['USDCNY', 'EURUSD']
 * @returns {Promise<Object>} 实时外汇数据
 */
export const getForexRealtime = async (currencyPairs = null) => {
  try {
    const url = "http://localhost:5000/api/forex/realtime";
    const params = currencyPairs
      ? { currency_pairs: currencyPairs.join(",") }
      : {};

    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("获取外汇实时数据失败：", error);
    throw error;
  }
};

/**
 * 获取外汇图表数据（支持分时线和K线）
 * @param {string} currencyPair - 货币对，如'USDCNY'
 * @param {string} chartType - 图表类型：'line'（分时）或'kline'（K线）
 * @param {string} period - 周期：'1min', '5min', '15min', '30min', '1h', '1d'
 * @param {number} count - 数据条数
 * @returns {Promise<Object>} 图表数据
 */
export const getForexChartData = async (
  currencyPair = "USDCNY",
  chartType = "line",
  period = "5min",
  count = 100
) => {
  try {
    const url = "http://localhost:5000/api/forex/chart";
    const params = {
      currency_pair: currencyPair,
      chart_type: chartType,
      period: period,
      count: count,
    };

    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("获取外汇图表数据失败：", error);
    throw error;
  }
};

/**
 * 获取外汇技术指标数据
 * @param {string} currencyPair - 货币对
 * @param {string} indicatorType - 指标类型：'MA', 'MACD', 'RSI'等
 * @param {number} period - 指标周期
 * @param {number} count - 数据条数
 * @returns {Promise<Object>} 技术指标数据
 */
export const getForexIndicators = async (
  currencyPair = "USDCNY",
  indicatorType = "MA",
  period = 20,
  count = 100
) => {
  try {
    const url = "http://localhost:5000/api/forex/indicators";
    const params = {
      currency_pair: currencyPair,
      indicator_type: indicatorType,
      period: period,
      count: count,
    };

    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("获取外汇技术指标数据失败：", error);
    throw error;
  }
};

/**
 * 获取多个技术指标数据（MA和MACD）
 * @param {string} currencyPair - 货币对
 * @param {number} count - 数据条数
 * @returns {Promise<Object>} 多指标数据
 */
export const getForexMultiIndicators = async (
  currencyPair = "USDCNY",
  count = 100
) => {
  try {
    const url = "http://localhost:5000/api/forex/multi-indicators";
    const params = {
      currency_pair: currencyPair,
      count: count,
    };

    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("获取外汇多指标数据失败：", error);
    throw error;
  }
};
