import React, { useRef, useState } from "react";
import Papa from "papaparse";
import styles from "./CSVHandler.module.css";
import { sendTradeData } from "../Api/analyze"; // 导入发送数据的函数
import ErrorModal from "../ErrorModal/ErrorModal"


const testData = {
  "success": true,
  "message": "持仓数据上传成功",
  "data": {
    "totalValue": "10,250000",
    "portfolioVolatility": 0.07,
    "sharpeRatio": 1.58,
    "portfolio": [
      {
        "currency": "EUR/USD",
        "quantity": 15000,
        "proportion": 0.25,
        "benefit": 2000,
        "dailyVolatility": 0.1,
        "valueAtRisk": "$8,000",
        "beta": 1.3,
        "hedgingCost": 0.002
      },
      {
        "currency": "GBP/USD",
        "quantity": 12000,
        "proportion": 0.2,
        "benefit": -500,
        "dailyVolatility": 0.15,
        "valueAtRisk": "$5,000",
        "beta": 1.1,
        "hedgingCost": 0.0018
      },
      {
        "currency": "AUD/USD",
        "quantity": 8000,
        "proportion": 0.15,
        "benefit": 1500,
        "dailyVolatility": 0.12,
        "valueAtRisk": "$6,000",
        "beta": 1.05,
        "hedgingCost": 0.0013
      },
      {
        "currency": "USD/JPY",
        "quantity": 10000,
        "proportion": 0.4,
        "benefit": 3000,
        "dailyVolatility": 0.09,
        "valueAtRisk": "$12,000",
        "beta": 1.2,
        "hedgingCost": 0.0025
      }
    ]
  }
}








const CSVHandler = ({ onDataParsed }) => {
  const fileInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleButtonClick = () => {
    // 每次点击上传按钮前清除之前的错误信息
    setErrorMsg(null);
    fileInputRef.current && fileInputRef.current.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log(`已选择文件：${file.name}`);
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target.result;
        processCSVData(csvData);
      };
      reader.readAsText(file);
    }
  };

  const processCSVData = (csvData) => {
    Papa.parse(csvData, {
      skipEmptyLines: true,
      header: true,
      complete: async (result) => {
        const data = result.data;
        const expectedFields = [
          "currency",
          "quantity",
          "rate",
          "currentPrice",
          "openPrice",
          "dailyVolatility",
        ];

        // 验证表头顺序
        if (
          !result.meta.fields ||
          result.meta.fields.join(",") !== expectedFields.join(",")
        ) {
          const errMsg = `
CSV 文件格式不正确，上传无效！
请检查确保表头顺序正确：
货币对	持仓量	汇率	当前价格	开盘价格	日波动率
`;
          setErrorMsg(errMsg);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        // 数据转换并发送至后端
        const transformedData = data.map((row) => ({
          currency: row.currency,
          quantity: Number(row.quantity),
          rate: Number(row.rate),
          currentPrice: Number(row.currentPrice),
          openPrice: Number(row.openPrice),
          dailyVolatility: Number(row.dailyVolatility),
        }));

        // 验证数据是否转换为数字
        const invalidData = transformedData.find(
          (row) =>
            isNaN(row.quantity) ||
            isNaN(row.rate) ||
            isNaN(row.currentPrice) ||
            isNaN(row.openPrice) ||
            isNaN(row.dailyVolatility)
        );

        if (invalidData) {
          setErrorMsg("数据转换失败，存在无效的数字！");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        console.log(transformedData);
        onDataParsed(testData); // 测试
        // try {
          
          
        //   const backendData = await sendTradeData(transformedData); 
        //   onDataParsed(backendData); // 传回数据给父组件
        //   setErrorMsg(null); // 清除错误信息
        // } catch (error) {
        //   setErrorMsg("后端数据处理失败！");
        // }
      },
    });
  };

  return (
    <div className={styles.csvHandlerContainer}>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />
      <button className={styles.uploadBtn} onClick={handleButtonClick}>
        <i className="fas fa-upload"></i> 上传持仓数据
      </button>
      {errorMsg && (
        <ErrorModal message={errorMsg} onClose={() => setErrorMsg(null)} />
      )}
    </div>
  );
};

export default CSVHandler;
