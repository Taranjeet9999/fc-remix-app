import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import "../login/style.css";
import "./style.css";
import { useState ,useEffect} from "react";
import { Modal } from "../modal";
import { Loader } from "../loader";
import { SuccessModal } from "../successModal";
import { useAuthenticatedFetch } from "../../hooks";
import { ErrorModal } from "../errorModal";
;

export function ForgotPassword(props) {
    const [email, setEmail] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fetch = useAuthenticatedFetch();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState("");
    const [openErrorModal, setOpenErrorModal] = useState(false);

    const forgotPassword = () => {
        if (!validations()) {
            return;
        }
        setIsLoading(true);
        const payload = {
            "email": email,
        }
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          "request-type": "shopify_development",
          version: "3.1.1",
          Authorization: "Bearer " + localStorage.getItem("accessToken"),
          "store-domain": localStorage.getItem("userData") ?  JSON.parse(localStorage.getItem("userData")).id   :"",
        }
        
        axios.post(`${localStorage.getItem("isProduction")==="1"?process.env.PROD_API_ENDPOINT : process.env.API_ENDPOINT}/api/wp/forgot_password`, payload, { "headers": headers }).then(response => {
            setIsLoading(false);
            setShowModal(true);
        }).catch(error => {
            setIsLoading(false);
            console.log(error);
            setOpenErrorModal(true);
            setErrorMessage(error?.response?.data?.message ?? "Something went wrong");
        })
    }

    function validations() {
      
      if (email == "" || !validateEmail(email)) {
        setErrorMessage("Please enter valid email");
        return false;
      }
     
      
      return true;
    }
    function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
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
            navigate("/login" + localStorage.getItem("appSearchParams"));
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
            <SuccessModal
                showModal={showModal}
                message="We have sent you a password reset email."
                onConfirm={() => navigate("/login")}
            />

<ErrorModal
        showModal={openErrorModal}
        message={errorMessage}
        onConfirm={() => setOpenErrorModal(false)}
      />
            <div className="logo-image">
                <img src="https://portal.fastcourier.com.au/assets/media/logos/fast-courier-dark.png" />
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
                        {errorMessage != "" && email == "" && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
            {errorMessage != "" && !validateEmail(email) && (
              <span style={{ color: "red" }}> &nbsp; {"- Enter valid email"}</span>
            )}
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