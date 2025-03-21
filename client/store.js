import { create } from "zustand";

export const useStore = create((set) => ({
  transformedData: null, // 存储解析后的 CSV 数据
  analysis: null,        // 存储后端返回的测试数据（可选）
  backendData: null,     // 新增：存储后端返回的数据
  // 更新解析后的 CSV 数据和测试数据
  setData: (transformedData, analysis) =>
    set({ transformedData, analysis }),
  // 新增：更新后端返回的数据
  setBackendData: (backendData) =>
    set({ backendData }),
}));