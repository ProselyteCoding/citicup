import React, { useRef, useState } from "react";
import Papa from "papaparse";
import styles from "./CSVHandler.module.css";
import { postTradeData, getTradeData } from "../Api/api";
import ErrorModal from "../ErrorModal/ErrorModal";
import { useStore } from "../../../store"; // 导入 zustand 全局状态

const CSVHandler = ({ onDataParsed }) => {
  const fileInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // 使用 store 中的更新函数
  const setTransformedData = useStore((state) => state.setTransformedData);
  const setAdviceData = useStore((state) => state.setAdviceData);
  const setRiskSignalsData = useStore((state) => state.setRiskSignalsData);
  const setStressTestData = useStore((state) => state.setStressTestData);

  const handleButtonClick = () => {
    // 1. 清空之前的错误信息
    setErrorMsg(null);

    // 2. 重置之前的数据
    setTransformedData(null); // 清空之前的解析结果
    setAdviceData(null);      // 清空之前的后端数据

    // 3. 清空 fileInput，以便再次选择同一文件时也能触发 onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
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
        // 修改 expectedFields，确保 CSV 文件格式正确
        const expectedFields = [
          "currency",
          "quantity",
          "proportion",
          "benefit",
          "dailyVolatility",
          "valueAtRisk",
          "beta",
          "hedgingCost",
        ];

        // 验证表头顺序
        if (
          !result.meta.fields ||
          result.meta.fields.join(",") !== expectedFields.join(",")
        ) {
          const errMsg = `CSV 文件格式不正确，上传无效！
请检查确保表头顺序正确：
货币对	持仓量	持仓占比	盈亏	日波动率	VaR(95%)	Beta	对冲成本`;
          setErrorMsg(errMsg);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        // 数据转换并发送至后端
        const transformedData = data.map((row) => ({
          currency: row.currency,
          quantity: Number(row.quantity),
          proportion: Number(row.proportion),
          benefit: Number(row.benefit),
          dailyVolatility: Number(row.dailyVolatility),
          valueAtRisk: row.valueAtRisk, // 保持字符串格式，例如 "$15,000"
          beta: Number(row.beta),
          hedgingCost: Number(row.hedgingCost),
        }));

        // 验证数据是否转换为数字
        const invalidData = transformedData.find(
          (row) =>
            isNaN(row.quantity) ||
            isNaN(row.proportion) ||
            isNaN(row.benefit) ||
            isNaN(row.dailyVolatility) ||
            isNaN(row.beta) ||
            isNaN(row.hedgingCost)
        );

        if (invalidData) {
          setErrorMsg("数据转换失败，存在无效的数字！");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        console.log(transformedData);

        // 使用 zustand 将数据存入全局状态
        setTransformedData(transformedData);

        try {
          // 1.1 上传持仓数据,返回"上传成功"
          const backendData = await postTradeData("http://localhost:5000/api/portfolio/upload", transformedData);
          console.log(backendData);
          // 1.2 调用 GET 请求获取对冲建议，并存入全局状态
          const adviceDataResponse = await getTradeData("http://localhost:5000/api/portfolio/hedging-advice");
          console.log(adviceDataResponse);
          setAdviceData(adviceDataResponse);
          // 1.3 货币预测的api（假设返回 currencyPredictionData）可按需求添加

          // 2.1 调用 GET 请求获取风险信号分析，并存入全局状态
          const riskSignalsDataResponse = await getTradeData("http://localhost:5000/api/portfolio/risk-signals");
          console.log(riskSignalsDataResponse);
          setRiskSignalsData(riskSignalsDataResponse);

          // 2.2 调用 POST 请求获取压力测试，并存入全局状态
          // 这里传入页面三 OneClickDecision 用户填写的情境，替换 string 为实际数据
          // const stressTestDataResponse = await postTradeData("http://localhost:5000/api/risk/stress-test", string);
          // console.log(stressTestDataResponse);
          // setStressTestData(stressTestDataResponse);

          setErrorMsg(null); // 清除错误信息
        } catch (error) {
          setErrorMsg("后端数据处理失败！");
        }
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
