import React from 'react';
import './MessageToast.css'; // Optional CSS file for styling

const MessageToast = ({ message, type = 'info', onClose }) => {
  return (
    <div className={`message-toast ${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
};

export default MessageToast;
