import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import NavBar from "../../components/NavBar/NavBar";
import styles from "./OneClickDecision.module.css";
import CSVHandler from "../../components/csvHandler/csvHandler";
import Loading from "../../components/Loading";
import { useStore } from "../../../store"; // 从 zustand 中读取数据

const ForexRiskManagement = () => {
  // 从全局状态中获取解析后的持仓数据和测试数据
  const { transformedData, analysis } = useStore();

  // 图表容器 DOM 引用
  const hedgingChartRef = useRef(null);
  const stressTestChartRef = useRef(null);
  const backtestChartRef = useRef(null);

  // ECharts 实例引用
  const hedgingChartInstance = useRef(null);
  const stressTestChartInstance = useRef(null);
  const backtestChartInstance = useRef(null);

  // 压力测试情景状态
  const [scenario, setScenario] = useState("");

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
        data: [
          "2024-01",
          "2024-02",
          "2024-03",
          "2024-04",
          "2024-05",
          "2024-06",
        ],
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



  const handleSubmitScenario = (scenario) => {
    console.log('提交的情景假设：', scenario);
    alert(`提交如下情境：${scenario}`)
  };
  


  // 切换压力测试情景（采用 state 管理）
  const handleScenarioSwitch = (type) => {
    setScenario(type);
    // 此处可根据情景切换加载不同数据或图表配置
  };

  const refreshPortfolioData = async () => {
    try {
      // 可选：显示加载提示，比如设置一个 loading 状态
      // 发起数据请求（请根据实际 API 地址进行修改）
      // const response = await fetch('/api/portfolioData');
      // if (!response.ok) {
      //   throw new Error("数据请求失败");
      // }
      // const updatedData = await response.json();

      // 更新全局状态（假设 useStore 提供了 setState 方法）
      // useStore.setState({ transformedData: updatedData });

      // 重新渲染图表，确保图表能展示最新数据
      renderHedgingChart();
      renderStressTestChart();
      renderBacktestChart();

      // 可选：结束加载提示
      alert("数据刷新成功！");
    } catch (error) {
      console.error("刷新数据错误: ", error);
      alert("刷新数据失败，请重试。");
    }
  };

  // 初始化图表及监听窗口大小变化
  useEffect(() => {
    if (hedgingChartRef.current) {
      hedgingChartInstance.current = echarts.init(hedgingChartRef.current);
      renderHedgingChart();
    }
    if (stressTestChartRef.current) {
      stressTestChartInstance.current = echarts.init(
        stressTestChartRef.current
      );
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
              {/* 使用 CSVHandler 组件，不再依赖回调传递数据 */}
              <CSVHandler />
              <button
                className={styles.refreshBtn}
                onClick={refreshPortfolioData}
              >
                <i className="fas fa-sync-alt"></i> 刷新数据
              </button>
            </div>
          </div>
          {/* 总持仓数据 */}
          <div className={styles.portfolioStats}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>总持仓价值</div>
              <div className={styles.statValue}>
                {transformedData && transformedData.length > 0 ? (
                  `$${transformedData
                    .reduce((total, pos) => total + Number(pos.quantity), 0)
                    .toLocaleString()}`
                ) : (
                  <Loading />
                )}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>组合波动率</div>
              <div className={styles.statValue}>
                <Loading />
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>夏普比率</div>
              <div className={styles.statValue}>
                <Loading />
              </div>
            </div>
          </div>
          {/* 持仓数据表格 */}
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
                {transformedData && transformedData.length > 0 ? (
                  transformedData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.currency}</td>
                      <td>{row.quantity}</td>
                      <td>{(row.proportion * 100).toFixed(2)}%</td>
                      <td
                        className={
                          row.benefit >= 0 ? styles.positive : styles.negative
                        }
                      >
                        {row.benefit >= 0 ? `+${row.benefit}` : row.benefit}
                      </td>
                      <td>{row.dailyVolatility}</td>
                      <td>{row.valueAtRisk}</td>
                      <td>{row.beta}</td>
                      <td>{(row.hedgingCost * 100).toFixed(2)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">
                      <Loading />
                    </td>
                  </tr>
                )}
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
            <p
              style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.5rem" }}
            >
              当前组合在USD方向上呈现较大敞口，建议通过EUR/USD和GBP/USD对冲降低美元敞口。日元方向保持中性，可作为对冲工具。
            </p>
          </div>
        </div>

        {/* 以下为压力测试、历史回测、智能交易执行系统部分，示例代码保持不变 */}
        {/* 压力测试结果 */}
        <div className={styles.card}>
          <h2>压力测试结果</h2>
          <div className={styles.stressTestScenarios}>
            <div className={styles.scenarioTabs}>
              {/* 输入框和提交按钮 */}
              <input
                type="text"
                className={styles.backtestFilter}
                value={scenario}
                onChange={(e) => handleScenarioSwitch(e.target.value)}
                placeholder="请输入情景假设"
              />
              <button className={styles.uploadBtn} onClick={() => handleSubmitScenario(scenario)}>
                <i className="fas fa-upload"></i> 提交情境
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
                        <span
                          className={`${styles.riskLevel} ${styles.riskHigh}`}
                        >
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
                        <span
                          className={`${styles.riskLevel} ${styles.riskMedium}`}
                        >
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
                        <span
                          className={`${styles.riskLevel} ${styles.riskMedium}`}
                        >
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
              <Loading />
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>最大回撤</div>
              <Loading />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForexRiskManagement;
