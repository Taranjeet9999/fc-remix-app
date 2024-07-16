import "./style.css";
import { Modal } from "../modal";
import axios from "axios";
import { useEffect, useState } from "react";
import { AddLocation } from "../addLocation";
import { useAppQuery, useAuthenticatedFetch } from "../../hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Loader } from "../loader";
import { ErrorModal } from "../errorModal";
import { ConfirmModal } from "../confirmModal";
import { Link, useNavigate } from "react-router-dom";
import { getOrderDataMetaField } from "../newOrders/NewOrders";
;

export function RejectedOrders(props) {
  const fetch = useAuthenticatedFetch();
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showError, setShowError] = useState(false);
  const [showBookOrderModal, setShowBookOrderModal] = useState(false);
  const [showHoldOrderModal, setShowHoldOrderModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orders, setOrders] = useState(null);
  const [defaultLocation, setDefaultLocation] = useState(null);
  const [pickupLocations, setPickupLocations] = useState(null);
  const [disabledDates, setDisabledDates] = useState([]);
  const [allNewOrders, setallNewOrders] = useState([]);
  const [filterData, setFilterData] = useState({
    startDate: "",
    endDate: "",
    orderId: "",
    shippingType: "",
  });
  const navigate = useNavigate();

  const getFormattedDate = (originalDateString) => {
    const originalDate = new Date(originalDateString);
    const year = originalDate.getFullYear();
    const month = String(originalDate.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const day = String(originalDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  };

  // const disabledDates = [
  //   '2024-01-01',
  //   '2024-01-26',
  //   '2024-03-29',
  //   '2024-03-30',
  //   '2024-03-31',
  //   '2024-04-01',
  //   '2024-04-25',
  //   '2024-06-10',
  //   '2024-10-07',
  //   '2024-12-25',
  //   '2024-12-26',
  // ];

  useEffect(() => {
    getPickupLocations();
    getHolidays();
  }, []);

  const getPickupLocations = () => {
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
        // setIsLoading(false);
        setPickupLocations(response.data.data);
        const defaultPickupLocation = response.data.data?.find(
          (element) => element.is_default == 1
        );
        console.log("defaultPickupLocation", defaultPickupLocation);
        setDefaultLocation(defaultPickupLocation);
      })
      .catch((error) => {
        setIsLoading(false);
        console.log(error);
      });
  };

  const getHolidays = () => {
    const accessToken = localStorage.getItem("accessToken");
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
        }/api/wp/public-holidays`,
        {
          headers: headers,
        }
      )
      .then((response) => {
        console.log("holidays", response);
        setDisabledDates(response.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getAllOrders = () => {
    return new Promise((resolve, reject) => {
      fetch(`/api/orders`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Failed to fetch orders, status: ${response.status}`
            );
          }
          return response.json();
        })
        .then((data) => {
          resolve(data.data);
        })
        .catch((error) => {
          console.error("Error fetching orders:", error);
          setIsLoading(false);
          reject(error);
        });
    });
  };

  const getOrderMeta = () => {
    return new Promise((resolve, reject) => {
      fetch(`/api/order-metafields`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Failed to fetch order metafields, status: ${response.status}`
            );
          }
          return response.json();
        })
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          console.error("Error fetching order metafields:", error);
          setIsLoading(false);
          reject(error);
        });
    });
  };

  useEffect(() => {
    getAllOrdersData();
  }, []);

  function getAllOrdersData() {
    setIsLoading(true);
    Promise.all([getAllOrders(), getOrderMeta()])
      .then(([ordersData, orderMetaData, locationData]) => {
        const getOrders = ordersData?.map((item1) => {
          const matchingItem2 = orderMetaData?.body?.data?.orders?.edges.find(
            (item2) => item2.node.id.includes(item1.id)
          );
          return { ...item1, ...matchingItem2 };
        });

        setOrders(getOrders);
        setallNewOrders(getOrders);
        setIsLoading(false);
        setFilterData({
          startDate: "",
          endDate: "",
          orderId: "",
          shippingType: "",
        });
      })
      .catch((error) => {
        console.error("error:", error);
      });
  }

  const getMetaValue = (metafields, keyValue) => {
    var location = metafields?.find((element) => element.node.key == keyValue);

    return location != undefined ? location.node.value : null;
  };

  // useEffect(async () => {
  //   var filteredData = [];
  //   filteredData = await orders?.filter((item) => {
  //     let orderMatch = true
  //     if (startDate != "") {
  //       orderMatch = getFormattedDate(item.created_at) >= startDate;
  //     }
  //     if (endDate != "") {
  //       orderMatch = getFormattedDate(item.created_at) <= endDate;
  //     }
  //     return orderMatch;
  //   });
  //   if (filteredData != undefined) {
  //     setFilteredOrders(filteredData);
  //   }
  // }, [startDate, endDate]);

  const selectOrder = (e) => {
    const orderIds = selectedOrders.includes(e.target.value)
      ? selectedOrders.filter((item) => item !== e.target.value)
      : [...selectedOrders, e.target.value];
    setSelectedOrders(orderIds);
  };

  const handleSelectAll = (e) => {
    var selectedIds = e.target.checked
      ? orders.map((element) => element.id.toString())
      : [];
    setSelectedOrders(selectedIds);
  };

  const holdSelectedOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/hold-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderIds: selectedOrders,
        }),
      });
      console.log(response);
      setIsLoading(false);
      getAllOrdersData();
      setShowHoldOrderModal(false);
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  const create2DArray = (_orders) => {
    return _orders.map((element) => {
      const orderDataEdge = element.node.metafields.edges.find(
        (edge) => edge.node.key === "order_data"
      );
      if (orderDataEdge) {
        const orderData = JSON.parse(orderDataEdge.node.value);
        let _orderArray = new Array(orderData.length).fill(null);

        for (let index = 0; index < _orderArray.length; index++) {
          const order = orderData[index];
          _orderArray[index] = {
            quoteId: order.quote_id,
            orderHashId: order.order_id,
            collectionDate: collectionDate,
            destinationEmail: element?.contact_email,
            destinationPhone: element?.customer?.phone,
            wpOrderId: element?.order_number,
            destinationFirstName: element?.shipping_address.first_name,
            destinationLastName: element?.shipping_address.last_name,
            destinationCompanyName: element?.shipping_address.company,
            destinationAddress1: element?.shipping_address.address1,
            destinationAddress2: element?.shipping_address.address2,
            pickupFirstName: defaultLocation?.first_name,
            pickupLastName: defaultLocation?.last_name,
            pickupCompanyName: null,
            pickupAddress1: defaultLocation?.address1,
            pickupAddress2: defaultLocation?.address2,
            pickupPhone: defaultLocation?.phone,
            pickupEmail: defaultLocation?.email,
            atl: false, 
            // ...order,
          };
        }

        return _orderArray;
      }
      return [];
    });
  };

  const convertTo2DArray = (flatArray, TwoDArray) => {
    let index = 0;
    return TwoDArray.map(innerArray => {
      return innerArray.map(() => flatArray[index++]);
    });
  }
  
  const bookSelectedOrders = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
       
      const selectedOrderDetails = orders?.filter((element) =>
        selectedOrders.includes(`${element.id}`)
      );

      const orderStructure = create2DArray(selectedOrderDetails); 
       
      // var bookOrders = [];
      // for (const element of selectedOrderDetails) {
      //   const order = {
      //     quoteId: getMetaValue(element.node?.metafields?.edges, "quote_id"),
      //     orderHashId: getMetaValue(
      //       element.node?.metafields?.edges,
      //       "order_hash_id"
      //     ),
      //     collectionDate: collectionDate,
      //     destinationEmail: element?.contact_email,
      //     destinationPhone: element?.customer?.phone,
      //     wpOrderId: element?.order_number,
      //     destinationFirstName: element?.shipping_address.first_name,
      //     destinationLastName: element?.shipping_address.last_name,
      //     destinationCompanyName: element?.shipping_address.company,
      //     destinationAddress1: element?.shipping_address.address1,
      //     destinationAddress2: element?.shipping_address.address2,
      //     pickupFirstName: defaultLocation?.first_name,
      //     pickupLastName: defaultLocation?.last_name,
      //     pickupCompanyName: null,
      //     pickupAddress1: defaultLocation?.address1,
      //     pickupAddress2: defaultLocation?.address2,
      //     pickupPhone: defaultLocation?.phone,
      //     pickupEmail: defaultLocation?.email,
      //     atl: false,
      //   };

      //   bookOrders.push(order);
      // }
      const payload = {
        orders: orderStructure.flat(1),
        isReprocessOrders: true,
        request_type: "wp",
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
        .post(
          `${
            localStorage.getItem("isProduction") === "1"
              ? process.env.PROD_API_ENDPOINT
              : process.env.API_ENDPOINT
          }/api/wp/bulk_order_booking`,
          payload,
          { headers: headers }
        )
        .then((response) => {
          // let output = response.data.response;
          let _output = convertTo2DArray(
            response.data.response,
            orderStructure
          ) 
       
          fetch("/api/book-orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              collectionDate: collectionDate,
              orders: selectedOrderDetails,
              orderStatuses: _output,
            }),
          });
          setIsLoading(false);
          getAllOrdersData();
          setShowBookOrderModal(false);
        })
        .catch((error) => {
          setIsLoading(false);
          console.log(error);
        });
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };
  const handleDateChange = (e) => {
    const selected = e.target.value;
    // Check if the selected date is in the disabledDates array
    const selectedDay = new Date(selected).getDay();
    // Get the current date
    const currentDate = new Date();
    // Disable Saturdays (day 6) and Sundays (day 0)
    if (selectedDay === 0 || selectedDay === 6) {
      setErrorMsg("Weekends not allowed");
      setShowError(true);
      setCollectionDate("");
    }
    // Disable dates before the current date
    else if (new Date(selected) < currentDate) {
      setErrorMsg(
        "Dates before today are disabled. Please choose another date."
      );
      setShowError(true);
      setCollectionDate("");
    } else if (disabledDates.includes(selected)) {
      setErrorMsg("This date is disabled. Please choose another date.");
      setShowError(true);
      setCollectionDate(""); // Clear the selected date if it's disabled
    } else {
      setCollectionDate(selected);
    }
  };

  function getFreeShippingPrice(orderItem) {
    if (
      getMetaValue(orderItem.node?.metafields?.edges, "fc_order_status") ===
      "Freeshipping"
    ) {
      return `$${getMetaValue(
        orderItem.node?.metafields?.edges,
        "courier_charges"
      )}`;
    }
  }

  return (
    <div className="new-orders">
      {isLoading && <Loader />}
      <ErrorModal
        showModal={showError}
        onConfirm={setShowError}
        message={errorMsg}
      />
      <Modal showModal={showBookOrderModal} width="30%">
        <div className="booking-modal">
          <div className="modal-header">
            <div className="shipping-heading">Process</div>
          </div>
          <div className="modal-body">
            <div className="input-container">
              <div className="input-lebel">
                <span> Collection Date&nbsp;</span>
              </div>
              <div className="input-field1">
                <input
                  className="input-field-text"
                  type="date"
                  min={getCurrentDate()}
                  max={getNextSixDays()}
                  value={collectionDate}
                  onChange={(e) => handleDateChange(e)}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <div
              className="cancel-btn"
              onClick={() => setShowBookOrderModal(false)}
            >
              Close
            </div>
            <div className="submit-btn" onClick={() => bookSelectedOrders()}>
              Submit
            </div>
          </div>
        </div>
      </Modal>
      <Modal showModal={showHoldOrderModal} width="30%">
        <div className="booking-modal">
          <div className="modal-header">
            <div className="shipping-heading">Hold Order</div>
          </div>
          <div className="modal-body">Do you want to hold selected orders?</div>
          <div className="modal-footer">
            <div
              className="cancel-btn"
              onClick={() => setShowHoldOrderModal(false)}
            >
              Close
            </div>
            <div className="submit-btn" onClick={() => holdSelectedOrders()}>
              Submit
            </div>
          </div>
        </div>
      </Modal>
      <div className="orders-filters">
        <div className="input-container">
          <div className="input-lebel">
            <span> Start Date&nbsp;</span>
          </div>
          <div className="input-field1">
            <input
              className="input-field-text"
              type="date"
              onChange={(e) =>
                setFilterData({ ...filterData, startDate: e.target.value })
              }
              value={filterData.startDate}
            />
          </div>
        </div>
        <div className="input-container">
          <div className="input-lebel">
            <span> End Date&nbsp;</span>
          </div>
          <div className="input-field1">
            <input
              className="input-field-text"
              type="date"
              onChange={(e) =>
                setFilterData({ ...filterData, endDate: e.target.value })
              }
              value={filterData.endDate}
            />
          </div>
        </div>
        <div className="input-container">
          <div className="input-lebel">
            <span> Order Id&nbsp;</span>
          </div>
          <div className="input-field1">
            <input
              className="input-field-text"
              type="text"
              placeholder="Order Id"
              onChange={(e) =>
                setFilterData({ ...filterData, orderId: e.target.value })
              }
              value={filterData.orderId}
            />
          </div>
        </div>
        <div className="input-container">
          <div className="input-lebel">
            <span> Order Shipping Type&nbsp;</span>
          </div>
          <div className="input-field1">
            <select className="input-field-text" type="text">
              <option value="all">All</option>
            </select>
          </div>
        </div>
        <div className="d-flex align-items-end  ">
          <button
            className="fc-yellow-btn pointer"
            onClick={() => {
              const filteredOrders = allNewOrders?.filter((element) => {
                // Convert order date to seconds
                const orderDate = new Date(element.created_at).getTime() / 1000;

                // Convert start date to seconds (00:00 AM)
                const startDate = new Date(filterData.startDate);
                startDate.setHours(0, 0, 0, 0);
                const startDateInSeconds = startDate.getTime() / 1000;

                // Convert end date to seconds (11:59 PM)
                const endDate = new Date(filterData.endDate);
                endDate.setHours(23, 59, 59, 999);
                const endDateInSeconds = endDate.getTime() / 1000;

                // Check if order date is within the specified range
                const orderDateCheck =
                  filterData.startDate !== "" && filterData.endDate !== ""
                    ? orderDate >= startDateInSeconds &&
                      orderDate <= endDateInSeconds
                    : true;

                // Check if order ID matches the filter
                const orderIdCheck =
                  filterData.orderId !== ""
                    ? element.order_number
                        .toString()
                        .includes(filterData.orderId.toString())
                    : true;

                // Return true only if both checks pass
                return orderDateCheck && orderIdCheck;
              });

              // Set the filtered orders
              setOrders(filteredOrders);
            }}
          >
            Filter
          </button>
        </div>
        <div className="filter-buttons">
          <button
            className="pointer"
            onClick={() => {
              setFilterData({
                startDate: "",
                endDate: "",
                orderId: "",
                shippingType: "",
              });
              setOrders(allNewOrders);
            }}
          >
            {" "}
            Reset{" "}
          </button>
        </div>
      </div>
     <div className="order-action-buttons">
        <button
          className="submit-btn"
          onClick={() =>
            selectedOrders.length > 0
              ? setShowBookOrderModal(true)
              : (setShowError(true),
                setErrorMsg("Please select at least 1 order"))
          }
        >
          Book Selected Orders
        </button>
        <button
          className="submit-btn"
          style={{
            visibility: "hidden",
          }}
          onClick={() =>
            selectedOrders.length > 0
              ? setShowHoldOrderModal(true)
              : (setShowError(true),
                setErrorMsg("Please select at least 1 order"))
          }
        >
          Hold Selected Orders
        </button>
      </div>
      <div className="pickup-locations-table">
        <table>
          <tr className="table-head">
            <th className="select-all">
              <input type="checkbox" onChange={(e) => handleSelectAll(e)} />
            </th>
            <th>Order Id</th>
            <th>Date</th>
            <th>Fastcourier Refrence No.</th>
            <th>Customer</th>
            <th>Ship To</th>
            <th>Status</th>
            <th>Total</th>
            <th>packages</th>
            <th>Carrier Details</th>
            <th>
                {/* Shipping type */}
                Reason
                </th>
            <th>Actions</th>
          </tr>
          {orders?.length > 0 &&
            orders?.map((element, i) => {
              if (
                // getMetaValue(
                //   element.node?.metafields?.edges,
                //   "fc_order_status"
                // ) != "Hold" &&
                // getMetaValue(
                //   element.node?.metafields?.edges,
                //   "fc_order_status"
                // ) != "Booked for collection" &&
                // getMetaValue(
                //   element.node?.metafields?.edges,
                //   "fc_order_status"
                // ) != "Fallback"
                getOrderDataMetaField(element)?.some(
                  (item) => item?.order_status === "Rejected"
                ) === true
              ) {
                return (
                  <tr
                    key={i}
                    className="products-row"
                    style={{ background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF" }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        value={element.id}
                        onChange={(e) => selectOrder(e)}
                        checked={selectedOrders.includes(element.id.toString())}
                      />
                    </td>
                    <td
                      width="7%"
                      onClick={() =>
                        navigate("/orderDetails", {
                          state: { order: element, redirectedtab: "rejectedOrders" },
                        })
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {element.order_number}
                    </td>
                    <td width="5%">{getFormattedDate(element.created_at)}</td>
                    <td width="15%">
                      {/* Fast courier refernce Number */}
                      {JSON.parse(
                        getMetaValue(
                          element.node?.metafields?.edges,
                          "order_data"
                        )
                      )
                        ?.map((item) => item?.order_id)
                        .join(", ")}
                    </td>
                    <td width="10%">
                      {element?.shipping_address != null
                        ? element?.shipping_address?.first_name +
                          " " +
                          element?.shipping_address?.last_name
                        : element?.billing_address?.first_name +
                          " " +
                          element?.billing_address?.last_name}
                    </td>
                    <td width="5%">
                      {element?.shipping_address != null
                        ? getAddress(element.shipping_address)
                        : getAddress(element.billing_address)}
                    </td>

                    <td width="15%">
                      {/* Fast courier Order Status */}
                      {JSON.parse(
                        getMetaValue(
                          element.node?.metafields?.edges,
                          "order_data"
                        )
                      )
                        ?.map((item) => `${item?.order_status}`)
                        .join(", ")}
                    </td>
                    <td width={"8%"}>${element.current_total_price}</td>
                    <td width="7%">
                      {element.line_items[0].fulfillable_quantity}
                    </td>
                    <td width="15%">
                        {/* Carrier Details */} 
                        {JSON.parse(
                        getMetaValue(
                          element.node?.metafields?.edges,
                          "order_data"
                        )
                      )
                        ?.map((item) => `$${item?.price}(${item?.courierName})`)
                        .join(", ")}
                      {/* {getMetaValue(
                        element.node?.metafields?.edges,
                        "fc_order_status"
                      ) === "Freeshipping"
                        ? getFreeShippingPrice(element)
                        : "$" + element?.shipping_lines?.[0]?.price}{" "}
                      {element?.shipping_lines?.[0]?.title
                        ? `(${
                            element?.shipping_lines?.[0]?.title
                              ?.replace("Fast Courier", "")
                              ?.replace("[", "")
                              ?.replace("]", "")
                              ?.replace(" ", "") ?? "Free"
                          })`
                        : ""} */}
                    </td>
                    <td width="10%">
                     {/* Fast courier Rejection Reason */}
                     {JSON.parse(
                        getMetaValue(
                          element.node?.metafields?.edges,
                          "order_data"
                        )
                      )
                        ?.map((item) => `${item?.errors}`)
                        .join(", ")} </td>
                    <td width="8%">
                        
                        
                              <FontAwesomeIcon
                              style={{
                                cursor: "pointer",
                              
                              
                              }}
                        icon="fa-external-link"
                       size="xs"
                        onClick={()=>{
                            let userData = JSON.parse(localStorage.getItem("userData"));
                            let store = userData.shop?.replace(".myshopify.com","")
                           
                            window.open(`https://admin.shopify.com/store/${store}/orders/${element.id}`,"_blank")
                        }}
                      />
                      
                        
                        
                        </td>
                  </tr>
                );
              }
            })}
        </table>
      </div>
    </div>
  );
}

export function getAddress(address) {
  if (!address) return "";

  return `${address.address1 ?? ""}
   ${address.address2 ?? ""}
   ${address.city ?? ""}
   ${address.province_code ?? ""}
     ${address.company ?? ""} 
     ${address.zip ?? ""} 
       `;
}

export function getCurrentDate() {
  const today = new Date();
  const year = today.getFullYear();
  let month = today.getMonth() + 1;
  let day = today.getDate();

  month = month < 10 ? `0${month}` : month;
  day = day < 10 ? `0${day}` : day;

  return `${year}-${month}-${day}`;
}

export function getNextSixDays() {
  const today = new Date();
  const nextSixDays = new Date(today);
  nextSixDays.setDate(nextSixDays.getDate() + 6);

  const year = nextSixDays.getFullYear();
  let month = nextSixDays.getMonth() + 1;
  let day = nextSixDays.getDate();

  month = month < 10 ? `0${month}` : month;
  day = day < 10 ? `0${day}` : day;

  return `${year}-${month}-${day}`;
}
