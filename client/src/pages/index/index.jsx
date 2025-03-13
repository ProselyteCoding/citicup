import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
    return (
        <div
            className="container"
            style={{ textAlign: "center", marginTop: "2rem" }}
        >
            <h1>欢迎来到外汇风险管理系统首页</h1>
            <p>请点击下方按钮进入风险DNA分析页面</p>
            <Link to="/dashboard">
                <button className="primary-button">进入风险DNA分析</button>
            </Link>
        </div>
    );
};

export default Home;
