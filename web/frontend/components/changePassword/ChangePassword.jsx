import { Link } from "react-router-dom";
import axios from 'axios';
import "./style.css";
import { useState } from "react";
import { Modal } from "../modal";
import { Loader } from "../loader";
import { SuccessModal } from "../successModal";

export function ChangePassword(props) {
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const changePassword = () => {
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
        axios.post(`${process.env.API_ENDPOINT}/api/wp/change_password`, payload, { "headers": headers }).then(response => {
            setIsLoading(false);
            setShowModal(true);
        }).catch(error => {
            setIsLoading(false);
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
            <div className="heading1">
                Change Password
            </div>
            <div className="inner-container">
                <div className="input-container">
                    <div className="input-lebel">
                        <span> Password&nbsp;</span><span style={{ color: "red" }}> *</span>
                    </div>
                    <div className="input-field">
                        <input className="input-field-text" type="password" onChange={(e) => setPassword(e.target.value)} />
                    </div>
                </div>
                <div className="input-container">
                    <div className="input-lebel">
                        <span> New Password&nbsp;</span><span style={{ color: "red" }}> *</span>
                    </div>
                    <div className="input-field">
                        <input className="input-field-text" type="password" onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                </div>
                <div className="input-container">
                    <div className="input-lebel">
                        <span>Confirm Password&nbsp;</span><span style={{ color: "red" }}> *</span>
                    </div>
                    <div className="input-field">
                        <input className="input-field-text" type="password" onChange={(e) => setConfirmPassword(e.target.value)} />
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