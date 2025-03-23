import React, { useCallback } from "react";
import { NavLink } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import styles from "./NavBar.module.css";
import { useStore } from "../../../store"; // 引入 zustand store

const NavBar = () => {
  const handleDownload = useCallback(async () => {
    try {
      // 从全局 store 获取数据，确保数据已加载
      const { transformedData, stressTestData } = useStore.getState();
      if (!transformedData) {
        alert("数据尚未加载完成，请稍等...");
        return;
      }

      // 隐藏导航栏，避免截取到
      const navBarElement = document.querySelector(`.${styles.navbar}`);
      if (navBarElement) {
        navBarElement.style.display = "none";
      }

      // 直接对当前页面（document.body）截图
      const canvas = await html2canvas(document.body, {
        scale: 1, // 根据需要调整缩放以提升分辨率
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      // 恢复导航栏显示
      if (navBarElement) {
        navBarElement.style.display = "";
      }

      // 生成 PDF 文件
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("一键式企业决策报告.pdf");
    } catch (error) {
      console.error("下载报告失败:", error);
    }
  }, []);

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
        {/* 外汇市场情况 */}
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
        {/* 风险信号可视化 */}
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
        {/* "一键式"企业决策 */}
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
        {/* 报告下载按钮 */}
        <div
          className={styles.navModule}
          onClick={handleDownload}
          style={{ cursor: "pointer" }}
        >
          <i className="fas fa-file-download"></i>
          <h3>报告下载</h3>
          <p>分析报告与数据导出</p>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
