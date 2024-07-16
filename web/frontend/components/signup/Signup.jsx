import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../login/style.css";
import { useEffect, useState } from "react";
import { Loader } from "../loader";
import { useAuthenticatedFetch } from "../../hooks";
import PasswordInput from "../login/PasswordInput";
;

export function Signup(props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const fetch = useAuthenticatedFetch();
  const setMerchantTokenAndDomainId = async (
    access_token,
    merchant_domain_id
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/set-merchant-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: access_token,
          merchant_domain_id: merchant_domain_id,
        }),
      });
      const data = await response.json();
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  function validations() {
    if (firstName == "") {
      setErrorMessage("Please enter location name");
      return false;
    }
    if (lastName == "") {
      setErrorMessage("Please enter first name");
      return false;
    }
    if (email == "" || !validateEmail(email)) {
      setErrorMessage("Please enter valid email");
      return false;
    }
    if (password == "" ) {
      setErrorMessage("Please enter phone number");
      return false;
    }
    if (confirmPassword == "") {
      setErrorMessage("Please enter address1");
      return false;
    }
    if (confirmPassword !== password) {
      setErrorMessage("Please enter address1");
      return false;
    }
    return true;
  }

  const signup = () => {
    const valid = validations();
    if (!valid) {
      return;
    }
    setIsLoading(true);
    const payload = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      companyName: companyName,
      password: password,
      confirmPassword: confirmPassword,
    };
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": "shopify_development",
      version: "3.1.1",
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      "store-domain": localStorage.getItem("userData") ?  JSON.parse(localStorage.getItem("userData")).id   :"",
    }

    axios
      .post(
        `${
          localStorage.getItem("isProduction") === "1"
            ? process.env.PROD_API_ENDPOINT
            : process.env.API_ENDPOINT
        }/api/wp/signup`,
        payload,
        { headers: headers }
      )
      .then((response) => {
        props.setUserDetails(response.data.merchant);
        localStorage.setItem(
          "accessToken",
          response.data.merchant.access_token
        );
        localStorage.setItem("merchantDomainId", response.data.merchant.id);
        setMerchantTokenAndDomainId(
          response.data.merchant.access_token,
          response.data.merchant.id
        );
        navigate("/homepage");
        setIsLoading(false);
      })
      .catch((error) => {
        setIsLoading(false);
        console.log(error);
      });
  };

  async function logOutUser() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/remove-merchant-token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (data.data) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("merchantDomainId");
        navigate("/login");
        props.setIsStaging(
          props.executeSandboxStatus.value === "1" ? false : true
        );
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  }

  function setDataIntoData(columnName, data) {
    return new Promise((resolve, reject) => {
      fetch("/api/add-data-into-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          columnName: columnName,
          data: data,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((error) => {
              throw new Error(`Error: ${error.message}`);
            });
          }
          return response.json();
        })
        .then((responseData) => {
          resolve(responseData);
        })
        .catch((error) => {
          console.error("Error:", error);
          reject(error);
        });
    });
  }
  useEffect(() => {
    if (props.executeSandboxStatus.execute == "sandbox") {
      setIsLoading(true);
      setDataIntoData(
        "is_production",
        JSON.parse(props.executeSandboxStatus.value)
      ).then(() => {
        localStorage.setItem(
          "isProduction",
          JSON.parse(props.executeSandboxStatus.value)
        );
        logOutUser();
      });
    }
  }, [props.executeSandboxStatus]);
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  return (
    <div className="main-container">
      {isLoading && <Loader />}
      <div className="logo-image">
        <img src="https://portal-staging.fastcourier.com.au/assets/media/logos/fast-courier-dark.png" />
      </div>
      <div className="inner-container">
        <div className="heading1">Create an Account</div>
        <div className="heading2">
          <span>Already have an account? </span>
          <Link to="/login" style={{ textDecoration: "none" }}>
            <span className="text-button"> Sign in here</span>
          </Link>
        </div>
        <div className="input-container">
          <div className="input-lebel">
            <span> First Name&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errorMessage != "" && firstName == "" && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="input-field">
            <input
              className="input-field-text"
              type="text"
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
        </div>
        <div className="input-container">
          <div className="input-lebel">
            <span> Last Name&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errorMessage != "" && lastName == "" && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="input-field">
            <input
              className="input-field-text"
              type="text"
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div className="input-container">
          <div className="input-lebel">
            <span> Email&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errorMessage != "" && email == "" && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
            {errorMessage != "" && !validateEmail(email) && (
              <span style={{ color: "red" }}> &nbsp; {"- Enter valid email"}</span>
            )}
          </div>
          <div className="input-field">
            <input
              className="input-field-text"
              type="text"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="input-container">
          <div className="input-lebel">Company (Optional)</div>
          <div className="input-field">
            <input
              className="input-field-text"
              type="text"
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        </div>
        <div className="input-container">
          <div className="input-lebel">
            <span> Password&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errorMessage != "" && password == "" && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
             
            {errorMessage != "" && password !== confirmPassword && (
              <span style={{ color: "red" }}> &nbsp; {"- Doesn't match"}</span>
            )}
          </div>
          <div className="input-field">
            <PasswordInput
              className="input-field-text"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="input-container">
          <div className="input-lebel">
            <span>Confirm Password&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errorMessage != "" && confirmPassword == "" && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="input-field">
            <PasswordInput
              className="input-field-text"
              type="password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
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
