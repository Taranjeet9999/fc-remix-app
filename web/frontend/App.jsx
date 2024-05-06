import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavigationMenu } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
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

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  // const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");
  // const { t } = useTranslation();
  library.add(fas, fab);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [isStaging, setIsStaging] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    setIsLoggedIn(accessToken);
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
                  <input type="checkbox" />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="app-mode">
                {isLoggedIn &&
                  <div className="mode-left"></div>
                }
                <div className="mode-right" style={{ width: isLoggedIn ? "80%" : "100%", background: isLoggedIn ? "white" : "transparent" }}>
                  <div className="mode-text">
                    Test Mode
                  </div>
                </div>
              </div>
              {/* <BrowserRouter> */}
              <Routes>
                <Route index element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login setUserDetails={setUserDetails} />} />
                <Route path="/homepage" element={<HomePage userDetails={userDetails} isStaging={isStaging} />} />
                <Route path="/orderDetails" element={<OrderDetails />} />
                <Route path="/signup" element={<Signup setUserDetails={setUserDetails} />} />
                <Route path="/forgotPassword" element={<ForgotPassword />} />
                <Route path="/merchantBillingDetails" element={<MerchantBillingDetails />} />
              </Routes>
              {/* </BrowserRouter > */}
            </div>
          </QueryProvider>
        </AppBridgeProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
