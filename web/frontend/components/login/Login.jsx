import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.css";
import { useState, useEffect } from "react";
import { Loader } from "../loader";
import { ErrorModal } from "../errorModal";
import { useAuthenticatedFetch } from "../../hooks";
import PasswordInput from "./PasswordInput";
;

export function Login(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openErrorModal, setOpenErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    "The login details are incorrect. Please try again."
  );
  const fetch = useAuthenticatedFetch();
  const navigate = useNavigate();

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    return isValid;
  }

  function validations() {
    if (!email || !isValidEmail(email)) {
      return false;
    }
    if (!password) {
      return false;
    }
    return true;
  }

  const login = () => {
    try {
      const isValid = validations();
      if (isValid) {
        setIsLoading(true);
        const payload = {
          email: email,
          password: password,
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
          .post(`${localStorage.getItem("isProduction")==="1"?process.env.PROD_API_ENDPOINT : process.env.API_ENDPOINT}/api/wp/login`, payload, {
            headers: headers,
          })
          .then((response) => {
            props.setUserDetails(response.data.merchant);
            localStorage.setItem(
              "accessToken",
              response.data.merchant.access_token
            );
            setMerchantTokenAndDomainId(
              response.data.merchant.access_token,
              response.data.merchant.id
            ).then(() => {
              localStorage.setItem(
                "merchantDomainId",
                response.data.merchant.id
              );
              navigate("/homepage");
              setIsLoading(false);
            });
          })
          .catch((error) => {
            setIsLoading(false);
            console.log(error);
            setOpenErrorModal(true);
          });
      } else {
        setOpenErrorModal(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // const accessToken = localStorage.getItem("accessToken");
    // if (accessToken) {
    //   navigate("/homepage");
    // }
    localStorage.clear();
    getUserData().then((data) => {
      if (data.data) {
        console.log(data)
        localStorage.setItem("userData", JSON.stringify(data.data));
        if (data.data.is_production === "1") {
          localStorage.setItem("isProduction", "1");
          props.setIsStaging(false);
        } else {
          localStorage.setItem("isProduction", "0");
          props.setIsStaging(true);
        }
        getMerchantTokenAndDomainId();
      }
    });
  }, []);

  const setMerchantTokenAndDomainId = (access_token, merchant_domain_id) => {
    setIsLoading(true);

    return fetch("/api/set-merchant-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: access_token,
        merchant_domain_id: merchant_domain_id,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // You can handle the `data` if needed
      })
      .catch((err) => {
        setIsLoading(false);
        console.log(err);
      });
  };
  const getUserData = () => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);

      fetch("/api/get-current-session", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setIsLoading(false);
          resolve(data); // Resolve the promise with the fetched data
        })
        .catch((err) => {
          setIsLoading(false);
          reject(err); // Reject the promise with the error
        });
    });
  };

  async function getMerchantTokenAndDomainId() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/get-merchant-token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (data.data) {
        console.log(data.data, "data.data");
        localStorage.setItem("accessToken", data.data.merchant_token);

        localStorage.setItem("merchantDomainId", data.data.merchant_id);
        navigate("/homepage");
        setIsLoading(false);
      } else {
       
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  }


  async function logOutUser( ) {
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
        props.setIsStaging(props.executeSandboxStatus.value === "1" ? false : true);
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
          data: data
        }),
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(error => {
            throw new Error(`Error: ${error.message}`);
          });
        }
        return response.json();
      })
      .then(responseData => {
        resolve(responseData);
      })
      .catch(error => {
        console.error("Error:", error);
        reject(error);
      });
    });
  }
  useEffect(() => {
    if (props.executeSandboxStatus.execute == "sandbox") {
      setIsLoading(true);
      setDataIntoData("is_production", JSON.parse(props.executeSandboxStatus.value)).then(()=>{
        localStorage.setItem("isProduction", JSON.parse(props.executeSandboxStatus.value));
        logOutUser()
      })
    }
   
  }, [props.executeSandboxStatus])

  return (
    <div className="main-container">
      {isLoading && <Loader />}
      <ErrorModal
        showModal={openErrorModal}
        message={errorMessage}
        onConfirm={() => setOpenErrorModal(false)}
      />
      <div className="logo-image">
        <img src="https://portal-staging.fastcourier.com.au/assets/media/logos/fast-courier-dark.png" />
      </div>
      <div className="inner-container">
        <div className="heading1">Sign In to FastCourier</div>
        <div className="heading2">
          <span>New Here? </span>
          <Link to="/signup" style={{ textDecoration: "none" }}>
            <span className="text-button"> Create an Account </span>
          </Link>
        </div>
        <div className="input-container">
          <div className="input-lebel">
            <span> Email&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
          </div>
          <div className="input-field">
            <input
              className="input-field-text"
              type="text"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="heading-continer">
          <div className="heading-text1">
            <span> Password&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
          </div>
          <div className="heading-text2">
            <Link to="/forgotPassword" style={{ textDecoration: "none" }}>
              <span className="text-button"> Forgot Password ? </span>
            </Link>
          </div>
        </div>
        <div className="input-container">
          <div className="input-field">
            <PasswordInput 
              name="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="input-container">
          <button
            type="submit"
            className="submit-btn"
            onClick={() => {
              login();
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}






