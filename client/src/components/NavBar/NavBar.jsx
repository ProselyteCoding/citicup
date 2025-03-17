import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./NavBar.module.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const NavBar = () => {
  const handleDownload = async () => {
    try {
      // 创建隐藏的 iframe 来加载页面三 (/OneClickDecision)
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.top = "-10000px";
      iframe.style.left = "-10000px";
      // 设置 iframe 初始宽度，根据实际情况调整
      iframe.style.width = "1280px";
      iframe.src = "/OneClickDecision";
      document.body.appendChild(iframe);

      iframe.onload = async () => {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        // 获取整个页面的真实高度
        const fullHeight = iframeDocument.documentElement.scrollHeight;
        // 设置 iframe 高度为整个页面高度
        iframe.style.height = fullHeight + "px";

        // 延时确保所有内容和样式加载完成
        setTimeout(async () => {
          // 使用 html2canvas 对 iframe 的 body 进行截图，scale 参数用于提升分辨率
          const canvas = await html2canvas(iframeDocument.body, {
            scale: 3, // 调高 scale 值可以提升截图像素
            height: fullHeight,
            windowHeight: fullHeight,
            scrollY: 0,
            useCORS: true,
          });
          const imgData = canvas.toDataURL("image/png");

          // 根据 canvas 尺寸创建 PDF 文件
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: [canvas.width, canvas.height],
          });

          pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
          pdf.save("一键式企业决策.pdf");
          document.body.removeChild(iframe);
        }, 500);
      };
    } catch (error) {
      console.error("下载页面截图失败:", error);
    }
  };

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
        {/* 报告下载按钮：点击后全屏截图页面三并以 PDF 形式保存 */}
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
