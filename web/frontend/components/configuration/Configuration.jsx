import { Link } from "react-router-dom";
import "./style.css";
import { useEffect, useState } from "react";
import { MerchantBillingDetails } from "../merchantBillingDetails";
import { PaymentMethods } from "../paymentMethods";
import { PickupLocations } from "../pickupLocations";
import { ProductMapping } from "../productMapping";
import axios from "axios";
import { useAuthenticatedFetch } from "../../hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
export function Configuration(props) {
  const [activeNavItem, setActiveNavItem] = useState("basic");
  const [activateApiPayload, setActiveApiPayload] = useState(null);
  const [merchantDetails, setMerchantDetails] = useState({});
  const [pickupLocations, setPickupLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [shippingBoxes, setShippingBoxes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const getComponent = () => {
    if (activeNavItem == "paymentMethods") {
      return (
        <PaymentMethods
          setActiveNavItem={setActiveNavItem}
          activateApiPayload={activateApiPayload}
          merchantDetails={merchantDetails}
          setMerchantDetails={setMerchantDetails}
          {...props}
        />
      );
    } else if (activeNavItem == "pickupLocations") {
      return (
        <PickupLocations
          setActiveNavItem={setActiveNavItem}
          setPickupLocations={setPickupLocations}
          {...props}
        />
      );
    } else if (activeNavItem == "productMapping") {
      return (
        <ProductMapping
          setProducts={setProducts}
          setShippingBoxes={setShippingBoxes}
        />
      );
    }
    return (
      <MerchantBillingDetails
        setActiveNavItem={setActiveNavItem}
        setActiveApiPayload={setActiveApiPayload}
        setMerchantDetails={setMerchantDetails}
        {...props}
      />
    );
  };
  const getPickupLocations = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const merchantDomainId = localStorage.getItem("merchantDomainId");
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
      .get(
        `${
          localStorage.getItem("isProduction") === "1"
            ? process.env.PROD_API_ENDPOINT
            : process.env.API_ENDPOINT
        }/api/wp/merchant_domain/locations/${merchantDomainId}`,
        { headers: headers }
      )
      .then((response) => {
        setPickupLocations(response.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  const  getPaymentMethods = async () => {
     
    
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": "shopify_development",
      version: "3.1.1",
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      "store-domain": localStorage.getItem("userData") ?  JSON.parse(localStorage.getItem("userData")).id   :"",
    }
    axios
      .get(
        `${
          localStorage.getItem("isProduction") === "1"
            ? process.env.PROD_API_ENDPOINT
            : process.env.API_ENDPOINT
        }/api/wp/payment_method`,
        { headers: headers }
      )
      .then((response) => {
        setPaymentMethods(response.data.data);
        
      })
      .catch((error) => {
        
        console.log(error);
      });
  }

  const fetch = useAuthenticatedFetch();
  function getProductIdFromGID(gid) {
    const parts = gid.split("/"); // Split the URL by '/'
    const productId = parts[parts.length - 1];
    return productId;
  }
  function formatProductData(products) {
    let formattedResponse = [];

    products.edges.forEach((edge) => {
      let formattedProduct = {
        id: getProductIdFromGID(edge.node.id),
        title: edge.node.title,
        metafields: edge.node.metafields.edges.map((_edge) => _edge.node),
        variants: edge.node.variants.edges.map((variantEdge) => {
          return {
            id: getProductIdFromGID(variantEdge.node.id),
            title: variantEdge.node.title,
            price: variantEdge.node.price,
            metafields: variantEdge.node.metafields.edges.map(
              (_edge) => _edge.node
            ),
          };
        }),
      };
      formattedResponse.push(formattedProduct);
    });

    return formattedResponse;
  }
  const getAllProducts = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/products`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data) {
      const formattedProducts = formatProductData(data.body.data.products);
      console.log("formattedproducts", formattedProducts);

      setProducts(formattedProducts);
      
    }
  };

  function isMerchantDetailsFilled() {
    if (
      merchantDetails &&
      merchantDetails.billing_first_name &&
      merchantDetails.billing_email &&
      merchantDetails.billing_phone &&
      merchantDetails.billing_address_1 &&
      merchantDetails.billing_suburb 
      
      // &&
      // JSON.parse(merchantDetails.courier_preferences)?.length > 0
      
    ) {
      localStorage.setItem("isMerchantDetailsFilled", true);
      return true;
    }
    localStorage.setItem("isMerchantDetailsFilled", false);
    return false;
  }

  function isPaymentMethodsFilled() {
    if (paymentMethods.length > 0) {
      localStorage.setItem("isPaymentMethodsFilled", true);
      return true;
    }
    localStorage.setItem("isPaymentMethodsFilled", false);
    return false;
  }

  function isPickupLocationsFilled() {
    if (pickupLocations.length > 0) {
      localStorage.setItem("isPickupLocationsFilled", true);
      return true;
    }
    localStorage.setItem("isPickupLocationsFilled", false);
    return false;
  }

  function isProductMappingFilled() {
    for (let product of products) {
      // Check metafields of the product
      for (let metafield of product.metafields) {
        // Check if the metafield key is 'product_dimentions'
        if (
          metafield.key === "product_dimentions" &&
          metafield.value 
          
          // &&
          // shippingBoxes.length > 0
        ) {
          window.localStorage.setItem("isProductMappingFilled", true);
          return true;
        }
      }
    }
    window.localStorage.setItem("isProductMappingFilled", false);

    return false;
  }
  const getShippingBoxes = async () => {
    const response = await fetch(`/api/shipping-boxes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    setShippingBoxes(data);
  };

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      
    }, 10000);
    Promise.all([
      // getShippingBoxes(),
      getPickupLocations(),
      getAllProducts(),
      getPaymentMethods()
    ]).then(()=>{
      setIsLoading(false)
     
    })
  }, []);

  function getProgress() {
    let progress = 0;
    if (isMerchantDetailsFilled()) {
      progress += 25;
    }
    if (isPaymentMethodsFilled()) {
      progress += 25;
    }
    if (isPickupLocationsFilled()) {
      progress += 25;
    }
    if (isProductMappingFilled()) {
      progress += 25;
    }
    return progress;
  }

  useEffect(() => {
    if (
      isMerchantDetailsFilled() &&
      isPaymentMethodsFilled() &&
      isPickupLocationsFilled() &&
      isProductMappingFilled()
    ) {
      props.setUserSetupConfigured(true);
      window.localStorage.setItem("isUserSetupConfigured", true);
    } else {
      props.setUserSetupConfigured(false);
      window.localStorage.setItem("isUserSetupConfigured", false);
    }
  }, [
    isMerchantDetailsFilled(),
    isPaymentMethodsFilled(),
    isPickupLocationsFilled(),
    isProductMappingFilled(),
    // shippingBoxes,
    products,
    pickupLocations,
    merchantDetails,
  ]);

  return (
    <div className="configuration">
      <div className="banner-progress-bar">
        <div className="custom-progress" style={{ width: `${getProgress()}%` }}>
          {isLoading  ?   "Fetching data.."   :    `${getProgress()}%`}
        </div>
      </div>
      <div className="top-nav-bar" style={{ marginTop: "20px" }}>
        <div
          className={
            activeNavItem == "basic" ? "nav-bar-item-active" : "nav-bar-item"
          }
          onClick={() => setActiveNavItem("basic")}
        >
          <span></span>
          <span>Basic</span>
          <span className="nav-icon">
            {isMerchantDetailsFilled() ? (
              <FontAwesomeIcon
                icon="fa-solid fa-check-circle"
                size="2xs"
                color="green"
                // onClick={() => handleEditClick(pickupLocations[i])}
              />
            ) : (
              <FontAwesomeIcon
                icon="fa-solid fa-exclamation-circle"
                size="2xs"
                color="red"
                // onClick={() => handleEditClick(pickupLocations[i])}
              />
            )}
          </span>
        </div>
        <div
          className={
            activeNavItem == "paymentMethods"
              ? "nav-bar-item-active"
              : "nav-bar-item"
          }
          onClick={() => setActiveNavItem("paymentMethods")}
        >
          <span></span>

          <span>Payment Methods</span>
          <span className="nav-icon">
            {isPaymentMethodsFilled() ? (
              <FontAwesomeIcon
                icon="fa-solid fa-check-circle"
                color="green"
                size="2xs"
                // onClick={() => handleEditClick(pickupLocations[i])}
              />
            ) : (
              <FontAwesomeIcon
                icon="fa-solid fa-exclamation-circle"
                color="red"
                size="2xs"
                // onClick={() => handleEditClick(pickupLocations[i])}
              />
            )}
          </span>
        </div>
        <div
          className={
            activeNavItem == "pickupLocations"
              ? "nav-bar-item-active"
              : "nav-bar-item"
          }
          onClick={() => setActiveNavItem("pickupLocations")}
        >
          <span></span>
          <span>Pickup Locations</span>
          <span className="nav-icon">
            {isPickupLocationsFilled() ? (
              <FontAwesomeIcon
                icon="fa-solid fa-check-circle"
                color="green"
                size="2xs"
                // onClick={() => handleEditClick(pickupLocations[i])}
              />
            ) : (
              <FontAwesomeIcon
                icon="fa-solid fa-exclamation-circle"
                color="red"
                size="2xs"
                // onClick={() => handleEditClick(pickupLocations[i])}
              />
            )}
          </span>
        </div>
        <div
          className={
            activeNavItem == "productMapping"
              ? "nav-bar-item-active"
              : "nav-bar-item"
          }
          onClick={() => setActiveNavItem("productMapping")}
        >
          <span></span>

          <span>Product Mapping</span>
          <span className="nav-icon">
            {isProductMappingFilled() ? (
              <FontAwesomeIcon
                icon="fa-solid fa-check-circle"
                color="green"
                size="2xs"
                // onClick={() => handleEditClick(pickupLocations[i])}
              />
            ) : (
              <FontAwesomeIcon
                icon="fa-solid fa-exclamation-circle"
                size="2xs"
                color="red"
                // onClick={() => handleEditClick(pickupLocations[i])}
              />
            )}
          </span>
        </div>
      </div>
      <div className="configuration-steps">{getComponent()}</div>
    </div>
  );
}
