import { create } from "zustand";

export const useStore = create((set) => ({
  // 全局状态变量
  transformedData: null,           // CSV解析后的数据
  adviceData: null,                // 后端返回的对冲建议数据
  riskSignalsData: null,           // 风险信号数据
  currencyPredictionData: null,    // 货币预测数据
  stressTestData: null,            // 压力测试数据

  isDataLoaded: false,             // 数据加载状态

  // 更新函数
  setTransformedData: (data) =>
    set({ transformedData: data }),
  
  setAdviceData: (data) =>
    set({ adviceData: data }),
  
  setRiskSignalsData: (data) =>
    set({ riskSignalsData: data }),
  
  setCurrencyPredictionData: (data) =>
    set({ currencyPredictionData: data }),
  
  setStressTestData: (data) =>
    set({ stressTestData: data }),
}));
