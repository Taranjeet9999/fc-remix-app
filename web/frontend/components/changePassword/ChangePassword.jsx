import { Link } from "react-router-dom";
import axios from 'axios';
import "./style.css";
import { useState } from "react";
import { Modal } from "../modal";
import { Loader } from "../loader";
import { SuccessModal } from "../successModal";
import { ErrorModal } from "../errorModal";
import PasswordInput from "../login/PasswordInput";

export function ChangePassword(props) {
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [openErrorModal, setOpenErrorModal] = useState(false);

    function validations() {
       
        if (password == "" ) {
          setErrorMessage("Please enter phone number");
          return false;
        }
        if (newPassword == "" || newPassword?.length < 6) {
          setErrorMessage("Please enter phone number");
          return false;
        }
        if (confirmPassword == ""|| confirmPassword?.length < 6) {
          setErrorMessage("Please enter address1");
          return false;
        }
        if (confirmPassword !== newPassword) {
          setErrorMessage("Please enter address1");
          return false;
        }
        return true;
      }
    

    const changePassword = () => {
        if (!validations()) {
            return;
        }
        setIsLoading(true);
        const accessToken = localStorage.getItem("accessToken");
        const payload = {
            "current_password": password,
            "new_password": newPassword,
            "confirm_password": confirmPassword,
        }
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "request-type": process.env.REQUEST_TYPE,
            "Version": "3.1.1",
            "Authorization": "Bearer " + accessToken
        }
        axios.post(`${localStorage.getItem("isProduction")==="1"?process.env.PROD_API_ENDPOINT : process.env.API_ENDPOINT}/api/wp/change_password`, payload, { "headers": headers }).then(response => {
             
            setIsLoading(false);
            setShowModal(true);
        }).catch(error => {
            setIsLoading(false);
            setOpenErrorModal(true);
            setErrorMessage(error?.response?.data?.message ??   "Input data is invalid");
            console.log(error);
        })
    }
    return (
        <div className="change-password">
            {isLoading && <Loader />}
            <SuccessModal
                showModal={showModal}
                message="Password changed successfully."
                onConfirm={() => props.setActiveNavItem("configuration")}
            />
              <ErrorModal
        showModal={openErrorModal}
        message={errorMessage}
        onConfirm={() => setOpenErrorModal(false)}
      />
            <div className="heading1">
                Change Password
            </div>
            <div className="inner-container">
                <div className="input-container">
                    <div className="input-lebel">
                        <span> Password&nbsp;</span><span style={{ color: "red" }}> *</span>
                        {errorMessage != "" && password == "" && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
                    </div>
                    <div className="input-field">
                        <PasswordInput className="input-field-text" type="password" onChange={(e) => setPassword(e.target.value)} />
                    </div>
                </div>
                <div className="input-container">
                    <div className="input-lebel">
                        <span> New Password&nbsp;</span><span style={{ color: "red" }}> *</span>
                        {errorMessage != "" && (newPassword == "" || newPassword?.length < 6) && (
              <span style={{ color: "red" }}> &nbsp; {"(Min. - 6 Chars)"}</span>
            )}
                        {errorMessage != "" && newPassword !== confirmPassword  && (
              <span style={{ color: "red" }}> &nbsp; {" - Doesn't match"}</span>
            )}
                    </div>
                    <div className="input-field">
                        <PasswordInput className="input-field-text" type="password" onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                </div>
                <div className="input-container">
                    <div className="input-lebel">
                        <span>Confirm Password&nbsp;</span><span style={{ color: "red" }}> *</span>
                        {errorMessage != "" && (confirmPassword == "") && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
                    </div>
                    <div className="input-field">
                        <PasswordInput className="input-field-text" type="password" onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
                <div className="btn-section">
                    <button className="submit-btn" onClick={() => changePassword()}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}