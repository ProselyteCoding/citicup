import React, { useEffect, useState, useRef } from "react";
import * as echarts from "echarts";
import "echarts-wordcloud";
import styles from "./Home.module.css";
import NavBar from "../../components/NavBar/NavBar";
import {
  getForexRealtime,
  getForexChartData,
  getForexMultiIndicators,
} from "../../components/Api/api";

const Home = () => {
  const [currentCurrencyPair, setCurrentCurrencyPair] = useState("USDCNY");
  const [currentChartType, setCurrentChartType] = useState("line");
  const [realtimeData, setRealtimeData] = useState({});
  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------
   * 主图表实例统一放在 useRef，避免 setState->重渲染
   * ------------------------------------------------- */
  const mainChartRef = useRef(null);

  useEffect(() => {
    // 外部链接映射
    const externalLinks = {
      USDCNY: "https://quote.eastmoney.com/forex/USDCNY.html",
      EURUSD: "https://quote.eastmoney.com/forex/EURUSD.html",
      GBPUSD: "https://quote.eastmoney.com/forex/GBPUSD.html",
      USDJPY: "https://quote.eastmoney.com/forex/USDJPY.html",
    };

    // 更新外部链接
    const updateExternalLink = (currencyPair) => {
      const link = document.getElementById("externalLink");
      if (link) link.href = externalLinks[currencyPair];
    };

    // 获取实时外汇数据
    const fetchRealtimeData = async () => {
      try {
        const response = await getForexRealtime([
          "USDCNY",
          "EURUSD",
          "GBPUSD",
          "USDJPY",
        ]);
        if (response.success && response.data) {
          /* 将 [{code:"USDCNY.FX",latest:…,changeRatio:…}, …]
             转成 { USDCNY:{close,change_rate}, … }  */
          const map = {};
          response.data.forEach((d) => {
            const k = d.code.replace(".FX", "");
            map[k] = { close: d.latest, change_rate: d.changeRatio };
          });
          setRealtimeData(map);
        }
      } catch (error) {
        console.error("获取实时数据失败:", error);
        // 使用模拟数据作为后备
        setRealtimeData({
          USDCNY: { close: 7.2134, change_rate: 0.15 },
          EURUSD: { close: 1.0845, change_rate: -0.23 },
          GBPUSD: { close: 1.265, change_rate: 0.45 },
          USDJPY: { close: 148.52, change_rate: -0.12 },
        });
      }
    };

    // 更新主图表数据
    const updateChartData = async (currencyPair, chartType = "line") => {
      if (!mainChartRef.current) return;

      setLoading(true);
      try {
        // 根据图表类型选择合适的周期
        let period;
        if (chartType === "kline") {
          period = "1d"; // K线图使用日线
        } else if (chartType === "ma" || chartType === "macd") {
          period = "5min"; // 技术指标使用5分钟
        } else {
          period = "5min"; // 分时线使用5分钟（因为1分钟数据为空）
        }

        const response = await getForexChartData(
          currencyPair,
          chartType,
          period,
          100
        );

        if (response.success && response.data) {
          if (chartType === "kline") {
            // K线图配置
            mainChartRef.current.setOption({
              tooltip: {
                trigger: "axis",
                formatter: function (params) {
                  if (params[0] && params[0].data) {
                    const data = params[0].data;
                    return `${data[0]}<br/>
                            开盘: ${data[1]}<br/>
                            收盘: ${data[2]}<br/>
                            最低: ${data[3]}<br/>
                            最高: ${data[4]}<br/>
                            成交量: ${data[5]}`;
                  }
                  return "";
                },
              },
              series: [
                {
                  name: currencyPair,
                  type: "candlestick",
                  data: response.data,
                  itemStyle: {
                    color: "#00da3c",
                    color0: "#ec0000",
                    borderColor: "#00da3c",
                    borderColor0: "#ec0000",
                  },
                },
              ],
            });
          } else if (chartType === "ma") {
            // MA指标图配置
            try {
              const maResponse = await getForexMultiIndicators(
                currencyPair,
                100
              );
              if (
                maResponse.success &&
                maResponse.data.ma &&
                maResponse.data.ma.tables
              ) {
                const maData = maResponse.data.ma.tables[0];
                const maValues = maData.table.MA || [];
                const maTimes = maData.time || [];

                // 过滤掉null值并构建有效数据
                const validMaData = [];
                for (
                  let i = 0;
                  i < maTimes.length && i < maValues.length;
                  i++
                ) {
                  if (maValues[i] !== null) {
                    validMaData.push([maTimes[i], maValues[i]]);
                  }
                }

                if (validMaData.length > 0) {
                  mainChartRef.current.setOption({
                    tooltip: {
                      trigger: "axis",
                      formatter: function (params) {
                        let result = params[0].data[0] + "<br/>";
                        params.forEach((param) => {
                          result +=
                            param.seriesName +
                            ": " +
                            param.data[1].toFixed(4) +
                            "<br/>";
                        });
                        return result;
                      },
                    },
                    series: [
                      {
                        name: "价格",
                        type: "line",
                        data: response.data,
                        showSymbol: false,
                        lineStyle: { color: "#003366" },
                      },
                      {
                        name: "MA20",
                        type: "line",
                        data: validMaData,
                        showSymbol: false,
                        lineStyle: { color: "#ff9800" },
                      },
                    ],
                  });
                } else {
                  // MA数据无效，只显示价格线
                  mainChartRef.current.setOption({
                    series: [
                      {
                        name: currencyPair,
                        type: "line",
                        data: response.data,
                        showSymbol: false,
                        lineStyle: { color: "#003366" },
                      },
                    ],
                  });
                }
              } else {
                // MA数据获取失败，只显示价格线
                mainChartRef.current.setOption({
                  series: [
                    {
                      name: currencyPair,
                      type: "line",
                      data: response.data,
                      showSymbol: false,
                      lineStyle: { color: "#003366" },
                    },
                  ],
                });
              }
            } catch (maError) {
              console.warn("MA数据获取失败，使用价格线:", maError);
              mainChartRef.current.setOption({
                series: [
                  {
                    name: currencyPair,
                    type: "line",
                    data: response.data,
                    showSymbol: false,
                    lineStyle: { color: "#003366" },
                  },
                ],
              });
            }
          } else if (chartType === "macd") {
            // MACD指标图配置
            try {
              const macdResponse = await getForexMultiIndicators(
                currencyPair,
                100
              );
              if (
                macdResponse.success &&
                macdResponse.data.macd &&
                macdResponse.data.macd.tables
              ) {
                const macdData = macdResponse.data.macd.tables[0];
                const macdValues = macdData.table.MACD || [];
                const macdTimes = macdData.time || [];

                // 过滤掉null值
                const validMacdData = [];
                for (
                  let i = 0;
                  i < macdTimes.length && i < macdValues.length;
                  i++
                ) {
                  if (macdValues[i] !== null) {
                    validMacdData.push([macdTimes[i], macdValues[i]]);
                  }
                }

                if (validMacdData.length > 0) {
                  mainChartRef.current.setOption({
                    tooltip: {
                      trigger: "axis",
                      formatter: function (params) {
                        return (
                          params[0].data[0] +
                          "<br/>MACD: " +
                          params[0].data[1].toFixed(4)
                        );
                      },
                    },
                    series: [
                      {
                        name: "MACD",
                        type: "line",
                        data: validMacdData,
                        showSymbol: false,
                        lineStyle: { color: "#e91e63" },
                      },
                    ],
                  });
                } else {
                  // MACD数据无效，显示价格线
                  mainChartRef.current.setOption({
                    series: [
                      {
                        name: currencyPair,
                        type: "line",
                        data: response.data,
                        showSymbol: false,
                        lineStyle: { color: "#003366" },
                      },
                    ],
                  });
                }
              } else {
                // MACD数据获取失败，显示价格线
                mainChartRef.current.setOption({
                  series: [
                    {
                      name: currencyPair,
                      type: "line",
                      data: response.data,
                      showSymbol: false,
                      lineStyle: { color: "#003366" },
                    },
                  ],
                });
              }
            } catch (macdError) {
              console.warn("MACD数据获取失败，使用价格线:", macdError);
              mainChartRef.current.setOption({
                series: [
                  {
                    name: currencyPair,
                    type: "line",
                    data: response.data,
                    showSymbol: false,
                    lineStyle: { color: "#003366" },
                  },
                ],
              });
            }
          } else {
            // 分时线图配置
            mainChartRef.current.setOption({
              tooltip: {
                trigger: "axis",
                formatter: function (params) {
                  if (params[0] && params[0].data) {
                    return (
                      params[0].data[0] +
                      "<br/>" +
                      "价格: " +
                      params[0].data[1].toFixed(4)
                    );
                  }
                  return "";
                },
              },
              series: [
                {
                  name: currencyPair,
                  type: "line",
                  data: response.data,
                  showSymbol: false,
                  lineStyle: {
                    color: "#003366",
                  },
                  areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: "rgba(0, 51, 102, 0.3)" },
                      { offset: 1, color: "rgba(0, 51, 102, 0.1)" },
                    ]),
                  },
                },
              ],
            });
          }
        }
      } catch (error) {
        console.error("获取图表数据失败:", error);
        // 使用模拟数据
        const generateMockData = (baseValue = 7.2) => {
          let data = [];
          let now = new Date();
          for (let i = 0; i < 100; i++) {
            let date = new Date(now - (100 - i) * 1000 * 60);
            if (chartType === "kline") {
              const open = baseValue + Math.random() * 0.1;
              const close = open + (Math.random() - 0.5) * 0.02;
              const high = Math.max(open, close) + Math.random() * 0.01;
              const low = Math.min(open, close) - Math.random() * 0.01;
              data.push([
                date.toISOString(),
                open,
                close,
                low,
                high,
                Math.random() * 1000,
              ]);
            } else {
              data.push([date.toISOString(), baseValue + Math.random() * 0.1]);
            }
          }
          return data;
        };

        const baseValues = {
          USDCNY: 7.2,
          EURUSD: 1.08,
          GBPUSD: 1.26,
          USDJPY: 148.5,
        };
        const mockData = generateMockData(baseValues[currencyPair]);

        if (chartType === "kline") {
          mainChartRef.current.setOption({
            series: [
              { name: currencyPair, type: "candlestick", data: mockData },
            ],
          });
        } else {
          mainChartRef.current.setOption({
            series: [{ name: currencyPair, type: "line", data: mockData }],
          });
        }
      }
      setLoading(false);
    };

    // 监听币种选择变化
    const currencySelect = document.getElementById("currencyPair");
    const handleCurrencyChange = (e) => {
      const currencyPair = e.target.value;
      setCurrentCurrencyPair(currencyPair);
      updateExternalLink(currencyPair);
      updateChartData(currencyPair, currentChartType);
    };

    // 监听图表类型变化
    const handleChartTypeChange = (chartType) => {
      setCurrentChartType(chartType);
      updateChartData(currentCurrencyPair, chartType);
    };

    if (currencySelect) {
      currencySelect.addEventListener("change", handleCurrencyChange);
    }

    // 添加图表类型按钮事件监听
    const addChartTypeListeners = () => {
      const klineBtn = document.getElementById("klineBtn");
      const lineBtn = document.getElementById("lineBtn");
      const maBtn = document.getElementById("maBtn");
      const macdBtn = document.getElementById("macdBtn");

      if (klineBtn)
        klineBtn.addEventListener("click", () =>
          handleChartTypeChange("kline")
        );
      if (lineBtn)
        lineBtn.addEventListener("click", () => handleChartTypeChange("line"));
      if (maBtn)
        maBtn.addEventListener("click", () => handleChartTypeChange("ma"));
      if (macdBtn)
        macdBtn.addEventListener("click", () => handleChartTypeChange("macd"));
    };

    // 初始化外部链接
    updateExternalLink(currentCurrencyPair);

    // 初始化主图表
    const chartInstance = echarts.init(document.getElementById("mainChart"));
    mainChartRef.current = chartInstance;

    const mainChartOption = {
      tooltip: {
        trigger: "axis",
        formatter: function (params) {
          if (params[0] && params[0].data) {
            return (
              params[0].data[0] +
              "<br/>" +
              "价格: " +
              params[0].data[1].toFixed(4)
            );
          }
          return "";
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "time",
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        boundaryGap: [0, "100%"],
        splitLine: {
          show: true,
          lineStyle: { type: "dashed" },
        },
      },
      series: [
        {
          name: currentCurrencyPair,
          type: "line",
          showSymbol: false,
          data: [],
          lineStyle: { color: "#003366" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(0, 51, 102, 0.3)" },
              { offset: 1, color: "rgba(0, 51, 102, 0.1)" },
            ]),
          },
        },
      ],
    };

    chartInstance.setOption(mainChartOption);

    // 响应式调整主图表
    const resizeMain = () => {
      if (mainChartRef.current) mainChartRef.current.resize();
    };
    window.addEventListener("resize", resizeMain);

    // 获取初始数据
    fetchRealtimeData();

    // 延迟执行图表数据更新，确保图表已初始化
    setTimeout(() => {
      updateChartData(currentCurrencyPair, currentChartType);
      addChartTypeListeners();
    }, 100);

    // 定时更新实时数据
    const realtimeInterval = setInterval(fetchRealtimeData, 30000); // 30秒更新一次

    // 定时更新图表数据（分时线模式下）
    const chartUpdateInterval = setInterval(() => {
      if (currentChartType === "line") {
        updateChartData(currentCurrencyPair, currentChartType);
      }
    }, 60000); // 1分钟更新一次

    // 初始化词云图
    const wordCloudChart = echarts.init(
      document.getElementById("wordCloudChart")
    );
    const wordCloudOption = {
      series: [
        {
          type: "wordCloud",
          shape: "circle",
          left: "center",
          top: "center",
          width: "90%",
          height: "90%",
          right: null,
          bottom: null,
          sizeRange: [12, 60],
          rotationRange: [-90, 90],
          rotationStep: 45,
          gridSize: 8,
          drawOutOfBound: false,
          textStyle: {
            fontFamily: "sans-serif",
            fontWeight: "bold",
            color: function () {
              return (
                "rgb(" +
                [
                  Math.round(Math.random() * 160),
                  Math.round(Math.random() * 160),
                  Math.round(Math.random() * 160),
                ].join(",") +
                ")"
              );
            },
          },
          emphasis: {
            focus: "self",
            textStyle: {
              shadowBlur: 10,
              shadowColor: "#333",
            },
          },
          data: [
            { name: "美联储", value: 100 },
            { name: "通胀", value: 85 },
            { name: "降息", value: 80 },
            { name: "中东局势", value: 75 },
            { name: "欧元区", value: 70 },
            { name: "经济数据", value: 65 },
            { name: "央行政策", value: 60 },
            { name: "地缘政治", value: 55 },
            { name: "市场波动", value: 50 },
            { name: "风险情绪", value: 45 },
          ],
        },
      ],
    };
    wordCloudChart.setOption(wordCloudOption);

    // 初始化事件影响分析图
    const eventImpactChart = echarts.init(
      document.getElementById("eventImpactChart")
    );
    const eventImpactOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: {
        data: ["影响程度", "发生概率"],
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        boundaryGap: [0, 0.01],
      },
      yAxis: {
        type: "category",
        data: ["美联储政策", "通胀数据", "地缘冲突", "经济衰退", "贸易摩擦"],
      },
      series: [
        {
          name: "影响程度",
          type: "bar",
          data: [85, 72, 88, 65, 55],
          itemStyle: { color: "#003366" },
        },
        {
          name: "发生概率",
          type: "bar",
          data: [65, 80, 45, 35, 40],
          itemStyle: { color: "#ff9800" },
        },
      ],
    };
    eventImpactChart.setOption(eventImpactOption);

    // 响应式调整词云与事件影响图
    const resizeOthers = () => {
      wordCloudChart.resize();
      eventImpactChart.resize();
    };
    window.addEventListener("resize", resizeOthers);

    // 清理函数
    return () => {
      if (currencySelect) {
        currencySelect.removeEventListener("change", handleCurrencyChange);
      }
      window.removeEventListener("resize", resizeMain);
      window.removeEventListener("resize", resizeOthers);
      clearInterval(realtimeInterval);
      clearInterval(chartUpdateInterval);

      if (mainChartRef.current) {
        mainChartRef.current.dispose();
      }
      if (wordCloudChart) {
        wordCloudChart.dispose();
      }
      if (eventImpactChart) {
        eventImpactChart.dispose();
      }
    };
  }, []);

  /* 每当币种或图表类型变化 → 更新外链 && 重绘主图 */
  useEffect(() => {
    // 更新外部链接文本 / href
    const link = document.getElementById("externalLink");
    const externalMap = {
      USDCNY: "https://quote.eastmoney.com/forex/USDCNY.html",
      EURUSD: "https://quote.eastmoney.com/forex/EURUSD.html",
      GBPUSD: "https://quote.eastmoney.com/forex/GBPUSD.html",
      USDJPY: "https://quote.eastmoney.com/forex/USDJPY.html",
    };
    if (link) link.href = externalMap[currentCurrencyPair];

    // 拉一次数据并刷新图表
    (async () => {
      await updateChartData(currentCurrencyPair, currentChartType);
    })();
  }, [currentCurrencyPair, currentChartType]); // 仅依赖这俩
  return (
    <>
      <NavBar />

      <div className={styles["main-content"]}>
        {" "}
        <div className={styles["market-status"]}>
          <div className={styles["status-item"]}>
            <div className={styles["status-title"]}>USD/CNY</div>
            <div className={styles["status-value"]}>
              {realtimeData.USDCNY
                ? realtimeData.USDCNY.close.toFixed(4)
                : "7.2134"}{" "}
              <span
                style={{
                  color:
                    realtimeData.USDCNY && realtimeData.USDCNY.change_rate > 0
                      ? "#4CAF50"
                      : "#F44336",
                  fontSize: "0.9rem",
                }}
              >
                {realtimeData.USDCNY && realtimeData.USDCNY.change_rate > 0
                  ? "▲"
                  : "▼"}
                {realtimeData.USDCNY
                  ? Math.abs(realtimeData.USDCNY.change_rate).toFixed(2)
                  : "0.15"}
                %
              </span>
            </div>
          </div>
          <div className={styles["status-item"]}>
            <div className={styles["status-title"]}>波动率</div>
            <div className={styles["status-value"]}>
              12.5%{" "}
              <span style={{ color: "#4CAF50", fontSize: "0.9rem" }}>
                ▼2.3%
              </span>
            </div>
          </div>
          <div className={styles["status-item"]}>
            <div className={styles["status-title"]}>交易量</div>
            <div className={styles["status-value"]}>
              89.2B{" "}
              <span style={{ color: "#FFC107", fontSize: "0.9rem" }}>
                ►0.5%
              </span>
            </div>
          </div>
          <div className={styles["status-item"]}>
            <div className={styles["status-title"]}>市场情绪</div>
            <div className={styles["status-value"]}>
              偏多{" "}
              <i className="fas fa-arrow-up" style={{ color: "#4CAF50" }}></i>
            </div>
          </div>
        </div>
        <div className={styles["grid-container"]}>
          <div className={styles["chart-card"]}>
            <div className={styles["chart-header"]}>
              <h2 className={styles["chart-title"]}>外汇走势图</h2>
              <div className={styles["chart-controls"]}>
                <div className={styles["currency-selector"]}>
                  <select
                    id="currencyPair"
                    style={{
                      padding: "0.5rem",
                      marginRight: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="USDCNY">USD/CNY</option>
                    <option value="EURUSD">EUR/USD</option>
                    <option value="GBPUSD">GBP/USD</option>
                    <option value="USDJPY">USD/JPY</option>
                  </select>
                  <a
                    href="#"
                    id="externalLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles["external-link"]}
                    style={{ marginRight: "1rem" }}
                  >
                    <i className="fas fa-external-link-alt"></i> 查看更多
                  </a>
                </div>{" "}
                <button id="klineBtn" className={styles["control-btn"]}>
                  K线
                </button>
                <button
                  id="lineBtn"
                  className={`${styles["control-btn"]} ${
                    currentChartType === "line" ? styles.active : ""
                  }`}
                >
                  分时
                </button>
                <button id="maBtn" className={styles["control-btn"]}>
                  MA
                </button>
                <button id="macdBtn" className={styles["control-btn"]}>
                  MACD
                </button>
              </div>
            </div>
            <div className={styles["chart-container"]} id="mainChart"></div>
          </div>

          <div className={styles["news-feed"]}>
            <div className={styles["news-header"]}>
              <h2 className={styles["chart-title"]}>经济 &amp; 政策事件追踪</h2>
              <div className={styles["news-filter"]}>
                <button className={`${styles["filter-btn"]} ${styles.active}`}>
                  全部
                </button>
                <button className={styles["filter-btn"]}>央行</button>
                <button className={styles["filter-btn"]}>政策</button>
                <button className={styles["filter-btn"]}>市场</button>
              </div>
            </div>
            <div className={styles["news-item"]}>
              <div className={styles["news-time"]}>10:30 AM</div>
              <div className={`${styles["event-category"]} ${styles.monetary}`}>
                央行政策
              </div>
              <div className={styles["news-title"]}>美联储暗示年内或将降息</div>
              <div
                className={`${styles["news-sentiment"]} ${styles["sentiment-positive"]}`}
              >
                积极 | 影响力 85%
              </div>
              <div className={styles["event-impact"]}>
                <span>市场影响</span>
                <div className={styles["impact-bar"]}>
                  <div
                    className={`${styles["impact-value"]} ${styles["impact-high"]}`}
                    style={{ width: "85%" }}
                  ></div>
                </div>
                <span>85%</span>
              </div>
            </div>
            <div className={styles["news-item"]}>
              <div className={styles["news-time"]}>09:45 AM</div>
              <div className={styles["event-category"]}>经济数据</div>
              <div className={styles["news-title"]}>欧元区通胀数据低于预期</div>
              <div
                className={`${styles["news-sentiment"]} ${styles["sentiment-negative"]}`}
              >
                消极 | 影响力 72%
              </div>
              <div className={styles["event-impact"]}>
                <span>市场影响</span>
                <div className={styles["impact-bar"]}>
                  <div
                    className={`${styles["impact-value"]} ${styles["impact-medium"]}`}
                    style={{ width: "72%" }}
                  ></div>
                </div>
                <span>72%</span>
              </div>
            </div>
            <div className={styles["news-item"]}>
              <div className={styles["news-time"]}>09:15 AM</div>
              <div
                className={`${styles["event-category"]} ${styles.geopolitical}`}
              >
                地缘政治
              </div>
              <div className={styles["news-title"]}>中东局势紧张加剧</div>
              <div
                className={`${styles["news-sentiment"]} ${styles["sentiment-negative"]}`}
              >
                消极 | 影响力 88%
              </div>
              <div className={styles["event-impact"]}>
                <span>市场影响</span>
                <div className={styles["impact-bar"]}>
                  <div
                    className={`${styles["impact-value"]} ${styles["impact-high"]}`}
                    style={{ width: "88%" }}
                  ></div>
                </div>
                <span>88%</span>
              </div>
            </div>
          </div>

          <div className={styles["word-cloud"]}>
            <h2 className={styles["chart-title"]}>热点关键词</h2>
            <div
              className={styles["chart-container"]}
              id="wordCloudChart"
            ></div>
          </div>

          <div className={styles["event-analysis"]}>
            <h2 className={styles["chart-title"]}>事件影响分析</h2>
            <div
              className={styles["chart-container"]}
              id="eventImpactChart"
            ></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
