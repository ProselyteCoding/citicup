import React from "react";
import NavBar from "../../components/NavBar/NavBar";
import styles from "./Home.module.css";

const Home = () => {
  return (
    <div>
      <NavBar />
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <h1 className={styles.title}>首页</h1>
        </div>
      </div>
    </div>
  );
};

export default Home;
