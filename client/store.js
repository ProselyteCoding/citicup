/*
 * @Author: ourEDA MaMing
 * @Date: 2025-03-18 19:21:37
 * @LastEditors: ourEDA MaMing
 * @LastEditTime: 2025-03-23 23:54:31
 * @FilePath: \citicup\client\store.js
 * @Description: 李猴啊
 * 
 * Copyright (c) 2025 by FanZDStar , All Rights Reserved. 
 */
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
