import { useEffect, useState } from "react";
import { Link, redirect, useLocation, useNavigate } from "react-router-dom";
// import { MerchantBillingDetails } from "../components/merchantBillingDetails";
import axios from "axios";
import "./style.scss";
import { Configuration } from "../components/configuration";
import { NewOrders } from "../components/newOrders"; 
import { ProcessedOrders } from "../components/processedOrders"; 
import { useAuthenticatedFetch } from "../hooks";
import { Loader } from "../components/loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import { OrderDetails } from "../components/orderDetails/OrderDetails";

export default function HomePage(props) {
  const [activeNavItem, setActiveNavItem] = useState();
  const navigate = useNavigate();
  const location = useLocation();
  const fetch = useAuthenticatedFetch();
  const [isLoading, setIsLoading] = useState(false);
  const [userSetupConfigured, setUserSetupConfigured] = useState(false);

  
  
  useEffect(() => {
     
    if (location.state?.redirectedtab) {
      setActiveNavItem(location.state?.redirectedtab);
    } else {
      setActiveNavItem("configuration");
    }
  }, [location.state]);

  const logout = () => {
    logOutUser();
  };

  const getComponent = () => {
    if (activeNavItem == "configuration") {
      return (
        <Configuration
          {...props}
          setUserSetupConfigured={setUserSetupConfigured}
        />
      );
    } else if (activeNavItem == "newOrders") {
      return <NewOrders setActiveNavItem={setActiveNavItem} />;
    } else if (activeNavItem == "processedOrders") {
      return <ProcessedOrders setActiveNavItem={setActiveNavItem} />;
    }  
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
        navigate("/login" + localStorage.getItem("appSearchParams"));

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
      setDataIntoData("is_production", props.executeSandboxStatus.value).then(
        () => {
          logOutUser();
        }
      );
    }
  }, [props.executeSandboxStatus]);

  return (
    <div className="homepage">
      {isLoading && <Loader />}
  {false&&    <div className="homepage-left">
        <div className="logo-image">
          <span className="hide_on_hover">
            <img
              src="https://encrypted-tbn2.gstatic.com/faviconV2?url=https://fastcourier.com.au&client=VFE&size=64&type=FAVICON&fallback_opts=TYPE,SIZE,URL&nfrp=2"
              className="position-absolute"
              style={{
                width: "35px",
                transform: "translate(-50%, -50%)",
                top: "27px",
                left: "50%",
              }}
            />
          </span>
          <img
            src="https://portal-staging.fastcourier.com.au/assets/media/logos/fast-courier-dark.png"
            className="show_on_hover position-absolute"
            style={{
              width: "80%",
              transform: "translate(-50%, -50%)",
              top: "27px",
              left: "50%",
            }}
          />
        </div>
        <div className="side-nav-bar">
          <div
            className={
              activeNavItem == "configuration"
                ? "nav-bar-item-active"
                : "nav-bar-item"
            }
            onClick={() => setActiveNavItem("configuration")}
          >
            <span>
              {" "}
              <FontAwesomeIcon
                icon="fa-solid fa-gear"
                size="sm"
                style={{ width: "18px", marginRight: "4px" }}
              />{" "}
              <span className="show_on_hover"> Configuration</span>{" "}
            </span>{" "}
            <span> {activeNavItem == "configuration" && " >>"} </span>
          </div>
          {/* <div className={activeNavItem == "about" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("about")}>
            <span>About Plugin</span><span>{activeNavItem == "about" && ">>"}</span>
          </div> */}

          {window.localStorage.getItem("isUserSetupConfigured") === "true" && (
            <>
              <div
                className={
                  activeNavItem == "newOrders"
                    ? "nav-bar-item-active"
                    : "nav-bar-item"
                }
                onClick={() => setActiveNavItem("newOrders")}
              >
                <span>
                  <FontAwesomeIcon
                    icon="fa-solid fa-list"
                    size="sm"
                    style={{ width: "18px", marginRight: "4px" }}
                  />{" "}
                  <span className="show_on_hover">Orders</span>
                </span>
                <span>{activeNavItem == "newOrders" && " >>"}</span>
              </div>
              {/* <div
                className={
                  activeNavItem == "processedOrders"
                    ? "nav-bar-item-active"
                    : "nav-bar-item"
                }
                onClick={() => setActiveNavItem("processedOrders")}
              >
                <span>Processed Orders</span>
                <span>{activeNavItem == "processedOrders" && ">>"}</span>
              </div> */}
              {/* <div
                className={
                  activeNavItem == "holdOrders"
                    ? "nav-bar-item-active"
                    : "nav-bar-item"
                }
                onClick={() => setActiveNavItem("holdOrders")}
              >
                <span>Hold Orders</span>
                <span>{activeNavItem == "holdOrders" && ">>"}</span>
              </div> */}
              {/* <div
                className={
                  activeNavItem == "rejectedOrders"
                    ? "nav-bar-item-active"
                    : "nav-bar-item"
                }
                onClick={() => setActiveNavItem("rejectedOrders")}
              >
                <span>Rejected Orders</span>
                <span>{activeNavItem == "rejectedOrders" && ">>"}</span>
              </div> */}
              {/* <div
                className={
                  activeNavItem == "fallbackOrders"
                    ? "nav-bar-item-active"
                    : "nav-bar-item"
                }
                onClick={() => setActiveNavItem("fallbackOrders")}
              >
                <span>Fallback Orders</span>
                <span>{activeNavItem == "fallbackOrders" && ">>"}</span>
              </div> */}
            </>
          )}
          {/* <div
            className={
              activeNavItem == "changePassword"
                ? "nav-bar-item-active"
                : "nav-bar-item"
            }
            onClick={() => setActiveNavItem("changePassword")}
          >
            <span>Change Password</span>
            <span>{activeNavItem == "changePassword" && ">>"}</span>
          </div> */}
          <div className="nav-bar-item d-flex" onClick={() => logout()}>
            <span>
              <FontAwesomeIcon
                icon="fa-solid fa-right-from-bracket"
                size="sm"
                style={{ width: "18px", marginRight: "4px" }}
              />
            </span>

            <span className="show_on_hover">Logout</span>
          </div>
        </div>
      </div>}
      <div className="w-100 bg-white">
        <div className="d-flex align-items-center p-2">
        <div
            className={
              activeNavItem == "configuration"
                ? "nav-bar-item-active"
                : "nav-bar-item"
            }
            onClick={() => setActiveNavItem("configuration")}
          >
            <span>
              {" "}
              <FontAwesomeIcon
                icon="fa-solid fa-gear"
                size="sm"
                style={{ width: "18px", marginRight: "4px" }}
              />{" "}
              <span className="show_on_hover"> Configuration</span>{" "}
            </span>{" "}
            <span> {activeNavItem == "configuration" && " "} </span>
          </div>
          {window.localStorage.getItem("isUserSetupConfigured") === "true" && (
            <>
              <div
                className={
                  activeNavItem == "newOrders"
                    ? "nav-bar-item-active"
                    : "nav-bar-item"
                }
                onClick={() => setActiveNavItem("newOrders")}
              >
                <span>
                  <FontAwesomeIcon
                    icon="fa-solid fa-list"
                    size="sm"
                    style={{ width: "18px", marginRight: "4px" }}
                  />{" "}
                  <span className="show_on_hover">Orders</span>
                </span>
                <span>{activeNavItem == "newOrders" && ""}</span>
              </div>
              
            </>
          )}
 <div className="nav-bar-item d-flex" onClick={() => logout()}>
            <span>
              <FontAwesomeIcon
                icon="fa-solid fa-right-from-bracket"
                size="sm"
                style={{ width: "18px", marginRight: "4px" }}
              />
            </span>

            <span className="show_on_hover">Logout</span>
          </div>


        </div>

      <div className="homepage-right">{getComponent()}</div>
      </div>
    </div>
  );
}
