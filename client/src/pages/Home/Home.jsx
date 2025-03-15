import React, { useEffect } from "react";
import * as echarts from "echarts";
import "echarts-wordcloud";
import styles from "./Home.module.css";
import NavBar from "../../components/NavBar/NavBar";

const Home = () => {
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

    // 修改生成数据的函数
    const generateData = (baseValue = 7.2) => {
      let data = [];
      let now = new Date();
      for (let i = 0; i < 100; i++) {
        let date = new Date(now - (100 - i) * 1000 * 60);
        data.push({
          name: date.toString(),
          value: [date, baseValue + Math.random() * 0.1],
        });
      }
      return data;
    };

    // 更新图表数据
    const updateChartData = (currencyPair) => {
      const baseValues = {
        USDCNY: 7.2,
        EURUSD: 1.08,
        GBPUSD: 1.26,
        USDJPY: 148.5,
      };
      const baseValue = baseValues[currencyPair];
      const newData = generateData(baseValue);
      mainChart.setOption({
        series: [
          {
            name: currencyPair,
            data: newData,
          },
        ],
      });
    };

    // 监听币种选择变化（使用回调引用，以便后续移除）
    const currencySelect = document.getElementById("currencyPair");
    const handleCurrencyChange = (e) => {
      const currencyPair = e.target.value;
      updateExternalLink(currencyPair);
      updateChartData(currencyPair);
    };
    if (currencySelect) {
      currencySelect.addEventListener("change", handleCurrencyChange);
    }

    // 初始化外部链接
    updateExternalLink("USDCNY");

    // 初始化主图表
    const mainChart = echarts.init(document.getElementById("mainChart"));
    const mainChartOption = {
      tooltip: {
        trigger: "axis",
        formatter: function (params) {
          return (
            params[0].name.split(" ")[4] +
            "<br/>" +
            "价格: " +
            params[0].value[1].toFixed(4)
          );
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
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        boundaryGap: [0, "100%"],
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
          },
        },
      },
      series: [
        {
          name: "USD/CNY",
          type: "line",
          showSymbol: false,
          data: generateData(),
          lineStyle: {
            color: "#003366",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: "rgba(0, 51, 102, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(0, 51, 102, 0.1)",
              },
            ]),
          },
        },
      ],
    };

    mainChart.setOption(mainChartOption);

    // 响应式调整主图表
    const resizeMain = () => {
      mainChart.resize();
    };
    window.addEventListener("resize", resizeMain);

    // 修改实时数据更新逻辑，使用 mainChart.getOption() 获取最新数据
    const intervalId = setInterval(() => {
      const currencyPair = document.getElementById("currencyPair").value;
      const baseValues = {
        USDCNY: 7.2,
        EURUSD: 1.08,
        GBPUSD: 1.26,
        USDJPY: 148.5,
      };
      const baseValue = baseValues[currencyPair];
      // 获取当前最新数据
      const option = mainChart.getOption();
      let data = option.series[0].data;
      let now = new Date();
      data.shift();
      data.push({
        name: now.toString(),
        value: [
          now,
          data[data.length - 1].value[1] + (Math.random() - 0.5) * 0.01,
        ],
      });
      mainChart.setOption({
        series: [
          {
            name: currencyPair,
            data: data,
          },
        ],
      });
    }, 1000);

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
        axisPointer: {
          type: "shadow",
        },
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
          itemStyle: {
            color: "#003366",
          },
        },
        {
          name: "发生概率",
          type: "bar",
          data: [65, 80, 45, 35, 40],
          itemStyle: {
            color: "#ff9800",
          },
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
      if (currencySelect)
        currencySelect.removeEventListener("change", handleCurrencyChange);
      window.removeEventListener("resize", resizeMain);
      window.removeEventListener("resize", resizeOthers);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <>
      <NavBar />

      <div className={styles["main-content"]}>
        <div className={styles["market-status"]}>
          <div className={styles["status-item"]}>
            <div className={styles["status-title"]}>USD/CNY</div>
            <div className={styles["status-value"]}>
              7.2134{" "}
              <span style={{ color: "#F44336", fontSize: "0.9rem" }}>
                ▲0.15%
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
                </div>
                <button className={styles["control-btn"]}>K线</button>
                <button className={`${styles["control-btn"]} ${styles.active}`}>
                  分时
                </button>
                <button className={styles["control-btn"]}>MA</button>
                <button className={styles["control-btn"]}>MACD</button>
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
            <div className={styles["chart-container"]} id="wordCloudChart"></div>
          </div>

          <div className={styles["event-analysis"]}>
            <h2 className={styles["chart-title"]}>事件影响分析</h2>
            <div className={styles["chart-container"]} id="eventImpactChart"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
