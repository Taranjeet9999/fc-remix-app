import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import "../login/style.css";
import "./style.css";
import { useState } from "react";
import { Modal } from "../modal";
import { Loader } from "../loader";
import { SuccessModal } from "../successModal";

export function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const forgotPassword = () => {
        setIsLoading(true);
        const payload = {
            "email": email,
        }
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "request-type": process.env.REQUEST_TYPE,
            "version": "3.1.1",
        }
        axios.post(`${process.env.API_ENDPOINT}/api/wp/forgot_password`, payload, { "headers": headers }).then(response => {
            setIsLoading(false);
            setShowModal(true);
        }).catch(error => {
            setIsLoading(false);
            console.log(error);
        })
    }
    return (
        <div className="main-container">
            {isLoading && <Loader />}
            <SuccessModal
                showModal={showModal}
                message="We have sent you a password reset email."
                onConfirm={() => navigate("/login")}
            />
            <div className="logo-image">
                <img src="https://portal-staging.fastcourier.com.au/assets/media/logos/fast-courier-dark.png" />
            </div>
            <div className="inner-container">
                <div className="heading1">
                    Forgot Password ?
                </div>
                <div className="heading2">
                    <span style={{ color: "#b5b5c3" }}>Enter your email to reset your password.</span>
                </div>

                <div className="input-container">
                    <div className="input-lebel">
                        <span> Email&nbsp;</span><span style={{ color: "red" }}> *</span>
                    </div>
                    <div className="input-field">
                        <input className="input-field-text" type="text" onChange={(e) => setEmail(e.target.value)} />
                    </div>
                </div>
                <div className="btn-section">
                    <button className="submit-btn" onClick={() => forgotPassword()}>
                        Submit
                    </button>
                    <Link to="/login" style={{ width: "100%" }}>
                        <button className="cancel-btn" >
                            Cancel
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}