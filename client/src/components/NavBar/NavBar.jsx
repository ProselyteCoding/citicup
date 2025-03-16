import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./NavBar.module.css";

const NavBar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navTop}>
        <div className={styles.logo}>RiskFX</div>
        <div style={{ color: "white" }}>
          <span className={styles.marketStatus}>
            <i className="fas fa-circle"></i> 市场开放中
          </span>
        </div>
      </div>
      <div className={styles.navModules}>
        {/* 使用 NavLink，根据 isActive 添加特殊样式 */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? `${styles.navModule} ${styles.active}` : styles.navModule
          }
        >
          <i className="fas fa-globe"></i>
          <h3>外汇市场情况</h3>
          <p>实时汇率与市场动态</p>
        </NavLink>
        <NavLink
          to="/RiskSignals"
          className={({ isActive }) =>
            isActive ? `${styles.navModule} ${styles.active}` : styles.navModule
          }
        >
          <i className="fas fa-exclamation-triangle"></i>
          <h3>风险信号可视化</h3>
          <p>风险预警与监控</p>
        </NavLink>
        <NavLink
          to="/OneClickDecision"
          className={({ isActive }) =>
            isActive ? `${styles.navModule} ${styles.active}` : styles.navModule
          }
        >
          <i className="fas fa-lightbulb"></i>
          <h3>"一键式"企业决策</h3>
          <p>智能建议与执行</p>
        </NavLink>
        {/* 如果报告下载没有对应的路由，可以保持原样 */}
        <div className={styles.navModule}>
          <i className="fas fa-file-download"></i>
          <h3>报告下载</h3>
          <p>分析报告与数据导出</p>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
