import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavigationMenu,   } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  AppBridgeProvider,
  QueryProvider,
  PolarisProvider,
} from "./components";
import HomePage from "./pages";
import { Login } from "./components/login";
import { Signup } from "./components/signup";
import { OrderDetails } from "./components/orderDetails/OrderDetails";
import { ForgotPassword } from "./components/forgotPassword";
import { MerchantBillingDetails } from "./components/merchantBillingDetails";
import "./App.css";
import ExitIframe from "./pages/ExitIframe";
// import { useAuthenticatedFetch } from "./hooks";
import { Loader } from "./components/loader";
import { Modal } from "./components/modal";
import React from "react"; 
import { ToastContainer  } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import OAuthCallBack from "./pages/OAuthCallBack";
export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  // const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");
  // const { t } = useTranslation();
  library.add(fas, fab);
   
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [isStaging, setIsStaging] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showSandBoxModal, setShowSandBoxModal] = useState(false)
  const [executeSandboxStatus, setExecuteSandboxStatus] = useState({
    execute:null,//"sandbox",
    value: "0"
  })
   
   

  useEffect(() => {
    // setIsLoading(true);
    const accessToken = localStorage.getItem("accessToken");
    setIsLoggedIn(accessToken);
    // getMerchantTokenAndDomainId()
  });


  

  return (
    <PolarisProvider>
      <BrowserRouter>
        <AppBridgeProvider>
          <QueryProvider>
            {/* <NavigationMenu
            navigationLinks={[
              {
                label: t("NavigationMenu.pageName"),
                destination: "/pagename",
              },
            ]}
          />
          <Routes pages={pages} /> */}
            <div className="app">
              <div className="top-bar">
                <div className="toggle-text">Sandbox</div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={isStaging}
                    onClick={() => {
                      setShowSandBoxModal(true);
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="app-mode">
                {/* {isLoggedIn && <div className="mode-left"></div>} */}
                <div
                  className="mode-right"
                  style={{
                    // width: isLoggedIn ? "80%" : "100%",
                    width: "100%",
                    background: isLoggedIn ? "white" : "transparent",
                  }}
                >
                  {isStaging && <div className="mode-text">Test Mode</div>}
                </div>
              </div>
              {/* <BrowserRouter> */}
              <Routes>
                <Route index element={<Navigate to={`/login${window.location.search}`} />} />
                {/* <Route index element={<Navigate to={`/login`} />} /> */}
                <Route path="/exitiframe" element={<ExitIframe />} />
                <Route
                  path="/login"
                  element={
                    <Login
                      setUserDetails={setUserDetails}
                      setIsStaging={setIsStaging}
                      executeSandboxStatus={executeSandboxStatus}
                    />
                  }
                />
                <Route
                  path="/homepage"
                  element={
                    <HomePage
                      userDetails={userDetails}
                      isStaging={isStaging}
                      executeSandboxStatus={executeSandboxStatus}
                    />
                  }
                />
                <Route
                  path="/oauth-callback"
                  element={
                    <OAuthCallBack
                     
                    />
                  }
                />
                <Route
                  path="/orderDetails"
                  element={
                    <OrderDetails executeSandboxStatus={executeSandboxStatus} />
                  }
                />
                {/* <Route
                  path="/signup"
                  element={
                    <Signup
                      setUserDetails={setUserDetails}
                      executeSandboxStatus={executeSandboxStatus}
                    />
                  }
                /> */}
                {/* <Route
                  path="/forgotPassword"
                  element={
                    <ForgotPassword
                      executeSandboxStatus={executeSandboxStatus}
                    />
                  }
                /> */}
                <Route
                  path="/merchantBillingDetails"
                  element={
                    <MerchantBillingDetails
                      executeSandboxStatus={executeSandboxStatus}
                    />
                  }
                />
              </Routes>
              {/* </BrowserRouter > */}
              {/* SandBox Modal */}
              <ToastContainer
position="top-right"
autoClose={6000}
hideProgressBar={false}
newestOnTop={false}
closeOnClick
rtl={false}
pauseOnFocusLoss
draggable
pauseOnHover
theme="light" 
// transition={"Bounce"}
/>

 
              
              <Modal showModal={showSandBoxModal} width="30%">
                {isLoading && <Loader />}
                <div className="assign-location">
                  <div className="modal-header">Change Sandbox Status</div>
                  <div className="modal-body">
                    <div className="input-container">
                      <div className="input-lebel">
                        <div> Are you sure?</div>
                      </div>
                      <div className="input-lebel">
                        <div>It will take a while to change status.</div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="cancel-btn"
                      onClick={() => setShowSandBoxModal(false)}
                    >
                      Close
                    </button>
                    <button
                      className="submit-btn"
                      onClick={() => {
                        setExecuteSandboxStatus({
                          execute: "sandbox",
                          value: isStaging ? "1" : "0",
                        });
                        setTimeout(() => {
                          setShowSandBoxModal(false);
                          setExecuteSandboxStatus({
                            execute: null,
                            value: isStaging ? "1" : "0",
                          });
                        }, 1000);
                      }}
                    >
                      Change
                    </button>
                  </div>
                </div>
              </Modal>
            </div>
          </QueryProvider>
        </AppBridgeProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
