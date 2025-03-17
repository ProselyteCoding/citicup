import React, { useRef, useState } from "react";
import Papa from "papaparse";
import styles from "./CSVHandler.module.css";
import ErrorModal from "../ErrorModal/ErrorModal"; // 引入弹窗组件

const CSVHandler = ({ onDataParsed }) => {
  const fileInputRef = useRef(null);
  const [rawData, setRawData] = useState([]);
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
      complete: (result) => {
        const data = result.data;
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
          const errMsg = `
  CSV 文件格式不正确，上传无效！
  请检查确保表头顺序正确：
  货币对	持仓量	持仓占比	盈亏	日波动率	VaR(95%)	Beta	对冲成本
`;
          setErrorMsg(errMsg);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        // 将原始数据保存，并传递给父组件
        setRawData(data);
        onDataParsed && onDataParsed(data);

        let error = null;
        const validatedData = [];
        data.forEach((row, index) => {
          for (const key of expectedFields) {
            if (!row.hasOwnProperty(key)) {
              error = `错误：第 ${index + 1} 行缺少必需的 key: ${key}`;
              return;
            }
          }
          const convertedRow = { ...row };
          convertedRow.quantity = Number(convertedRow.quantity);
          convertedRow.proportion = Number(convertedRow.proportion);
          convertedRow.benefit = Number(convertedRow.benefit);
          convertedRow.dailyVolatility = Number(convertedRow.dailyVolatility);
          convertedRow.beta = Number(convertedRow.beta);
          convertedRow.hedgingCost = Number(convertedRow.hedgingCost);
          if (
            isNaN(convertedRow.quantity) ||
            isNaN(convertedRow.proportion) ||
            isNaN(convertedRow.benefit) ||
            isNaN(convertedRow.dailyVolatility) ||
            isNaN(convertedRow.beta) ||
            isNaN(convertedRow.hedgingCost)
          ) {
            error = `错误：第 ${index + 1} 行存在无法转换为数字的值`;
            return;
          }
          validatedData.push(convertedRow);
        });
        if (error) {
          setErrorMsg(error);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        } else {
          console.log(JSON.stringify(validatedData, null, 2));
          setErrorMsg(null); // 清除错误信息
          // 此处可以添加将 validatedData 发送给后端的逻辑……
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
