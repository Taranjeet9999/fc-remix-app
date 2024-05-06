import { useState } from "react";
import { Link, redirect, useNavigate } from "react-router-dom";
// import { MerchantBillingDetails } from "../components/merchantBillingDetails";
import "./style.css";
import { Configuration } from "../components/configuration";
import { NewOrders } from "../components/newOrders";
import { ChangePassword } from "../components/changePassword";
import { ProcessedOrders } from "../components/processedOrders";
import { HoldOrders } from "../components/holdOrders";
import { RejectedOrders } from "../components/rejectedOrders/RejectedOrders";
import { FallbackOrders } from "../components/fallbackOrders";
// import { OrderDetails } from "../components/orderDetails/OrderDetails";

export default function HomePage(props) {
  const [activeNavItem, setActiveNavItem] = useState("configuration");
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("merchantDomainId");
    navigate("/login");
  }

  const getComponent = () => {
    if (activeNavItem == "configuration") {
      return <Configuration {...props} />;
    } else if (activeNavItem == "newOrders") {
      return <NewOrders setActiveNavItem={setActiveNavItem} />
    } else if (activeNavItem == "processedOrders") {
      return <ProcessedOrders setActiveNavItem={setActiveNavItem} />
    } else if (activeNavItem == "holdOrders") {
      return <HoldOrders setActiveNavItem={setActiveNavItem} />
    } else if (activeNavItem == "rejectedOrders") {
      return <RejectedOrders setActiveNavItem={setActiveNavItem} />
    } else if (activeNavItem == "fallbackOrders") {
      return <FallbackOrders setActiveNavItem={setActiveNavItem} />
    } else if (activeNavItem == "changePassword") {
      return <ChangePassword setActiveNavItem={setActiveNavItem} />
    }
  }
  return (
    <div className="homepage">
      <div className="homepage-left">
        <div className="logo-image">
          <img src="https://portal-staging.fastcourier.com.au/assets/media/logos/fast-courier-dark.png" />
        </div>
        <div className="side-nav-bar">
          <div className={activeNavItem == "configuration" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("configuration")}>
            <span>Configuration</span> <span>  {activeNavItem == "configuration" && ">>"} </span>
          </div>
          {/* <div className={activeNavItem == "about" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("about")}>
            <span>About Plugin</span><span>{activeNavItem == "about" && ">>"}</span>
          </div> */}
          <div className={activeNavItem == "newOrders" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("newOrders")}>
            <span>New Orders</span><span>{activeNavItem == "newOrders" && ">>"}</span>
          </div>
          <div className={activeNavItem == "processedOrders" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("processedOrders")}>
            <span>Processed Orders</span><span>{activeNavItem == "processedOrders" && ">>"}</span>
          </div>
          <div className={activeNavItem == "holdOrders" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("holdOrders")}>
            <span>Hold Orders</span><span>{activeNavItem == "holdOrders" && ">>"}</span>
          </div>
          <div className={activeNavItem == "rejectedOrders" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("rejectedOrders")}>
            <span>Rejected Orders</span><span>{activeNavItem == "rejectedOrders" && ">>"}</span>
          </div>
          <div className={activeNavItem == "fallbackOrders" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("fallbackOrders")}>
            <span>Fallback Orders</span><span>{activeNavItem == "fallbackOrders" && ">>"}</span>
          </div>
          <div className={activeNavItem == "changePassword" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("changePassword")}>
            <span>Change Password</span><span>{activeNavItem == "changePassword" && ">>"}</span>
          </div>
          <div className="nav-bar-item" onClick={() => logout()}>
            Logout
          </div>
        </div>
      </div>
      <div className="homepage-right">
        {getComponent()}
      </div>
    </div>
  );
}
