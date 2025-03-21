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
    const response = await axios.post(
      url,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
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
    const response = await axios.get(
      url,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data; // 返回后端处理的响应数据
  } catch (error) {
    console.error("数据请求失败（GET）：", error);
    throw error; // 抛出错误，交给调用者处理
  }
};
