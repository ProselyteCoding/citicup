import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import NavBar from "../../components/NavBar/NavBar";
import styles from "./OneClickDecision.module.css";

const ForexRiskManagement = () => {
  // 图表容器 DOM 引用
  const hedgingChartRef = useRef(null);
  const stressTestChartRef = useRef(null);
  const backtestChartRef = useRef(null);
  const fileInputRef = useRef(null);

  // ECharts 实例引用
  const hedgingChartInstance = useRef(null);
  const stressTestChartInstance = useRef(null);
  const backtestChartInstance = useRef(null);

  // 文件名状态
  const [fileInfo, setFileInfo] = useState("");
  // 压力测试情景状态
  const [scenario, setScenario] = useState("historical");

  // 模拟数据
  const currencyPairs = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD"];

  // 生成相关系数数据（目前未使用）
  const generateCorrelationData = () => {
    const data = [];
    const correlationValues = [
      [1, 0.8, -0.3, -0.5, 0.6],
      [0.8, 1, -0.2, -0.4, 0.7],
      [-0.3, -0.2, 1, 0.6, -0.1],
      [-0.5, -0.4, 0.6, 1, -0.3],
      [0.6, 0.7, -0.1, -0.3, 1],
    ];
    for (let i = 0; i < currencyPairs.length; i++) {
      for (let j = 0; j < currencyPairs.length; j++) {
        data.push([i, j, correlationValues[i][j]]);
      }
    }
    return data;
  };

  // 渲染对冲建议图表
  const renderHedgingChart = () => {
    if (!hedgingChartInstance.current) return;
    const option = {
      title: {
        text: "货币对持仓与对冲建议",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: {
        data: ["当前持仓", "建议持仓", "对冲比例"],
        top: 30,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: currencyPairs,
      },
      yAxis: [
        {
          type: "value",
          name: "持仓量",
          min: 0,
          max: 2500000,
          position: "left",
          axisLabel: { formatter: "${value}" },
        },
        {
          type: "value",
          name: "对冲比例",
          min: 0,
          max: 100,
          position: "right",
          axisLabel: { formatter: "{value}%" },
        },
      ],
      series: [
        {
          name: "当前持仓",
          type: "bar",
          data: [1000000, 800000, 2000000, 500000, 1500000],
          itemStyle: { color: "#3498db" },
        },
        {
          name: "建议持仓",
          type: "bar",
          data: [700000, 600000, 1800000, 800000, 1200000],
          itemStyle: { color: "#2ecc71" },
        },
        {
          name: "对冲比例",
          type: "line",
          yAxisIndex: 1,
          data: [30, 25, 10, 60, 20],
          itemStyle: { color: "#e74c3c" },
          label: { show: true, formatter: "{c}%" },
        },
      ],
    };
    hedgingChartInstance.current.setOption(option);
  };

  // 渲染压力测试图表
  const renderStressTestChart = () => {
    if (!stressTestChartInstance.current) return;
    const option = {
      title: {
        text: "压力测试情景分析",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: {
        data: ["潜在损失", "发生概率"],
        top: 30,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: ["美联储加息", "欧债危机", "英国脱欧"],
        axisLabel: { interval: 0, rotate: 15 },
      },
      yAxis: [
        {
          type: "value",
          name: "潜在损失",
          min: 0,
          max: 100000,
          position: "left",
          axisLabel: { formatter: "${value}" },
        },
        {
          type: "value",
          name: "发生概率",
          min: 0,
          max: 100,
          position: "right",
          axisLabel: { formatter: "{value}%" },
        },
      ],
      series: [
        {
          name: "潜在损失",
          type: "bar",
          data: [85000, 62000, 45000],
          itemStyle: { color: "#e74c3c" },
        },
        {
          name: "发生概率",
          type: "line",
          yAxisIndex: 1,
          data: [15, 12, 18],
          itemStyle: { color: "#3498db" },
          label: { show: true, formatter: "{c}%" },
        },
      ],
    };
    stressTestChartInstance.current.setOption(option);
  };

  // 渲染回测结果图表
  const renderBacktestChart = () => {
    if (!backtestChartInstance.current) return;
    const option = {
      title: {
        text: "历史回测表现",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },
      legend: {
        data: ["对冲前收益", "对冲后收益", "累计净收益"],
        top: 30,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"],
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}%" },
      },
      series: [
        {
          name: "对冲前收益",
          type: "line",
          data: [2.8, -1.5, 3.2, 1.8, -2.1, 2.5],
          itemStyle: { color: "#95a5a6" },
        },
        {
          name: "对冲后收益",
          type: "line",
          data: [2.5, 1.2, 2.8, 2.2, 1.5, 2.8],
          itemStyle: { color: "#2ecc71" },
        },
        {
          name: "累计净收益",
          type: "line",
          data: [2.38, 3.4, 6.2, 8.4, 9.9, 12.7],
          itemStyle: { color: "#3498db" },
          lineStyle: { width: 3 },
          emphasis: { lineStyle: { width: 4 } },
        },
      ],
    };
    backtestChartInstance.current.setOption(option);
  };

  // 切换压力测试情景（采用 state 管理）
  const handleScenarioSwitch = (type) => {
    setScenario(type);
    // 此处可根据情景切换加载不同数据或图表配置
  };

  // 文件上传处理（使用箭头函数与 useRef）
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileInfo(`已选择: ${file.name}`);
      const reader = new FileReader();
      reader.onload = (e) => {
        processPortfolioData(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  // 处理文件数据
  const processPortfolioData = (data) => {
    try {
      updatePortfolioDisplay();
      alert("持仓数据已成功更新！");
    } catch (error) {
      alert("数据处理出错，请检查文件格式是否正确。");
    }
  };

  // 更新持仓展示（此处仅为占位，可根据需求补充逻辑）
  const updatePortfolioDisplay = () => {
    // 添加更新图表和表格的逻辑
  };

  // 刷新数据
  const refreshPortfolioData = () => {
    alert("正在刷新数据...");
    // 添加从后端获取最新数据的逻辑
  };

  // 初始化图表与监听窗口大小变化
  useEffect(() => {
    if (hedgingChartRef.current) {
      hedgingChartInstance.current = echarts.init(hedgingChartRef.current);
      renderHedgingChart();
    }
    if (stressTestChartRef.current) {
      stressTestChartInstance.current = echarts.init(stressTestChartRef.current);
      renderStressTestChart();
    }
    if (backtestChartRef.current) {
      backtestChartInstance.current = echarts.init(backtestChartRef.current);
      renderBacktestChart();
    }
    const handleResize = () => {
      hedgingChartInstance.current?.resize();
      stressTestChartInstance.current?.resize();
      backtestChartInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      hedgingChartInstance.current?.dispose();
      stressTestChartInstance.current?.dispose();
      backtestChartInstance.current?.dispose();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <NavBar />

      <div className={styles.p3Container}>
        {/* 多币种敞口分析 */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.portfolioHeader}>
            <h2>多币种敞口分析</h2>
            <div className={styles.uploadSection}>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.xlsx"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <button
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <i className="fas fa-upload"></i> 上传持仓数据
              </button>
              <button
                className={styles.refreshBtn}
                onClick={refreshPortfolioData}
              >
                <i className="fas fa-sync-alt"></i> 刷新数据
              </button>
              <span className={styles.fileInfo} id="fileInfo">
                {fileInfo}
              </span>
            </div>
          </div>
          <div className={styles.portfolioStats}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>总持仓价值</div>
              <div className={styles.statValue}>$5,800,000</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>组合波动率</div>
              <div className={styles.statValue}>8.5%</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>夏普比率</div>
              <div className={styles.statValue}>1.25</div>
            </div>
          </div>
          <div className={styles.matrixContainer}>
            <table className={styles.matrix}>
              <thead>
                <tr>
                  <th>货币对</th>
                  <th>持仓量</th>
                  <th>持仓占比</th>
                  <th>盈亏</th>
                  <th>日波动率</th>
                  <th>VaR(95%)</th>
                  <th>Beta</th>
                  <th>对冲成本</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>EUR/USD</td>
                  <td>1,000,000</td>
                  <td>17.2%</td>
                  <td className={styles.positive}>+2,500</td>
                  <td>12.5%</td>
                  <td>$15,000</td>
                  <td>1.2</td>
                  <td>0.15%</td>
                </tr>
                <tr>
                  <td>GBP/USD</td>
                  <td>800,000</td>
                  <td>13.8%</td>
                  <td className={styles.positive}>+1,800</td>
                  <td>11.2%</td>
                  <td>$12,000</td>
                  <td>1.1</td>
                  <td>0.18%</td>
                </tr>
                <tr>
                  <td>USD/JPY</td>
                  <td>2,000,000</td>
                  <td>34.5%</td>
                  <td className={styles.negative}>-1,200</td>
                  <td>8.5%</td>
                  <td>$25,000</td>
                  <td>0.9</td>
                  <td>0.12%</td>
                </tr>
                <tr>
                  <td>USD/CHF</td>
                  <td>500,000</td>
                  <td>8.6%</td>
                  <td className={styles.positive}>+950</td>
                  <td>7.8%</td>
                  <td>$8,000</td>
                  <td>0.8</td>
                  <td>0.14%</td>
                </tr>
                <tr>
                  <td>AUD/USD</td>
                  <td>1,500,000</td>
                  <td>25.9%</td>
                  <td className={styles.negative}>-800</td>
                  <td>13.2%</td>
                  <td>$18,000</td>
                  <td>1.3</td>
                  <td>0.16%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className={styles.exposureDetails}>
            <h4>主要风险敞口</h4>
            <p style={{ margin: "0.5rem 0" }}>
              <span className={styles.currencyTag}>USD: 长头寸</span>
              <span className={styles.currencyTag}>EUR: 短头寸</span>
              <span className={styles.currencyTag}>JPY: 中性</span>
            </p>
            <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              当前组合在USD方向上呈现较大敞口，建议通过EUR/USD和GBP/USD对冲降低美元敞口。日元方向保持中性，可作为对冲工具。
            </p>
          </div>
        </div>

        {/* 压力测试结果 */}
        <div className={styles.card}>
          <h2>压力测试结果</h2>
          <div className={styles.stressTestScenarios}>
            <div className={styles.scenarioTabs}>
              <button
                className={`${styles.tabBtn} ${
                  scenario === "historical" ? styles.tabBtnActive : ""
                }`}
                onClick={() => handleScenarioSwitch("historical")}
              >
                历史情景
              </button>
              <button
                className={`${styles.tabBtn} ${
                  scenario === "hypothetical" ? styles.tabBtnActive : ""
                }`}
                onClick={() => handleScenarioSwitch("hypothetical")}
              >
                假设情景
              </button>
            </div>
            <div className={styles.scenarioContent}>
              <div className={styles.scenarioCard}>
                <h4>情景分析结果</h4>
                <table className={styles.matrix}>
                  <thead>
                    <tr>
                      <th>压力情景</th>
                      <th>潜在损失</th>
                      <th>影响程度</th>
                      <th>发生概率</th>
                      <th>建议措施</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>美联储加息100bp</td>
                      <td className={styles.negative}>-$85,000</td>
                      <td>
                        <span className={`${styles.riskLevel} ${styles.riskHigh}`}>
                          高
                        </span>
                      </td>
                      <td>15%</td>
                      <td>增加USD/JPY对冲比例</td>
                    </tr>
                    <tr>
                      <td>欧债危机恶化</td>
                      <td className={styles.negative}>-$62,000</td>
                      <td>
                        <span className={`${styles.riskLevel} ${styles.riskMedium}`}>
                          中
                        </span>
                      </td>
                      <td>12%</td>
                      <td>减少EUR敞口</td>
                    </tr>
                    <tr>
                      <td>英国脱欧影响</td>
                      <td className={styles.negative}>-$45,000</td>
                      <td>
                        <span className={`${styles.riskLevel} ${styles.riskMedium}`}>
                          中
                        </span>
                      </td>
                      <td>18%</td>
                      <td>调整GBP/USD持仓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div
                className={styles.chartContainer}
                ref={stressTestChartRef}
                id="stress-test-chart"
              >
                {/* 压力测试图表将在这里渲染 */}
              </div>
            </div>
          </div>
          <div className={styles.stressTestSummary}>
            <h4>压力测试总结</h4>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryTitle}>最大潜在损失</div>
                <div className={`${styles.summaryValue} ${styles.negative}`}>
                  $85,000
                </div>
                <div className={styles.summaryDesc}>在美联储大幅加息情景下</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryTitle}>风险承受能力</div>
                <div className={styles.summaryValue}>充足</div>
                <div className={styles.summaryDesc}>
                  当前资本金可覆盖压力情景
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryTitle}>建议对冲比例</div>
                <div className={styles.summaryValue}>65%</div>
                <div className={styles.summaryDesc}>基于压力测试结果</div>
              </div>
            </div>
          </div>
        </div>

        {/* 历史回测分析 */}
        <div className={styles.card}>
          <h2>历史回测分析</h2>
          <div className={styles.backtestHeader}>
            <div className={styles.backtestFilters}>
              <select className={styles.backtestFilter} defaultValue="6m">
                <option value="1m">近1月</option>
                <option value="3m">近3月</option>
                <option value="6m">近6月</option>
                <option value="1y">近1年</option>
              </select>
              <select className={styles.backtestFilter} defaultValue="weekly">
                <option value="daily">日度</option>
                <option value="weekly">周度</option>
                <option value="monthly">月度</option>
              </select>
            </div>
          </div>
          <div className={styles.backtestMetrics}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>累计收益率</div>
              <div className={`${styles.metricValue} ${styles.positive}`}>
                +15.8%
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>最大回撤</div>
              <div className={`${styles.metricValue} ${styles.negative}`}>
                -8.5%
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>胜率</div>
              <div className={styles.metricValue}>62.5%</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>收益回撤比</div>
              <div className={styles.metricValue}>1.86</div>
            </div>
          </div>
          <div
            className={styles.chartContainer}
            ref={backtestChartRef}
            id="backtest-chart"
          >
            {/* 回测结果图表将在这里渲染 */}
          </div>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th>时间段</th>
                <th>对冲前收益</th>
                <th>对冲后收益</th>
                <th>对冲成本</th>
                <th>净收益</th>
                <th>最大回撤</th>
                <th>夏普比率</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2024-03</td>
                <td className={styles.positive}>+3.2%</td>
                <td className={styles.positive}>+2.8%</td>
                <td>0.15%</td>
                <td className={styles.positive}>+2.65%</td>
                <td className={styles.negative}>-2.1%</td>
                <td>1.95</td>
              </tr>
              <tr>
                <td>2024-02</td>
                <td className={styles.negative}>-1.5%</td>
                <td className={styles.positive}>+1.2%</td>
                <td>0.18%</td>
                <td className={styles.positive}>+1.02%</td>
                <td className={styles.negative}>-1.8%</td>
                <td>1.45</td>
              </tr>
              <tr>
                <td>2024-01</td>
                <td className={styles.positive}>+2.8%</td>
                <td className={styles.positive}>+2.5%</td>
                <td>0.12%</td>
                <td className={styles.positive}>+2.38%</td>
                <td className={styles.negative}>-1.5%</td>
                <td>2.15</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 智能交易执行系统 */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h2>智能交易执行系统</h2>
          <div className={styles.executionPanel}>
            <h3>当前对冲建议</h3>
            <div className={styles.analysisGrid}>
              <div className={styles.analysisCard}>
                <h4>市场波动性分析</h4>
                <div className={styles.indicator}>
                  <span className={styles.indicatorLabel}>EUR/USD波动率</span>
                  <span className={styles.indicatorValue}>12.5%</span>
                </div>
                <div className={styles.indicator}>
                  <span className={styles.indicatorLabel}>市场情绪指标</span>
                  <span className={styles.indicatorValue}>偏多</span>
                </div>
                <p>当前市场波动性处于中等水平，建议适度对冲以控制风险。</p>
              </div>
              <div className={styles.analysisCard}>
                <h4>头寸风险评估</h4>
                <div className={styles.indicator}>
                  <span className={styles.indicatorLabel}>当前风险敞口</span>
                  <span className={`${styles.riskLevel} ${styles.riskHigh}`}>
                    高风险
                  </span>
                </div>
                <div className={styles.indicator}>
                  <span className={styles.indicatorLabel}>VaR(95%)</span>
                  <span className={styles.indicatorValue}>$25,000</span>
                </div>
                <p>建议降低EUR/USD敞口，增加对冲比例。</p>
              </div>
              <div className={styles.analysisCard}>
                <h4>相关性分析</h4>
                <div className={styles.indicator}>
                  <span className={styles.indicatorLabel}>货币对相关性</span>
                  <span className={styles.indicatorValue}>强正相关</span>
                </div>
                <div className={styles.indicator}>
                  <span className={styles.indicatorLabel}>对冲效果预估</span>
                  <span className={`${styles.riskLevel} ${styles.riskMedium}`}>
                    中等
                  </span>
                </div>
                <p>
                  当前EUR/USD与GBP/USD呈强正相关，建议选择负相关货币对进行对冲。
                </p>
              </div>
              <div className={styles.analysisCard}>
                <h4>成本效益分析</h4>
                <div className={styles.indicator}>
                  <span className={styles.indicatorLabel}>对冲成本</span>
                  <span className={styles.indicatorValue}>0.15%</span>
                </div>
                <div className={styles.indicator}>
                  <span className={styles.indicatorLabel}>收益率影响</span>
                  <span className={`${styles.riskLevel} ${styles.riskLow}`}>
                    低影响
                  </span>
                </div>
                <p>当前对冲成本相对较低，建议进行策略性对冲。</p>
              </div>
            </div>
            <div
              className={styles.chartContainer}
              ref={hedgingChartRef}
              id="hedging-chart"
            >
              {/* 对冲建议图表将在这里渲染 */}
            </div>
            <button className={styles.button}>执行对冲策略</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForexRiskManagement;
