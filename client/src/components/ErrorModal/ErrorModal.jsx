import React from "react";
import styles from "./ErrorModal.module.css";

const ErrorModal = ({ message, onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>错误!</h3> 
        <p>{message}</p>
        <button className={styles.closeButton} onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;