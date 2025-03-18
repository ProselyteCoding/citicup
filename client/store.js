// 创建了全局状态transformedData
import { create } from "zustand";

export const useStore = create((set) => ({
  transformedData: null, // 存储解析后的 CSV 数据
  analysis: null,        // 存储后端返回的测试数据（可选）
  // 更新数据的全局方法
  setData: (transformedData, analysis) =>
    set({ transformedData, analysis }),
}));
