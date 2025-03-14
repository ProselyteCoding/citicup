import React from "react";
import NavBar from "../../components/NavBar/NavBar"; 

const Home = () => {
  return (
    <div>
      <NavBar />
      <div className="container">
        <div className="main-content">
          <h1>首页</h1>
        </div>
      </div>
    </div>
  );
};

export default Home;
