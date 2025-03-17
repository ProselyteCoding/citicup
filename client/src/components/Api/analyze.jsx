import axios from "axios";

/**
 * 发送交易数据到后端，并返回响应的 JSON 数据
 *
 * @param {Array} payload - 包含交易数据的数组
 * @returns {Promise<Object>} 后端返回的 JSON 数据
 */
export async function sendTradeData(payload) {
  try {
    const response = await axios.post(
      "https://your-backend-api.com/trade",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data; // 返回后端处理的响应数据
  } catch (error) {
    console.error("数据请求失败：", error);
    throw error; // 抛出错误，交给调用者处理
  }
}
