import React, { useRef, useState } from "react";
import Papa from "papaparse";
import styles from "./CSVHandler.module.css";
import { sendTradeData } from "../Api/api"; // 导入发送数据的函数
import ErrorModal from "../ErrorModal/ErrorModal";
import { useStore } from "../../../store"; // 导入 zustand 全局状态

const analysis = {
  finalAssetValue: 10000,
  initialAssetValue: 50000,
  highestAssetValue: 120000,
  lowestAssetValue: 45000,
  profitableTradeCount: 25,
};

const CSVHandler = ({ onDataParsed }) => {
  const fileInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const setData = useStore((state) => state.setData); // 从 zustand 中获取更新数据的方法
  const setBackendData = useStore((state) => state.setBackendData); // 新增：从 zustand 中获取更新后端数据的方法

  const handleButtonClick = () => {
    // 1. 清空之前的错误信息
    setErrorMsg(null);

    // 2. 如果你想每次点击上传按钮都重置之前的数据，请解除下面注释
    setData([], {}); // 清空之前的解析结果（如果你希望保留，可以删除这行）
    setBackendData(null); // 清空之前的后端数据

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
          const errMsg = 
`CSV 文件格式不正确，上传无效！
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
        setData(transformedData, analysis);

        // 将数据传给后端，并将返回的数据存入 store
        // try {
        //   const backendData = await sendTradeData(transformedData);
        //   setBackendData(backendData); // 将后端返回的数据存入 store
        //   //onDataParsed(backendData); // 传回数据给父组件
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