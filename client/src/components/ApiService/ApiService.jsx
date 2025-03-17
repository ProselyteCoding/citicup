// 主要负责前后端的交互逻辑，把所有请求和响应的函数都集中在一起
// 下面是示例函数

// import axios from "axios";
// 根据实际情况配置基础 URL
// const BASE_URL = "https://your-api-domain.com/api";

// const fetchUsers = async () => {
//   try {
//     const response = await axios.get(`${BASE_URL}/users`);
//     return response.data;
//   } catch (error) {
//     console.error("获取用户数据失败：", error);
//     throw error;
//   }
// };

// const createUser = async (userData) => {
//   try {
//     const response = await axios.post(`${BASE_URL}/users`, userData);
//     return response.data;
//   } catch (error) {
//     console.error("创建用户失败：", error);
//     throw error;
//   }
// };

// const updateUser = async (userId, updatedData) => {
//   try {
//     const response = await axios.put(`${BASE_URL}/users/${userId}`, updatedData);
//     return response.data;
//   } catch (error) {
//     console.error("更新用户数据失败：", error);
//     throw error;
//   }
// };

// const deleteUser = async (userId) => {
//   try {
//     const response = await axios.delete(`${BASE_URL}/users/${userId}`);
//     return response.data;
//   } catch (error) {
//     console.error("删除用户失败：", error);
//     throw error;
//   }
// };

// export default {
//   fetchUsers,
//   createUser,
//   updateUser,
//   deleteUser,
// };
