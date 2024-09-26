import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.css";
import { useState, useEffect, useRef } from "react";
import { Loader } from "../loader";
import { ErrorModal } from "../errorModal";
import { useAuthenticatedFetch } from "../../hooks";
import PasswordInput from "./PasswordInput";
import { CLIENT_ID, CLIENT_SECRET } from "../../globals";
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

  function refreshToken(
    _refresh_token,
    _client_id,
    _client_secret
  ) {
    return new Promise((resolve, reject) => {
      axios
        .post(
          `${
            localStorage.getItem("isProduction") === "1"
              ? process.env.PROD_API_ENDPOINT
              : process.env.API_ENDPOINT
          }/api/refresh-token`,
          {
            refresh_token: _refresh_token,
            client_id: _client_id,
            client_secret: _client_secret,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(async (response) => {
          localStorage.setItem("accessToken", response.data.access_token);
          localStorage.setItem("refresh_token", response.data.refresh_token);
          localStorage.setItem("expires_at", response.data.expires_at);

          await setDataIntoData("merchant_token", response.data.access_token);
          await setDataIntoData(
            "merchant_refresh_token",
            response.data.refresh_token
          );
          await setDataIntoData(
            "merchant_token_expires_at",
            response.data.expires_at
          );

          resolve(response.data);
        })
        .catch((error) => reject(error));
    });
  }
  

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

  function checkAuth(_token) {
    const urlParams = new URLSearchParams(localStorage.getItem("appSearchParams")); 
const storeDomain = urlParams.get('shop');
    return new Promise((resolve, reject) => {
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        "request-type": "shopify_development",
        version: "3.1.1",
        Authorization: "Bearer " + _token,
        "store-domain":"offline_"+ storeDomain,
      };
  
      axios
        .get(
          `${
            localStorage.getItem("isProduction") === "1"
              ? process.env.PROD_API_ENDPOINT
              : process.env.API_ENDPOINT
          }/api/wp/get_merchant`,
          { headers: headers }
        )
        .then((response) => { 
          resolve(response.data);
        })
        .catch((error) => { 
          setIsLoading(false);
          reject(error);
        });
    });
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
          "store-domain": localStorage.getItem("userData")
            ? JSON.parse(localStorage.getItem("userData")).id
            : "",
        };
        axios
          .post(
            `${
              localStorage.getItem("isProduction") === "1"
                ? process.env.PROD_API_ENDPOINT
                : process.env.API_ENDPOINT
            }/api/wp/login`,
            payload,
            {
              headers: headers,
            }
          )
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
    
    localStorage.removeItem("accessToken");
    localStorage.removeItem("merchantDomainId");
    
    if (
      window.location.search?.length > 0 &&
      String(window.location.search).includes("shop")
    ) {
       
      window.localStorage.setItem("appSearchParams", window.location.search);
    }else{
      
      // window.location.reload();
    }
    
    getUserData().then((data) => {
      if (data.data) {
        if (data.data.is_production?.includes('1')) {
                  
          localStorage.setItem("isProduction", "1");
          props.setIsStaging(false);
        } else {
          localStorage.setItem("isProduction", "0");
          props.setIsStaging(true);
        }
        if (data.data.merchant_token) {
          checkAuth(data.data.merchant_token)
            .then((response) => {
              setIsLoading(false);

              if (response) {
                localStorage.setItem("userData", JSON.stringify(data.data));
                localStorage.setItem("accessToken", data.data.merchant_token);
                localStorage.setItem(
                  "refresh_token",
                  data.data.merchant_refresh_token
                );
                localStorage.setItem(
                  "expires_at",
                  data.data.merchant_token_expires_at
                );
                localStorage.setItem("client_id", data.data.client_id);
                localStorage.setItem("client_secret", data.data.client_secret);
                localStorage.setItem("merchantDomainId", response.data.id);
              
                navigate("/homepage");
              }
            })
            .catch((error) => {
              console.log("Check Auth Error", error);
              setIsLoading(true);
              refreshToken(
                data.data.merchant_refresh_token,
                data.data.client_id,
                data.data.client_secret
              )
                .then((refreshTokenResponse) => {
                  checkAuth(refreshTokenResponse.access_token)
                    .then((checkAuthResponse) => {
                      setIsLoading(false);
                      if (checkAuthResponse) {
                        localStorage.setItem(
                          "userData",
                          JSON.stringify(data.data)
                        );
                        localStorage.setItem(
                          "accessToken",
                          refreshTokenResponse.access_token
                        );
                        localStorage.setItem(
                          "refresh_token",
                          refreshTokenResponse.refresh_token
                        );
                        localStorage.setItem(
                          "expires_at",
                          refreshTokenResponse.expires_at
                        );
                        localStorage.setItem("client_id", data.data.client_id);
                        localStorage.setItem(
                          "client_secret",
                          data.data.client_secret
                        );
                        localStorage.setItem(
                          "merchantDomainId",
                          checkAuthResponse.data.id
                        );
                        if (data.data.is_production?.includes('1')) {
                          localStorage.setItem("isProduction", "1");
                          props.setIsStaging(false);
                        } else {
                          localStorage.setItem("isProduction", "0");
                          props.setIsStaging(true);
                        }
                        navigate("/homepage");
                      }
                    })
                    .catch((error) => {
                      console.log("Check Auth Error", error);
                    });
                })
                .catch((error) => {
                  setIsLoading(false);
                  console.log("Refresh Token Error", error);
                });
            });
        } else {
          setIsLoading(false);
        }
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
      <ErrorModal
        showModal={openErrorModal}
        message={errorMessage}
        onConfirm={() => setOpenErrorModal(false)}
      />
      <div className="logo-image">
        <img src="https://portal.fastcourier.com.au/assets/media/logos/fast-courier-dark.png" />
      </div>
      <div className="inner-container">
        <div className="heading1">Connect to FastCourier</div>

{false &&<>
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

        </>}
        <div className=" "
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width:"45%",
          flexDirection:"column",
          fontWeight:"bold",
        }}
        >
          <button
            type="submit"
            className="submit-btn"
            style={{
              fontWeight:"600"
            }}
            onClick={() => {
              
               
              const query = new URLSearchParams(window.location.search);
              const params = {};
              query.forEach((value, key) => {
                params[key] = value;
              }); 
              const queryParams = new URLSearchParams(params).toString(); 
              const url = encodeURIComponent(
                `${window.location.origin}/api/oauth-callback${window.localStorage.getItem("appSearchParams")}&isProduction=${localStorage.getItem("isProduction")}`
              );
              // const url = encodeURIComponent(
              //   `${window.location.origin}/api/oauth-callback?${queryParams}`
              // );
              console.log(`${
               true
                 ? "https://portal.fastcourier.com.au/oauth/redirect?client_id=1&client_secret=GFts6cyRs1gyV2Aon8eTeicAS9HRPqPcN9ZqG7QQ"
                 : "https://portal.fastcourier.com.au/oauth/redirect?client_id=4&client_secret=wUhSh8PYMlnVbZ9XU72wuVPvaw8SJY6jUIvgmfic"
             }&app=shopify&redirect_uri=${url}`)
           const newWindow = window.open(
             `${
               true
                 ? "https://portal.fastcourier.com.au/oauth/redirect?client_id=1&client_secret=GFts6cyRs1gyV2Aon8eTeicAS9HRPqPcN9ZqG7QQ"
                 : "h--ttps://portal-staging.fastcourier.com.au/oauth/redirect?client_id=4&client_secret=wUhSh8PYMlnVbZ9XU72wuVPvaw8SJY6jUIvgmfic"
             }&app=shopify&redirect_uri=${url}`,
             "popupWindow",
             "width=7000,height=7000"
           );
           var pollTimer = window.setInterval(function() {
            if (newWindow.closed !== false) {   
              window.clearInterval(pollTimer);
             getUserData().then((data) => {
              if (data.data.is_production?.includes('1')) {
                  
                localStorage.setItem("isProduction", "1");
                props.setIsStaging(false);
              } else {
                localStorage.setItem("isProduction", "0");
                props.setIsStaging(true);
              }
              if (data.data) {
                if (data.data.merchant_token) {
                  checkAuth(data.data.merchant_token).then((response)=>{
                   setIsLoading(false);

                    if(response){
                      localStorage.setItem("userData", JSON.stringify(data.data));
                      localStorage.setItem("accessToken", data.data.merchant_token);
                      localStorage.setItem("refresh_token", data.data.merchant_refresh_token);
                      localStorage.setItem("expires_at", data.data.merchant_token_expires_at);
                      localStorage.setItem("client_id", data.data.client_id);
                      localStorage.setItem("client_secret", data.data.client_secret);
                      localStorage.setItem("merchantDomainId", response.data.id)
                      
                      navigate("/homepage");
                    }

                  }).catch((error)=>{
                    console.log(error)
                  });
                }else{
                  setIsLoading(false);
                }
                
              }})
              
            }
          }, 500);
            }}
          >
            Connect  
          </button>
        </div>
      </div>
    </div>
  );
}






