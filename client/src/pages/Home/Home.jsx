import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"; // 仍使用同一个 CSS 文件

const Home = () => {
  return (
    <nav className="nav__container">
      <div className="nav__header">
        <div className="nav__logo">RiskFX</div>
        <div style={{ color: "white" }}>
          <span className="nav__status">
            <span class="market-status">
              <i class="fas fa-circle"></i> 市场开放中
            </span>
          </span>
        </div>
      </div>
      <div className="nav__links">
        <div className="nav__link">
          <Link to="/">
            <i className="fas fa-globe"></i>
            <h3>外汇市场情况</h3>
            <p>实时汇率与市场动态</p>
          </Link>
        </div>
        <div className="nav__link">
          <Link to="/RiskSignals">
            <i className="fas fa-exclamation-triangle"></i>
            <h3>风险信号可视化</h3>
            <p>风险预警与监控</p>
          </Link>
        </div>
        <div className="nav__link">
          <i className="fas fa-lightbulb"></i>
          <h3>"一键式"企业决策</h3>
          <p>智能建议与执行</p>
        </div>
        <div className="nav__link">
          <i className="fas fa-file-download"></i>
          <h3>报告下载</h3>
          <p>分析报告与数据导出</p>
        </div>
      </div>
    </nav>
  );
};

export default Home;
