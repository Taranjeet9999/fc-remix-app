import React, { useState } from "react";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const PasswordInput = ({ onChange = () => {}, name }) => {
  const [passwordShow, setPasswordShow] = useState(false);
  return (
    <div className="d-flex align-items-center input-field-text flex-1">
      <input
        className="input-field-text flex-1"
        type={passwordShow ? "text" : "password"}
        name={name}
        onChange={onChange}
      />
      {passwordShow ? (
         <FontAwesomeIcon
         icon="fa-solid fa-eye"
         className="eye-icon"
         onClick={() => setPasswordShow(false)}
       />

      ) : (
      
        <FontAwesomeIcon
        icon="fa-solid fa-eye-slash"
        className="eye-icon"
        size="sm"
        
        onClick={() => setPasswordShow(true)}
      />
      )}
    </div>
  );
};

export default PasswordInput;
