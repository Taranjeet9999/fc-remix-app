import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import "../login/style.css";
import { useState } from "react";
import { Loader } from "../loader";

export function Signup(props) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const signup = () => {
        setIsLoading(true);
        const payload = {
            "firstName": firstName,
            "lastName": lastName,
            "email": email,
            "companyName": companyName,
            "password": password,
            "confirmPassword": confirmPassword,
        }
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "request-type": process.env.REQUEST_TYPE,
            "Origin": "http://shopify-development.com",
            "version": "3.1.1",
        }

        axios.post(`${process.env.API_ENDPOINT}/api/wp/signup`, payload, { "headers": headers }).then(response => {
            props.setUserDetails(response.data.merchant);
            localStorage.setItem("accessToken", response.data.merchant.access_token);
            localStorage.setItem("merchantDomainId", response.data.merchant.id);
            navigate('/homepage');
            setIsLoading(false);
        }).catch(error => {
            setIsLoading(false);
            console.log(error);
        })

    }
    return (
        <div className="main-container">
            {
                isLoading &&
                <Loader />
            }
            <div className="logo-image">
                <img src="https://portal-staging.fastcourier.com.au/assets/media/logos/fast-courier-dark.png" />
            </div>
            <div className="inner-container">
                <div className="heading1">
                    Create an Account
                </div>
                <div className="heading2">
                    <span>Already have an account? </span>
                    <Link to="/login" style={{ textDecoration: "none" }}>
                        <span className="text-button"> Sign in here</span>
                    </Link>
                </div>
                <div className="input-container">
                    <div className="input-lebel">
                        <span> First Name&nbsp;</span><span style={{ color: "red" }}> *</span>
                    </div>
                    <div className="input-field">
                        <input className="input-field-text" type="text" onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                </div>
                <div className="input-container">
                    <div className="input-lebel">
                        <span> Last Name&nbsp;</span><span style={{ color: "red" }}> *</span>
                    </div>
                    <div className="input-field">
                        <input className="input-field-text" type="text" onChange={(e) => setLastName(e.target.value)} />
                    </div>
                </div>
                <div className="input-container">
                    <div className="input-lebel">
                        <span> Email&nbsp;</span><span style={{ color: "red" }}> *</span>
                    </div>
                    <div className="input-field">
                        <input className="input-field-text" type="text" onChange={(e) => setEmail(e.target.value)} />
                    </div>
                </div>
                <div className="input-container">
                    <div className="input-lebel">
                        Company (Optional)
                    </div>
                    <div className="input-field">
                        <input className="input-field-text" type="text" onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                </div>
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
                        <span>Confirm Password&nbsp;</span><span style={{ color: "red" }}> *</span>
                    </div>
                    <div className="input-field">
                        <input className="input-field-text" type="password" onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
                <div className="input-container">
                    <button className="submit-btn" onClick={() => signup()}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}