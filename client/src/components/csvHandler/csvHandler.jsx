import React, { useRef } from "react";
import Papa from "papaparse";
import styles from "./CSVHandler.module.css"; // 导入样式

const CSVHandler = () => {
  // 使用 useRef 保存隐藏的文件输入框引用
  const fileInputRef = useRef(null);

  // 触发按钮点击，模拟点击隐藏的文件输入框
  const handleButtonClick = () => {
    fileInputRef.current && fileInputRef.current.click();
  };

  // 文件选择后触发的事件处理函数
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log(`已选择文件：${file.name}`);
      const reader = new FileReader();
      // 文件读取完成后执行回调
      reader.onload = (e) => {
        const csvData = e.target.result;
        processCSVData(csvData);
      };
      // 以文本形式读取 CSV 文件
      reader.readAsText(file);
    }
  };

  // 解析 CSV 数据并进行验证
  const processCSVData = (csvData) => {
    Papa.parse(csvData, {
      skipEmptyLines: true, // 跳过空行，避免解析出空对象
      header: true, // 第一行作为表头
      complete: (result) => {
        const data = result.data;
        // 定义预期的字段顺序
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

        // 验证表头顺序是否符合预期
        if (
          !result.meta.fields ||
          result.meta.fields.join(",") !== expectedFields.join(",")
        ) {
          console.error(
            `CSV表头顺序错误，期望顺序为: ${expectedFields.join(
              ", "
            )}，但实际为: ${
              result.meta.fields ? result.meta.fields.join(", ") : "无表头"
            }`
          );
          // 清空文件输入框，提示用户重新上传正确格式的文件
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }

        let error = null;
        const validatedData = [];

        // 遍历每一行数据进行验证
        data.forEach((row, index) => {
          // 检查每行是否包含所有必需的字段
          for (const key of expectedFields) {
            if (!row.hasOwnProperty(key)) {
              error = `错误：第 ${index + 1} 行缺少必需的 key: ${key}`;
              return;
            }
          }

          // 将应为数字的字段转换为 Number 类型
          row.quantity = Number(row.quantity);
          row.proportion = Number(row.proportion);
          row.benefit = Number(row.benefit);
          row.dailyVolatility = Number(row.dailyVolatility);
          row.beta = Number(row.beta);
          row.hedgingCost = Number(row.hedgingCost);

          // 检查转换后的数值是否为有效数字
          if (
            isNaN(row.quantity) ||
            isNaN(row.proportion) ||
            isNaN(row.benefit) ||
            isNaN(row.dailyVolatility) ||
            isNaN(row.beta) ||
            isNaN(row.hedgingCost)
          ) {
            error = `错误：第 ${index + 1} 行存在无法转换为数字的值`;
            return;
          }

          // 如果验证通过，将该行数据加入 validatedData 数组
          validatedData.push(row);
        });

        // 如果存在错误，则输出错误信息，并清空文件输入框
        if (error) {
          console.error(error);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        } else {
          // 测试当前
          console.log(JSON.stringify(validatedData, null, 2));  
          // 此处可以添加将 validatedData 发送给后端的逻辑
        }
      },
    });
  };

  return (
    <>
      {/* 隐藏的文件输入框，用户不可见，仅用于文件上传 */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />
      {/* 自定义上传按钮，点击后触发隐藏文件输入框的点击 */}
      <button className={styles.uploadBtn} onClick={handleButtonClick}>
        <i className="fas fa-upload"></i> 上传持仓数据
      </button>
    </>
  );
};

export default CSVHandler;
