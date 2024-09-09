import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.css";
import { useState, useEffect } from "react";
import { Loader } from "../loader";
import { useAuthenticatedFetch } from "../../hooks";
;

export function OrderDetails(props) {
   
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const [locationListData, setLocationListData] = useState([]);
  const { order, redirectedtab } = location.state;
  const [products, setProducts] = useState([]);
  const fetch = useAuthenticatedFetch();
  const [pickupLocations, setPickupLocations] = useState([]);
  const [orderList, setOrderList] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getAllProducts(),
      getPickupLocations(),
      getOrderMetaFields(order.id),
    ]).then(([products, pickupLocations, orderMetaFields]) => {
      setIsLoading(false);
      getLocationDataObj();
      console.log(orderMetaFields, "orderMetaFields")
      let orders = orderMetaFields
        .find((item) => item.key === "order_hash_id")?.value
        ?.split(",")?.length;

      let _orderList = [];
      for (let i = 0; i < orders; i++) {
        let orderData = {};
        orderData.metafields = convertArrayToObject(orderMetaFields);
        orderData.courierName = getCourierName(
          order.shipping_lines?.[0]?.title,
          i
        );
        orderData.orderId = orderData.metafields.order_hash_id.split(",")[i];
        orderData.price = JSON.parse(orderData.metafields.courier_charges)[i];
        _orderList.push(orderData);
      }
      setOrderList(_orderList);
    });
  }, []);
  console.log("order", order);
  console.log("orderList", orderList);
  const getAllProducts = () => {
    return new Promise((resolve, reject) => {
      fetch(`/api/products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch products");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            const formattedProducts = formatProductData(
              data.body.data.products
            );

            setProducts(formattedProducts);

            resolve(formattedProducts);
          } else {
            reject("No data found");
          }
        })
        .catch((error) => {
          console.error("Error fetching products:", error);
          reject(error);
        });
    });
  };
  function getOrderMetaFields(_orderId) {
    return new Promise((resolve, reject) => {
      fetch(`/api/get-order-metafields`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: _orderId,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch products");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            let updated_data = data.data.map((item) => {
              return {
                key: item.key,
                value: item.value,
              };
            });

            resolve(updated_data);
          } else {
            reject("No data found");
          }
        })
        .catch((error) => {
          console.error("Error fetching products:", error);
          reject(error);
        });
    });
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

  function getProductIdFromGID(gid) {
    const parts = gid.split("/"); // Split the URL by '/'
    const productId = parts[parts.length - 1];
    return productId;
  }

  function convertArrayToObject(array) {
    const result = {};
    array.forEach((item) => {
      result[item.key] = item.value;
    });
    return result;
  }
  async function getProductDimensionsById(productId) {
    try {
      const product = products.find(
        (product) => Number(product.id) === Number(productId)
      );
      let locationList = [];

      const metafieldsObj = [
        {
          key: "title_tag",
          value: "Complete Snowboard",
        },
        {
          key: "description_tag",
          value: "snowboard winter sport snowboarding",
        },
        {
          key: "snowboard_length",
          value: '{"value":159.0,"unit":"CENTIMETERS"}',
        },
        {
          key: "snowboard_weight",
          value: '{"value":7.0,"unit":"POUNDS"}',
        },
        {
          key: "location",
          value: "Adios",
        },
        {
          key: "package_type",
          value: "box",
        },
        {
          key: "height",
          value: "10",
        },
        {
          key: "width",
          value: "10",
        },
        {
          key: "length",
          value: "10",
        },
        {
          key: "weight",
          value: "1",
        },
      ];

      if (product) {
        let locationObj = {};
        let location_key_pair_object = convertArrayToObject(product.metafields);
        if (typeof location_key_pair_object["location"] === "string") {
          locationObj = JSON.parse(location_key_pair_object["location"]);
          if (locationObj?.type === "name") {
            locationList.push(locationObj?.value);
          } else if (locationObj?.type === "tag") {
            let location_value = await getMerchantLocationDataFromTagId(
              locationObj?.value?.id
            );
            if (location_value) {
              locationList.push(location_value);
            }
          }
        }
      } else {
      }

      return locationList;
    } catch (error) {
      console.log("finding location error", error);
    }
  }

  async function getMerchantLocationDataFromTagId(tagId) {
    const accessToken = localStorage.getItem("accessToken");
    const merchantDomainId = localStorage.getItem("merchantDomainId");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": "shopify_development",
      version: "3.1.1",
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      "store-domain": localStorage.getItem("userData") ?  JSON.parse(localStorage.getItem("userData")).id   :"",
    }

    const response = await axios.get(
      `${
        localStorage.getItem("isProduction") === "1"
          ? process.env.PROD_API_ENDPOINT
          : process.env.API_ENDPOINT
      }/api/wp/merchant_locations/${merchantDomainId}/${tagId}`,
      { headers: headers }
    );

    // Assuming response.data.data is an array and you want the first element
    return response.data.data[0];

    // let merchant_location_details = await merchant_location.json();
    // return merchant_location_details;
  }

  const getPickupLocations = () => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      const merchantDomainId = localStorage.getItem("merchantDomainId");
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
          }/api/wp/merchant_domain/locations/${merchantDomainId}`,
          { headers: headers }
        )
        .then((response) => {
          setIsLoading(false);
          setPickupLocations(response.data.data);
          resolve(response.data.data);
        })
        .catch((error) => {
          setIsLoading(false);
          reject(error);
        });
    });
  };
  function getLocationDataObj() {
    if (products?.length > 0 && pickupLocations?.length > 0) {
      const merchant_default_location = pickupLocations.find(
        (element) => element.is_default == 1
      );
      const product = products.find(
        (product) =>
          Number(product.id) === Number(order?.line_items[0]?.product_id)
      );
      let locationList = [];
      let locationData;
      let destination = order.billing_address;
      if (product) {
        let locationObj = {};
        let location_key_pair_object = convertArrayToObject(product.metafields);
        if (typeof location_key_pair_object["location"] === "string") {
          locationObj = JSON.parse(location_key_pair_object["location"]);
          if (locationObj?.type === "name") {
            locationData = pickupLocations.find(
              (element) => element.id == locationObj.value.id
            );
            if (!locationData) {
              locationData = { ...merchant_default_location };
            }
            locationList.push(locationData);
          } else if (locationObj?.type === "tag") {
            const filteredLocations = pickupLocations?.filter((location) => {
              if (location.tag && location.tag !== "[]") {
                const tags = location.tag.split(",").map(Number);
                return tags.includes(Number(locationObj.value.id));
              }
              return false;
            });
            if (filteredLocations.length === 0) {
              locationData = { ...merchant_default_location };
              // logger.info(locationData,"Default locationData")
            } else {
              locationData = filteredLocations[0];
              // logger.info(destination,"destination")
              if (destination.latitude && destination.longitude) {
                let minDistance = haversineDistance(
                  parseFloat(destination.latitude),
                  parseFloat(destination.longitude),
                  parseFloat(locationData.latitude),
                  parseFloat(locationData.longitude)
                );
                // logger.info(minDistance,"minDistance")

                for (let i = 1; i < filteredLocations.length; i++) {
                  const location = filteredLocations[i];
                  const distance = haversineDistance(
                    parseFloat(destination.latitude),
                    parseFloat(destination.longitude),
                    parseFloat(location.latitude),
                    parseFloat(location.longitude)
                  );
                  // logger.info(distance,minDistance,"distance , minDistance")
                  if (distance < minDistance) {
                    minDistance = distance;
                    locationData = { ...location };
                  }
                  // logger.info(locationData,"locationData")
                }
              } else {
                locationData = { ...merchant_default_location };
                // logger.info(locationData,"Merchant default locationData")
              }
            }
            locationList.push(locationData);
          }
        }
      }
      console.log("locationList", locationList);
      setLocationListData(locationList);
    }
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function getCourierName(text, index) {
    // Extracting the part within the square brackets
    const matches = text.match(/\[(.*?)\]/);

    // If there are no matches, return an empty string or handle as needed
    if (!matches) return "";

    // Split the matched string to get individual courier names
    const couriers = matches[1].split(",");

    // If the index is out of range, return an empty string or handle as needed
    if (index < 0 || index >= couriers.length) return "";

    // Get the courier name at the given index
    const selectedCourier = couriers[index];

    // Check if the text includes "Shipping" and the courier name
    const isShipping = text?.toLowerCase()?.includes(`shipping`);

    // Return "Shipping" if the condition is met, otherwise return the courier name
    return isShipping ? "Shipping" : `Fast Courier[${selectedCourier}]`;
  }

  // getLocationDataObj()
  useEffect(() => {
    getLocationDataObj();
  }, [products, pickupLocations]);

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

  return (
    <div className="order-details-main">
      {isLoading && <Loader />}
      <div className="order-details-container">
        <div className="order-details-head">
          <div className="order-detail-heading">Order Details</div>
          <div
            className="back-btn"
            onClick={() => navigate("/homepage", { state: { redirectedtab:"newOrders" } })}
          >
            Back
          </div>
        </div>
        <div className="order-details">
          <div className="order-info">
            <div className="order-details-item">
              <div className="order-details-name">Order:</div>
              <div className="order-details-value">{order?.name}</div>
            </div>
            <div className="order-details-item">
              <div className="order-details-name">Store:</div>
              <div className="order-details-value">
                {order.line_items[0].vendor}
              </div>
            </div>
            <div className="order-details-item">
              <div className="order-details-name">Payment Method:</div>
              <div className="order-details-value">{/* COD */}</div>
            </div>
            <div className="order-details-item">
              <div className="order-details-name">Total:</div>
              <div className="order-details-value">${order?.total_price}</div>
            </div>
            <div className="order-details-item">
              <div className="order-details-name">Insurance Required:</div>
              <div className="order-details-value">Not Required</div>
            </div>
            <div className="order-details-item">
              <div className="order-details-name">Authority to Leave:</div>
              <div className="order-details-value">False</div>
            </div>
          </div>

          <div className="delivery-address">
            <div className="delivery-heading">Delivery Address</div>
            <div className="order-details-value">
              <br />
              {order.billing_address.name && (
                <>
                  {order.billing_address.name},
                  <br />
                </>
              )}
              {order.billing_address.address1 && (
                <>
                  {order.billing_address.address1},
                  <br />
                </>
              )}
              {order.billing_address.address2 && (
                <>
                  {order.billing_address.address2},
                  <br />
                </>
              )}
              {order.billing_address.city && (
                <>
                  {order.billing_address.city},
                  <br />
                </>
              )}
              {order.billing_address.province && (
                <>
                  {order.billing_address.province},
                  <br />
                </>
              )}
              {order.billing_address.country && (
                <>
                  {order.billing_address.country},
                  <br />
                </>
              )}
              {order.billing_address.zip && <>{order.billing_address.zip}</>}
            </div>
          </div>

          <div className="delivery-address">
            <div className="delivery-heading">Shipping Address</div>
            <div className="order-details-value">
              <br />
              {order.shipping_address?.name && (
                <>
                  {order.shipping_address?.name},
                  <br />
                </>
              )}
              {order.shipping_address?.address1 && (
                <>
                  {order.shipping_address?.address1},
                  <br />
                </>
              )}
              {order.shipping_address?.address2 && (
                <>
                  {order.shipping_address?.address2},
                  <br />
                </>
              )}
              {order.shipping_address?.city && (
                <>
                  {order.shipping_address?.city},
                  <br />
                </>
              )}
              {order.shipping_address?.province && (
                <>
                  {order.shipping_address?.province},
                  <br />
                </>
              )}
              {order.shipping_address?.country && (
                <>
                  {order.shipping_address?.country},
                  <br />
                </>
              )}
              {order.shipping_address?.zip && (
                <>{order.shipping_address?.zip}</>
              )}
            </div>
          </div>
        </div>

        <div className="shipment-details">
          <div className="shipment-heading">
            <span style={{ color: "#f76b00" }}>Shipment</span>&nbsp;
            <span>{order?.financial_status} </span>
          </div>
          <div className="shipment-table">
            <table>
              <tr className="table-head">
                <th>Item</th>
                {/* <th>SKU</th> */}
                <th>Cost</th>
                <th>Quantity</th>
                <th>Tax</th>
                <th>{"Weight (kg)"}</th>
                {/* <th>Dimentions</th> */}
                <th>Shipping Required</th>
                <th>Total</th>
              </tr>
              {order?.line_items?.map((item) => {
                return (
                  <tr className="products-row">
                    <td>{item.name}</td>
                    {/* <td>{item.sku}</td> */}
                    <td>${item.price}</td>
                    <td>{item.quantity}</td>
                    <td>{item.taxable ? "Yes" : "No"}</td>
                    {/* <td>{item.grams / 1000}</td> */}
                    <td>
                      {getProductDimensionsById(item.product_id)["weight"]}
                    </td>
                    {/* <td>
                      {getProductDimensionsById(item.product_id)["length"]
                        ? `${
                            getProductDimensionsById(item.product_id)["length"]
                          }x
                    ${getProductDimensionsById(item.product_id)["width"]}x
                    ${getProductDimensionsById(item.product_id)["height"]}`
                        : ""}
                    </td> */}

                    <td>{item.requires_shipping ? "Yes" : "No"}</td>
                    <td>${item.price * item.quantity}</td>
                  </tr>
                );
              })}
            </table>
          </div>
        </div>

        <div className="shipment-details">
          <div className="shipment-heading">
            <span style={{ color: "#f76b00" }}>Recommended Package</span>
          </div>
          <div className="shipment-table">
            <table>
              <tr className="table-head">
                <th>Package Type</th>
                <th>{"Weight (kg)"}</th>
                <th>Dimensions (CMs)</th>
                <th>Sub Packs</th>
              </tr>
              <tr className="products-row">
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </table>
          </div>
        </div>

        <div className="shipment-details">
          <div className="shipment-heading">
            <span style={{ color: "#f76b00" }}>Shipping</span>
          </div>
          <div className="shipment-table">
            <table>
              <tr className="table-head">
                <th>Reference Number</th>
                <th>Courier</th>
                <th>Price</th>
                <th>Estimated Delivery</th>
                <th>Location</th>
                <th>Address</th>
                <th>Suburb, Postcode, State</th>
              </tr>
              {
                orderList.map((orderItem) => {
                  return(
              <tr className="products-row">
                <td>
                  {
                    orderItem.orderId
                  }
                  
                   </td>
                <td>
                  {orderItem.courierName}
                </td>
                <td>
                  {" "}
                  ${orderItem.price}
                </td>
                <td>
                  {order?.line_items[0]?.requires_shipping
                    ? "5-8 Business Days"
                    : "NA"}
                </td>
                <td>
                  {/* {console.log("locationListData", locationListData)} */}
                  {locationListData
                    ?.map((location) => {
                      return location.location_name;
                    })
                    .join(", ")}
                </td>
                <td>
                  {locationListData
                    ?.map((location) => {
                      console.log(location, "location");
                      const address1 = location?.address1 || "";
                      const address2 = location?.address2 || "";
                      return `${address1} ${address2}`.trim();
                    })
                    .join(", ")}
                </td>
                <td>
                  {" "}
                  {locationListData
                    ?.map((location) => {
                      return (
                        location.suburb +
                        " " +
                        location.postcode +
                        " " +
                        location.state
                      );
                    })
                    .join(", ")}{" "}
                </td>
              </tr>

                  )
                })
              }
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
