import React, { useEffect, useRef, useState, useCallback } from "react";
import * as echarts from "echarts";
import NavBar from "../../components/NavBar/NavBar";
import styles from "./RiskSignals.module.css";
import { useStore } from "../../../store"; // 导入 zustand store
import Loading from "../../components/Loading/Loading";

const Dashboard = () => {
  // 从全局状态中获取 transformedData 和 analysis
  const { transformedData, adviceData, riskSignalsData } = useStore();
  console.log("从 zustand 获取的数据:", transformedData);

  // 图表 DOM 引用
  const exposurePieRef = useRef(null);
  const riskPathRef = useRef(null);
  const paymentTermRiskRef = useRef(null);
  const eriRef = useRef(null);
  const riskSignalsRef = useRef(null);
  const backtestRef = useRef(null);

  // 下拉选择控件引用（回测）
  const currencySelectRef = useRef(null);
  const timeframeSelectRef = useRef(null);

  // 用于存储各图表实例
  const charts = useRef({});

  // 状态管理
  const [selectedHighRiskCurrency, setSelectedHighRiskCurrency] = useState("");
  const [lastUpdateTime, setLastUpdateTime] = useState("--");
  const [highRiskCurrencies, setHighRiskCurrencies] = useState([]);

  // 模拟数据
  const currencyPairs = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD"];

  // 生成日期数据
  const generateDates = useCallback((timeframe) => {
    const dates = [];
    const now = new Date();
    let points;
    switch (timeframe) {
      case "1M":
        points = 30;
        break;
      case "3M":
        points = 90;
        break;
      case "6M":
        points = 180;
        break;
      case "1Y":
        points = 365;
        break;
      default:
        points = 30;
    }
    for (let i = points; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString("zh-CN"));
    }
    return dates;
  }, []);

  // 生成模拟数据
  const generateMockData = useCallback((timeframe, multiplier = 1) => {
    const data = [];
    let points;
    switch (timeframe) {
      case "1M":
        points = 31;
        break;
      case "3M":
        points = 91;
        break;
      case "6M":
        points = 181;
        break;
      case "1Y":
        points = 366;
        break;
      default:
        points = 31;
    }
    let value = 1.0;
    for (let i = 0; i < points; i++) {
      value += (Math.random() - 0.5) * 0.02;
      data.push((value * multiplier).toFixed(4));
    }
    return data;
  }, []);

  // 货币敞口分布
  const renderExposurePie = useCallback(() => {
    // 如果 DOM 还没渲染出来，直接 return
    if (!exposurePieRef.current) return;
    if (!charts.current.exposurePie) {
      charts.current.exposurePie = echarts.init(exposurePieRef.current);
    }
    const option = {
      title: { text: "货币敞口分布", left: "center" },
      tooltip: { trigger: "item", formatter: "{a} <br/>{b}: {c}%" },
      legend: {
        orient: "vertical",
        left: "left",
        textStyle: { color: "#333" },
      },
      series: [
        {
          name: "敞口占比",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 0, borderColor: "#fff", borderWidth: 2 },
          label: { show: false, position: "center" },
          emphasis: {
            label: { show: true, fontSize: "20", fontWeight: "bold" },
          },
          labelLine: { show: false },
          color: ["#103d7e", "#1a5bb7", "#2979ff", "#5c9cff", "#8ebfff", "#a6f9ef", "#2891f7"],
          data: transformedData.map((item) => ({
            value: item.proportion * 100 || 0,
            name: `${item.currency || "未知"}`,
          })),
        },
      ],
    };
    charts.current.exposurePie.setOption(option);
  }, [transformedData]);

  // 风险传导路径
  const renderRiskPath = useCallback((selectedCurrency = "GBP/USD") => {
    if (!charts.current.riskPath) {
      charts.current.riskPath = echarts.init(riskPathRef.current);
    }
    const currencyData = {
      "EUR/USD": {
        nodes: [
          {
            name: "EUR/USD",
            riskLevel: "高风险",
            exposure: "38%",
            riskIndex: "75",
          },
          {
            name: "JPY",
            riskLevel: "中风险",
            exposure: "15%",
            riskIndex: "55",
          },
          {
            name: "GBP",
            riskLevel: "低风险",
            exposure: "20%",
            riskIndex: "45",
          },
        ],
        links: [
          { source: "EUR/USD", target: "JPY" },
          { source: "EUR/USD", target: "GBP" },
        ],
      },
      "GBP/USD": {
        nodes: [
          {
            name: "GBP",
            riskLevel: "低风险",
            exposure: "20%",
            riskIndex: "45",
          },
          {
            name: "JPY",
            riskLevel: "中风险",
            exposure: "15%",
            riskIndex: "55",
          },
          {
            name: "USD",
            riskLevel: "低风险",
            exposure: "30%",
            riskIndex: "35",
          },
          {
            name: "AUD",
            riskLevel: "低风险",
            exposure: "10%",
            riskIndex: "30",
          },
        ],
        links: [
          { source: "GBP", target: "JPY" },
          { source: "USD", target: "GBP" },
          { source: "USD", target: "AUD" },
        ],
      },
    };
    const data = currencyData[selectedCurrency] || currencyData["GBP/USD"];
    const option = {
      backgroundColor: "#fff",
      tooltip: {
        trigger: "item",
        backgroundColor: "white",
        borderColor: "#eee",
        borderWidth: 1,
        padding: [10, 15],
        textStyle: { color: "#666", fontSize: 14 },
        position: "right",
        formatter: function (params) {
          if (params.dataType === "node") {
            return `<div style="font-family: Microsoft YaHei;">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${params.name}</div>
                        <div style="line-height: 1.8;">
                          风险等级：${params.data.riskLevel}<br/>
                          敞口比例：${params.data.exposure}<br/>
                          风险指数：${params.data.riskIndex}
                        </div>
                      </div>`;
          }
          return "";
        },
      },
      series: [
        {
          type: "graph",
          layout: "force",
          force: {
            repulsion: 300,
            gravity: 0.1,
            edgeLength: 120,
            layoutAnimation: false,
          },
          draggable: false,
          symbolSize: 50,
          roam: false,
          label: {
            show: true,
            position: "inside",
            color: "#fff",
            fontSize: 14,
            fontWeight: "bold",
          },
          itemStyle: { borderWidth: 0 },
          lineStyle: { color: "#003366", width: 1, opacity: 0.6 },
          emphasis: {
            scale: false,
            itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 51, 102, 0.3)" },
          },
          edgeSymbol: ["none", "none"],
          data: data.nodes.map((node) => ({
            ...node,
            itemStyle: {
              color:
                node.riskLevel === "高风险"
                  ? "#ff4d4f"
                  : node.riskLevel === "中风险"
                  ? "#faad14"
                  : node.name === "GBP"
                  ? "#003366"
                  : "rgba(0, 51, 102, 0.2)",
            },
            symbolSize: node.name === "GBP" ? 60 : 40,
          })),
          links: data.links.map((link) => ({
            ...link,
            lineStyle: {
              color:
                link.source === "GBP" || link.target === "GBP"
                  ? "#003366"
                  : "rgba(0, 51, 102, 0.2)",
              width: link.source === "GBP" || link.target === "GBP" ? 2 : 1,
            },
          })),
        },
      ],
    };
    charts.current.riskPath.setOption(option, true);
  }, []);

  // 账期风险分布
  const renderPaymentTermRisk = useCallback(() => {
    if (!charts.current.paymentTermRisk) {
      charts.current.paymentTermRisk = echarts.init(paymentTermRiskRef.current);
    }
    const option = {
      title: { text: "账期风险分布", left: "center" },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: {
        type: "category",
        data: ["1-30天", "31-60天", "61-90天"],
      },
      yAxis: { type: "value", name: "风险指数", max: 5 },
      series: [
        {
          name: "风险指数",
          type: "bar",
          barWidth: "40%",
          data: [
            { value: adviceData ? (adviceData.data.termRiskDistribution[0].risk * 100).toFixed(2) : 0, itemStyle: { color: "#52c41a" } },
            { value: adviceData ? (adviceData.data.termRiskDistribution[1].risk * 100).toFixed(2) : 0, itemStyle: { color: "#faad14" } },
            { value: adviceData ? (adviceData.data.termRiskDistribution[2].risk * 100).toFixed(2) : 0, itemStyle: { color: "#ff7a45" } },
          ],
          label: { show: true, position: "top", formatter: "{c}%" },
        },
      ],
    };
    charts.current.paymentTermRisk.setOption(option);
  }, []);

  // ERI指数趋势
  const renderERI = useCallback(() => {
    if (!charts.current.eri) {
      charts.current.eri = echarts.init(eriRef.current);
    }
    const option = {
      title: { text: "ERI指数趋势", left: "center" },
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      legend: {
        data: ["经济指标", "政策指标", "市场指标", "综合指数"],
        top: 30,
      },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: ["1月", "2月", "3月", "4月", "5月", "6月"],
      },
      yAxis: { type: "value", name: "ERI指数", max: 100 },
      series: [
        {
          name: "经济指标",
          type: "line",
          smooth: true,
          data: [65, 68, 70, 72, 75, adviceData ? adviceData.data.macroRiskCoefficients[0].economy : 0],
          lineStyle: { width: 2 },
          itemStyle: { color: "#103d7e" },
        },
        {
          name: "政策指标",
          type: "line",
          smooth: true,
          data: [55, 58, 60, 62, 65, adviceData ? adviceData.data.macroRiskCoefficients[0].policy : 0],
          lineStyle: { width: 2 },
          itemStyle: { color: "#2979ff" },
        },
        {
          name: "市场指标",
          type: "line",
          smooth: true,
          data: [45, 48, 50, 52, 55, adviceData ? adviceData.data.macroRiskCoefficients[0].market : 0],
          lineStyle: { width: 2 },
          itemStyle: { color: "#5c9cff" },
        },
        {
          name: "综合指数",
          type: "line",
          smooth: true,
          data: [58, 62, 65, 68, 70, adviceData ? adviceData.data.macroRiskCoefficients[0].all : 0],
          lineStyle: { width: 3 },
          itemStyle: { color: "#ff4d4f" },
        },
      ],
    };
    charts.current.eri.setOption(option);
  }, []);

  // 风险信号分析
  const renderRiskSignals = useCallback(() => {
    if (!charts.current.riskSignals) {
      charts.current.riskSignals = echarts.init(riskSignalsRef.current);
    }
    const option = {
      title: { show: false },
      tooltip: { trigger: "item" },
      legend: { orient: "horizontal", bottom: 10, left: "center" },
      radar: {
        center: ["50%", "50%"],
        radius: "65%",
        shape: "circle",
        splitNumber: 4,
        axisName: { color: "#333", fontSize: 12 },
        splitArea: {
          areaStyle: {
            color: [
              "rgba(255,255,255,0.9)",
              "rgba(255,255,255,0.8)",
              "rgba(255,255,255,0.7)",
              "rgba(255,255,255,0.6)",
            ],
          },
        },
        indicator: [
          { name: "信用风险", max: 100 },
          { name: "市场流动性", max: 100 },
          { name: "政治风险", max: 100 },
          { name: "经济风险", max: 100 },
          { name: "政策风险", max: 100 },
        ],
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: riskSignalsData ? [riskSignalsData.data.current.credit*10, riskSignalsData.data.current.market*10, riskSignalsData.data.current.politician*10, riskSignalsData.data.current.economy*10, riskSignalsData.data.current.policy*10] : [0, 0, 0, 0, 0],
              name: "当前风险",
              symbol: "circle",
              symbolSize: 6,
              lineStyle: { width: 2, color: "#103d7e" },
              areaStyle: { color: "rgba(16, 61, 126, 0.3)" },
            },
            {
              value: riskSignalsData ? [riskSignalsData.data.warning.credit*10, riskSignalsData.data.warning.market*10, riskSignalsData.data.warning.politician*10, riskSignalsData.data.warning.economy*10, riskSignalsData.data.warning.policy*10] : [0, 0, 0, 0, 0],
              name: "警戒线",
              symbol: "none",
              lineStyle: { type: "dashed", color: "#ff4d4f" },
              areaStyle: { color: "rgba(255, 77, 79, 0.1)" },
            },
          ],
        },
      ],
    };
    charts.current.riskSignals.setOption(option);
  }, []);

  // 单一货币对回测分析
  const renderBacktest = useCallback(
    (currencyPair = "EURUSD", timeframe = "1M") => {
      if (!charts.current.backtest) {
        charts.current.backtest = echarts.init(backtestRef.current);
      }
      const option = {
        title: {
          text: `${currencyPair.slice(0, 3)}/${currencyPair.slice(3)} 回测分析`,
          left: "center",
        },
        tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
        legend: {
          data: ["实际汇率", "预测区间上限", "预测区间下限"],
          top: 30,
        },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: generateDates(timeframe),
        },
        yAxis: { type: "value", name: "汇率", scale: true },
        series: [
          {
            name: "实际汇率",
            type: "line",
            data: generateMockData(timeframe),
            symbol: "none",
            lineStyle: { width: 2, color: "#103d7e" },
          },
          {
            name: "预测区间上限",
            type: "line",
            data: generateMockData(timeframe, 1.02),
            symbol: "none",
            lineStyle: { width: 1, type: "dashed", color: "#ff4d4f" },
          },
          {
            name: "预测区间下限",
            type: "line",
            data: generateMockData(timeframe, 0.98),
            symbol: "none",
            lineStyle: { width: 1, type: "dashed", color: "#ff4d4f" },
            areaStyle: { color: "rgba(255, 77, 79, 0.1)" },
          },
        ],
      };
      charts.current.backtest.setOption(option);
    },
    [generateDates, generateMockData]
  );

  // 处理高风险货币列表点击（直接在 JSX 中绑定 onClick）
  const handleHighRiskClick = (currency) => {
    setSelectedHighRiskCurrency(currency);
    renderRiskPath(currency);
  };

  // 更新时间戳（改为 state 控制）
  const updateLastScanTime = useCallback(() => {
    const now = new Date();
    setLastUpdateTime(
      now.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }, []);

  // 触发风险扫描（直接在按钮 onClick 中调用）
  const triggerRiskScan = useCallback(() => {
    alert("正在进行风险DNA扫描...");
    renderExposurePie();
    renderRiskPath();
    renderPaymentTermRisk();
    renderERI();
    renderRiskSignals();
    renderBacktest();
    updateLastScanTime();
  }, [
    renderExposurePie,
    renderRiskPath,
    renderPaymentTermRisk,
    renderERI,
    renderRiskSignals,
    renderBacktest,
    updateLastScanTime,
  ]);

  // 处理回测下拉选择变化
  const handleBacktestChange = () => {
    const currency = currencySelectRef.current.value;
    const timeframe = timeframeSelectRef.current.value;
    renderBacktest(currency, timeframe);
  };

  // 初始化图表及绑定 resize 事件
  useEffect(() => {
    renderExposurePie();
    renderRiskPath();
    renderPaymentTermRisk();
    renderERI();
    renderRiskSignals();
    renderBacktest();
    updateLastScanTime();
    // 绑定窗口 resize
    const handleResize = () => {
      Object.values(charts.current).forEach((chart) => chart.resize());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [
    renderExposurePie,
    renderRiskPath,
    renderPaymentTermRisk,
    renderERI,
    renderRiskSignals,
    renderBacktest,
    updateLastScanTime,
  ]);

  return (
    <div>
      <NavBar />
      {/* 主体内容 */}
      <div className={styles.container}>
        <div className={styles["main-content"]}>
          <div className={styles.dashboard} id="riskDashboard">
            <div className={styles["dashboard-header"]}>
              <h2>风险DNA扫描</h2>
              <div className={styles.actions}>
                <button
                  onClick={triggerRiskScan}
                  className={styles["primary-button"]}
                >
                  <i className="fas fa-sync"></i>
                  <span>立即扫描</span>
                </button>
                <span className={styles["last-update"]}>
                  上次更新：<span>{lastUpdateTime}</span>
                </span>
              </div>
            </div>

            <div className={styles["dashboard-grid"]}>
              {/* 货币敞口分布 */}
              <div className={styles["dashboard-card"]}>
                <div className={styles["card-header"]}>
                  <h3>货币敞口分布</h3>
                </div>
                {transformedData && transformedData.length > 0 ? (
                  <div
                    className={styles["chart-container"]}
                    id="exposure-pie"
                    ref={exposurePieRef}
                  ></div>
                ) : (
                  <Loading />
                )}
              </div>

              {/* 高风险货币列表 */}
              <div className={styles["dashboard-card"]}>
                <div className={styles["card-header"]}>
                  <h3>高风险货币列表</h3>
                </div>
                {transformedData && transformedData.length > 0 ? (
                  <div className={styles["list-container"]}>
                    <table className={styles["risk-table"]}>
                      <thead>
                        <tr>
                          <th>货币</th>
                          <th>风险等级</th>
                          <th>敞口比例</th>
                          <th>趋势</th>
                        </tr>
                      </thead>
                      <tbody>
                        {highRiskCurrencies.map((item) => (
                          <tr
                            key={item.currency}
                            onClick={() => handleHighRiskClick(item.currency)}
                            style={{
                              cursor: "pointer",
                              backgroundColor:
                                selectedHighRiskCurrency === item.currency
                                  ? "rgba(0, 51, 102, 0.1)"
                                  : "transparent",
                            }}
                          >
                            <td>{item.currency}</td>
                            <td>
                              <span
                                className={`${styles["risk-level"]} ${
                                  item.riskLevel === "高风险"
                                    ? styles["risk-high"]
                                    : styles["risk-medium"]
                                }`}
                              >
                                {item.riskLevel}
                              </span>
                            </td>
                            <td>{item.exposure}</td>
                            <td>
                              {item.trend === "up" ? (
                                <i
                                  className="fas fa-arrow-up"
                                  style={{ color: "#ff4d4f" }}
                                ></i>
                              ) : (
                                <i
                                  className="fas fa-arrow-right"
                                  style={{ color: "#faad14" }}
                                ></i>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Loading />
                )}
              </div>

              {/* 账期风险分布 */}
              <div className={styles["dashboard-card"]}>
                <div className={styles["card-header"]}>
                  <h3>账期风险分布</h3>
                </div>
                <div
                  className={styles["chart-container"]}
                  id="paymentTermRiskChart"
                  ref={paymentTermRiskRef}
                ></div>
              </div>

              {/* 风险传导路径 */}
              <div className={styles["dashboard-card"]}>
                <div className={styles["card-header"]}>
                  <h3>风险传导路径</h3>
                </div>
                <div
                  className={styles["chart-container"]}
                  id="risk-path"
                  ref={riskPathRef}
                ></div>
              </div>

              {/* ERI指数 */}
              <div className={styles["dashboard-card"]}>
                <div className={styles["card-header"]}>
                  <h3>宏观风险指数 (ERI)</h3>
                </div>
                <div
                  className={styles["chart-container"]}
                  id="eriChart"
                  ref={eriRef}
                ></div>
              </div>

              {/* 风险信号分析 */}
              <div className={styles["dashboard-card"]}>
                <div className={styles["card-header"]}>
                  <h3>风险信号分析</h3>
                </div>
                <div
                  className={styles["chart-container"]}
                  id="riskSignalsChart"
                  ref={riskSignalsRef}
                ></div>
              </div>

              {/* 单一货币对回测分析 */}
              <div
                className={`${styles["dashboard-card"]} ${styles["full-width"]}`}
              >
                <div className={styles["card-header"]}>
                  <h3>单一货币对回测分析</h3>
                  <div style={{ marginTop: "10px" }}>
                    <select
                      ref={currencySelectRef}
                      onChange={handleBacktestChange}
                      style={{ padding: "5px", marginRight: "10px" }}
                    >
                      <option value="EURUSD">EUR/USD</option>
                      <option value="GBPUSD">GBP/USD</option>
                      <option value="USDJPY">USD/JPY</option>
                    </select>
                    <select
                      ref={timeframeSelectRef}
                      onChange={handleBacktestChange}
                      style={{ padding: "5px" }}
                    >
                      <option value="1M">1个月</option>
                      <option value="3M">3个月</option>
                      <option value="6M">6个月</option>
                      <option value="1Y">1年</option>
                    </select>
                  </div>
                </div>
                <div
                  className={styles["chart-container"]}
                  id="backtestChart"
                  style={{ height: "400px" }}
                  ref={backtestRef}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
