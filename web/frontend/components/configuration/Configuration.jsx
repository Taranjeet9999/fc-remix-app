import { Link } from "react-router-dom";
import "./style.css";
import { useState } from "react";
import { MerchantBillingDetails } from "../merchantBillingDetails";
import { PaymentMethods } from "../paymentMethods";
import { PickupLocations } from "../pickupLocations";
import { ProductMapping } from "../productMapping";

export function Configuration(props) {
    const [activeNavItem, setActiveNavItem] = useState("basic");
    const [activateApiPayload, setActiveApiPayload] = useState(null);
    const [merchantDetails, setMerchantDetails] = useState(null);
    const getComponent = () => {
        if (activeNavItem == "paymentMethods") {
            return <PaymentMethods setActiveNavItem={setActiveNavItem}  activateApiPayload={activateApiPayload} merchantDetails={merchantDetails} {...props} />;
        } else if (activeNavItem == "pickupLocations") {
            return <PickupLocations setActiveNavItem={setActiveNavItem} {...props} />
        } else if (activeNavItem == "productMapping") {
            return <ProductMapping />;
        }
        return <MerchantBillingDetails setActiveNavItem={setActiveNavItem}  setActiveApiPayload={setActiveApiPayload} setMerchantDetails={setMerchantDetails} {...props} />
    }
    return (
        <div className="configuration">
            {/* <div className="progress-bar">
                <div className="progress" style={{width: `${progress}`}}>
                    50%
                </div>
            </div> */}
            <div className="top-nav-bar" style={{marginTop: "20px"}}>
                <div className={activeNavItem == "basic" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("basic")}>
                    <span>Basic</span>
                </div>
                <div className={activeNavItem == "paymentMethods" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("paymentMethods")}>
                    <span>Payment Methods</span>
                </div>
                <div className={activeNavItem == "pickupLocations" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("pickupLocations")}>
                    <span>Pickup Locations</span>
                </div>
                <div className={activeNavItem == "productMapping" ? "nav-bar-item-active" : "nav-bar-item"} onClick={() => setActiveNavItem("productMapping")}>
                    <span>Product Mapping</span>
                </div>
            </div>
            <div className="configuration-steps">
                {getComponent()}
            </div>
        </div>
    );
}