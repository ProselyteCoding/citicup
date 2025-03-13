import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import "./styles.css"; 

const Dashboard = () => {
    // 创建各图表的 DOM 引用
    const exposurePieRef = useRef(null);
    const riskPathRef = useRef(null);
    const paymentTermRiskRef = useRef(null);
    const eriRef = useRef(null);
    const riskSignalsRef = useRef(null);
    const backtestRef = useRef(null);

    // 用于存储各图表实例
    const charts = useRef({});

    // 生成日期数据和模拟数据
    const generateDates = (timeframe) => {
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
    };

    const generateMockData = (timeframe, multiplier = 1) => {
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
    };

    // 图表渲染函数
    const renderExposurePie = () => {
        if (!charts.current.exposurePie) {
            charts.current.exposurePie = echarts.init(exposurePieRef.current);
        }
        const option = {
            title: {
                text: "货币敞口分布",
                left: "center",
            },
            tooltip: {
                trigger: "item",
                formatter: "{a} <br/>{b}: {c}%",
            },
            legend: {
                orient: "vertical",
                left: "left",
                textStyle: {
                    color: "#333",
                },
            },
            series: [
                {
                    name: "敞口占比",
                    type: "pie",
                    radius: ["40%", "70%"],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 0,
                        borderColor: "#fff",
                        borderWidth: 2,
                    },
                    label: {
                        show: false,
                        position: "center",
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: "20",
                            fontWeight: "bold",
                        },
                    },
                    labelLine: {
                        show: false,
                    },
                    color: ["#103d7e", "#1a5bb7", "#2979ff", "#5c9cff", "#8ebfff"],
                    data: [
                        { value: 35, name: "USD" },
                        { value: 25, name: "EUR" },
                        { value: 20, name: "GBP" },
                        { value: 12, name: "JPY" },
                        { value: 8, name: "其他" },
                    ],
                },
            ],
        };
        charts.current.exposurePie.setOption(option);
    };

    const renderRiskPath = (selectedCurrency = null) => {
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
        const defaultData = currencyData["GBP/USD"];
        const data = selectedCurrency
            ? currencyData[selectedCurrency]
            : defaultData;
        const option = {
            backgroundColor: "#fff",
            tooltip: {
                trigger: "item",
                backgroundColor: "white",
                borderColor: "#eee",
                borderWidth: 1,
                padding: [10, 15],
                textStyle: {
                    color: "#666",
                    fontSize: 14,
                },
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
                    itemStyle: {
                        borderWidth: 0,
                    },
                    lineStyle: {
                        color: "#003366",
                        width: 1,
                        opacity: 0.6,
                    },
                    emphasis: {
                        scale: false,
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: "rgba(0, 51, 102, 0.3)",
                        },
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
    };

    const renderPaymentTermRisk = () => {
        if (!charts.current.paymentTermRisk) {
            charts.current.paymentTermRisk = echarts.init(paymentTermRiskRef.current);
        }
        const option = {
            title: {
                text: "账期风险分布",
                left: "center",
            },
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
            },
            grid: {
                left: "3%",
                right: "4%",
                bottom: "3%",
                containLabel: true,
            },
            xAxis: {
                type: "category",
                data: ["1-30天", "31-60天", "61-90天", "90天以上"],
            },
            yAxis: {
                type: "value",
                name: "风险指数",
                max: 100,
            },
            series: [
                {
                    name: "风险指数",
                    type: "bar",
                    barWidth: "40%",
                    data: [
                        { value: 30, itemStyle: { color: "#52c41a" } },
                        { value: 45, itemStyle: { color: "#faad14" } },
                        { value: 65, itemStyle: { color: "#ff7a45" } },
                        { value: 85, itemStyle: { color: "#ff4d4f" } },
                    ],
                    label: {
                        show: true,
                        position: "top",
                        formatter: "{c}%",
                    },
                },
            ],
        };
        charts.current.paymentTermRisk.setOption(option);
    };

    const renderERI = () => {
        if (!charts.current.eri) {
            charts.current.eri = echarts.init(eriRef.current);
        }
        const option = {
            title: {
                text: "ERI指数趋势",
                left: "center",
            },
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "cross" },
            },
            legend: {
                data: ["经济指标", "政策指标", "市场指标", "综合指数"],
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
                boundaryGap: false,
                data: ["1月", "2月", "3月", "4月", "5月", "6月"],
            },
            yAxis: {
                type: "value",
                name: "ERI指数",
                max: 100,
            },
            series: [
                {
                    name: "经济指标",
                    type: "line",
                    smooth: true,
                    data: [65, 68, 70, 72, 75, 78],
                    lineStyle: { width: 2 },
                    itemStyle: { color: "#103d7e" },
                },
                {
                    name: "政策指标",
                    type: "line",
                    smooth: true,
                    data: [55, 58, 60, 62, 65, 68],
                    lineStyle: { width: 2 },
                    itemStyle: { color: "#2979ff" },
                },
                {
                    name: "市场指标",
                    type: "line",
                    smooth: true,
                    data: [45, 48, 50, 52, 55, 58],
                    lineStyle: { width: 2 },
                    itemStyle: { color: "#5c9cff" },
                },
                {
                    name: "综合指数",
                    type: "line",
                    smooth: true,
                    data: [58, 62, 65, 68, 70, 73],
                    lineStyle: { width: 3 },
                    itemStyle: { color: "#ff4d4f" },
                },
            ],
        };
        charts.current.eri.setOption(option);
    };

    const renderRiskSignals = () => {
        if (!charts.current.riskSignals) {
            charts.current.riskSignals = echarts.init(riskSignalsRef.current);
        }
        const option = {
            title: {
                show: false,
            },
            tooltip: {
                trigger: "item",
            },
            legend: {
                orient: "horizontal",
                bottom: 10,
                left: "center",
            },
            radar: {
                center: ["50%", "50%"],
                radius: "65%",
                shape: "circle",
                splitNumber: 4,
                axisName: {
                    color: "#333",
                    fontSize: 12,
                },
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
                            value: [85, 70, 55, 65, 60],
                            name: "当前风险",
                            symbol: "circle",
                            symbolSize: 6,
                            lineStyle: {
                                width: 2,
                                color: "#103d7e",
                            },
                            areaStyle: {
                                color: "rgba(16, 61, 126, 0.3)",
                            },
                        },
                        {
                            value: [60, 60, 60, 60, 60],
                            name: "警戒线",
                            symbol: "none",
                            lineStyle: {
                                type: "dashed",
                                color: "#ff4d4f",
                            },
                            areaStyle: {
                                color: "rgba(255, 77, 79, 0.1)",
                            },
                        },
                    ],
                },
            ],
        };
        charts.current.riskSignals.setOption(option);
    };

    const renderBacktest = (currencyPair = "EURUSD", timeframe = "1M") => {
        if (!charts.current.backtest) {
            charts.current.backtest = echarts.init(backtestRef.current);
        }
        const option = {
            title: {
                text: `${currencyPair.slice(0, 3)}/${currencyPair.slice(3)} 回测分析`,
                left: "center",
            },
            tooltip: {
                trigger: "axis",
                axisPointer: {
                    type: "cross",
                },
            },
            legend: {
                data: ["实际汇率", "预测区间上限", "预测区间下限"],
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
                boundaryGap: false,
                data: generateDates(timeframe),
            },
            yAxis: {
                type: "value",
                name: "汇率",
                scale: true,
            },
            series: [
                {
                    name: "实际汇率",
                    type: "line",
                    data: generateMockData(timeframe),
                    symbol: "none",
                    lineStyle: {
                        width: 2,
                        color: "#103d7e",
                    },
                },
                {
                    name: "预测区间上限",
                    type: "line",
                    data: generateMockData(timeframe, 1.02),
                    symbol: "none",
                    lineStyle: {
                        width: 1,
                        type: "dashed",
                        color: "#ff4d4f",
                    },
                },
                {
                    name: "预测区间下限",
                    type: "line",
                    data: generateMockData(timeframe, 0.98),
                    symbol: "none",
                    lineStyle: {
                        width: 1,
                        type: "dashed",
                        color: "#ff4d4f",
                    },
                    areaStyle: {
                        color: "rgba(255, 77, 79, 0.1)",
                    },
                },
            ],
        };
        charts.current.backtest.setOption(option);
    };

    // 更新高风险货币列表点击事件（为表格行添加点击效果）
    const updateHighRiskCurrencyList = () => {
        const tbody = document.getElementById("highRiskCurrenciesList");
        if (tbody) {
            const rows = tbody.getElementsByTagName("tr");
            for (let row of rows) {
                row.style.cursor = "pointer";
                row.onclick = () => {
                    const currency = row.cells[0].textContent;
                    renderRiskPath(currency);
                    // 高亮选中行
                    for (let r of rows) {
                        r.style.backgroundColor = "";
                    }
                    row.style.backgroundColor = "rgba(0, 51, 102, 0.1)";
                };
            }
        }
    };

    // 更新时间戳
    const updateLastScanTime = () => {
        const now = new Date();
        const el = document.getElementById("lastUpdateTime");
        if (el) {
            el.textContent = now.toLocaleString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
        }
    };

    // 触发风险扫描
    const triggerRiskScan = () => {
        alert("正在进行风险DNA扫描...");
        renderExposurePie();
        renderRiskPath();
        renderPaymentTermRisk();
        renderERI();
        renderRiskSignals();
        renderBacktest();
        updateLastScanTime();
        updateHighRiskCurrencyList();
    };

    // 组件挂载后初始化图表、事件监听及窗口resize处理
    useEffect(() => {
        renderExposurePie();
        renderRiskPath();
        renderPaymentTermRisk();
        renderERI();
        renderRiskSignals();
        renderBacktest();
        updateHighRiskCurrencyList();
        updateLastScanTime();

        // 绑定下拉选择事件
        const currencySelect = document.getElementById("currencyPairSelect");
        const timeframeSelect = document.getElementById("timeframeSelect");
        if (currencySelect && timeframeSelect) {
            currencySelect.onchange = () =>
                renderBacktest(currencySelect.value, timeframeSelect.value);
            timeframeSelect.onchange = () =>
                renderBacktest(currencySelect.value, timeframeSelect.value);
        }

        // 绑定扫描按钮事件
        const manualScan = document.getElementById("manualScan");
        if (manualScan) {
            manualScan.onclick = triggerRiskScan;
        }

        // 窗口大小改变时重绘所有图表
        const handleResize = () => {
            Object.values(charts.current).forEach((chart) => {
                chart.resize();
            });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div>
            {/* 导航栏 */}
            <nav className="navbar">
                <div className="nav-top">
                    <div className="logo">RiskFX</div>
                    <div style={{ color: "white" }}>
                        <span className="market-status">
                            <span class="market-status"><i class="fas fa-circle"></i> 市场开放中</span>
                        </span>
                    </div>
                </div>
                <div className="nav-modules">
                    <div className="nav-module">
                        <i className="fas fa-globe"></i>
                        <h3>外汇市场情况</h3>
                        <p>实时汇率与市场动态</p>
                    </div>
                    <div className="nav-module">
                        <i className="fas fa-exclamation-triangle"></i>
                        <h3>风险信号可视化</h3>
                        <p>风险预警与监控</p>
                    </div>
                    <div className="nav-module">
                        <i className="fas fa-lightbulb"></i>
                        <h3>"一键式"企业决策</h3>
                        <p>智能建议与执行</p>
                    </div>
                    <div className="nav-module">
                        <i className="fas fa-file-download"></i>
                        <h3>报告下载</h3>
                        <p>分析报告与数据导出</p>
                    </div>
                </div>
            </nav>

            {/* 主体内容 */}
            <div className="container">
                <div className="main-content">
                    <div className="dashboard" id="riskDashboard">
                        <div className="dashboard-header">
                            <h2>风险DNA扫描</h2>
                            <div className="actions">
                                <button id="manualScan" className="primary-button">
                                    <i className="fas fa-sync"></i>
                                    <span>立即扫描</span>
                                </button>
                                <span className="last-update">
                                    上次更新：<span id="lastUpdateTime">--</span>
                                </span>
                            </div>
                        </div>

                        <div className="dashboard-grid">
                            {/* 货币敞口分布 */}
                            <div className="dashboard-card">
                                <div className="card-header">
                                    <h3>货币敞口分布</h3>
                                </div>
                                <div
                                    className="chart-container"
                                    id="exposure-pie"
                                    ref={exposurePieRef}
                                ></div>
                            </div>

                            {/* 高风险货币列表 */}
                            <div className="dashboard-card">
                                <div className="card-header">
                                    <h3>高风险货币列表</h3>
                                </div>
                                <div className="list-container">
                                    <table className="risk-table">
                                        <thead>
                                            <tr>
                                                <th>货币</th>
                                                <th>风险等级</th>
                                                <th>敞口比例</th>
                                                <th>趋势</th>
                                            </tr>
                                        </thead>
                                        <tbody id="highRiskCurrenciesList">
                                            <tr>
                                                <td>EUR/USD</td>
                                                <td>
                                                    <span className="risk-level risk-high">高风险</span>
                                                </td>
                                                <td>38%</td>
                                                <td>
                                                    <i
                                                        className="fas fa-arrow-up"
                                                        style={{ color: "#ff4d4f" }}
                                                    ></i>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>GBP/USD</td>
                                                <td>
                                                    <span className="risk-level risk-medium">中风险</span>
                                                </td>
                                                <td>25%</td>
                                                <td>
                                                    <i
                                                        className="fas fa-arrow-right"
                                                        style={{ color: "#faad14" }}
                                                    ></i>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 账期风险分布 */}
                            <div className="dashboard-card">
                                <div className="card-header">
                                    <h3>账期风险分布</h3>
                                </div>
                                <div
                                    className="chart-container"
                                    id="paymentTermRiskChart"
                                    ref={paymentTermRiskRef}
                                ></div>
                            </div>

                            {/* 风险传导路径 */}
                            <div className="dashboard-card">
                                <div className="card-header">
                                    <h3>风险传导路径</h3>
                                </div>
                                <div
                                    className="chart-container"
                                    id="risk-path"
                                    ref={riskPathRef}
                                ></div>
                            </div>

                            {/* ERI指数 */}
                            <div className="dashboard-card">
                                <div className="card-header">
                                    <h3>宏观风险指数 (ERI)</h3>
                                </div>
                                <div
                                    className="chart-container"
                                    id="eriChart"
                                    ref={eriRef}
                                ></div>
                            </div>

                            {/* 风险信号分析 */}
                            <div className="dashboard-card">
                                <div className="card-header">
                                    <h3>风险信号分析</h3>
                                </div>
                                <div
                                    className="chart-container"
                                    id="riskSignalsChart"
                                    ref={riskSignalsRef}
                                ></div>
                            </div>

                            {/* 单一货币对回测分析 */}
                            <div className="dashboard-card full-width">
                                <div className="card-header">
                                    <h3>单一货币对回测分析</h3>
                                    <div style={{ marginTop: "10px" }}>
                                        <select
                                            id="currencyPairSelect"
                                            style={{ padding: "5px", marginRight: "10px" }}
                                        >
                                            <option value="EURUSD">EUR/USD</option>
                                            <option value="GBPUSD">GBP/USD</option>
                                            <option value="USDJPY">USD/JPY</option>
                                        </select>
                                        <select id="timeframeSelect" style={{ padding: "5px" }}>
                                            <option value="1M">1个月</option>
                                            <option value="3M">3个月</option>
                                            <option value="6M">6个月</option>
                                            <option value="1Y">1年</option>
                                        </select>
                                    </div>
                                </div>
                                <div
                                    className="chart-container"
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
