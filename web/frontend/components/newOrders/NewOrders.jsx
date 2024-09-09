import "./style.scss";
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
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { ButtonGroup, Dropdown, DropdownButton } from "react-bootstrap";
import _ from 'lodash';
import { toast } from "react-toastify";
export function NewOrders(props) {
  const fetch = useAuthenticatedFetch();
  // newOrders // processedOrders
  const [tabKey, setTabKey] = useState('newOrders');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showError, setShowError] = useState(false);
  const [showBookOrderModal, setShowBookOrderModal] = useState(false);
  const [bookRejectedOrder, setBookRejectedOrder] = useState(false);
  const [showHoldOrderModal, setShowHoldOrderModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orders, setOrders] = useState(null);
  const [defaultLocation, setDefaultLocation] = useState(null);
  const [pickupLocations, setPickupLocations] = useState(null);
  const [disabledDates, setDisabledDates] = useState([]);
  const [allNewOrders, setallNewOrders] = useState([]);
  const [processedOrderList, setProcessedOrderList] = useState([])
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
        if (defaultPickupLocation) {
          setDefaultLocation(defaultPickupLocation);
          
        } else {
          setDefaultLocation(response?.data?.data?.[0] ?? {});
        }
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

  // function getAllOrdersData() {
  //   setIsLoading(true);
  //   Promise.all([getAllOrders(), getOrderMeta()])
  //     .then(([ordersData, orderMetaData, locationData]) => { 
  //       const getOrders = ordersData
  //         ?.map((item1) => {
  //           // Find the matching order node in orderMetaData
  //           const matchingItem2 = orderMetaData?.body?.data?.orders?.edges.find(
  //             (item2) => item2.node.id.includes(item1.id)
  //           );

  //           // Extract the metafields for order_data
  //           const orderDataEdge = matchingItem2?.node?.metafields?.edges.find(
  //             (edge) => edge.node.key === "order_data"
  //           );

  //           // Initialize an array to hold the processed orders
  //           let processedOrders = [];

  //           if (orderDataEdge) {
  //             const orderData = JSON.parse(orderDataEdge.node.value);
  //             processedOrders = orderData.map((order) => {
  //               // Copy the element and add the order data
  //               const _item = { ...item1}
  //               return {
  //                 ..._item,
  //                 node: { ...matchingItem2?.node },
  //                 orderData: { ...order },
  //               };
  //             });
  //           } else {
  //             // If no order_data is found, just return the original item with matching node data
  //             processedOrders = [{ ...item1, node: matchingItem2?.node ?? {} }];
  //           }

  //           // Flatten the array by spreading the processed orders
  //           return processedOrders;
  //         })
  //         .flat(); // Flatten the nested arrays if any

  //       let updatedOrders = [];
  //       for (let index = 0; index < getOrders.length; index++) {
  //         const element = getOrders[index];
  //         const orderDataEdge = element.node.metafields.edges.find(
  //           (edge) => edge.node.key === "order_data"
  //         );
  //         if (orderDataEdge) {
  //           const orderData = JSON.parse(orderDataEdge.node.value);
  //           let _orderArray = new Array(orderData.length).fill(null);

  //           for (let index = 0; index < _orderArray.length; index++) {
  //             const order = orderData[index];
  //             const _element = { ...element };
  //             _element.orderData = { ...order };

  //             updatedOrders.push(_element);
  //           }
  //         }
  //       }

  //       setProcessedOrderList(updatedOrders);
  //       setOrders(getOrders);
  //       setallNewOrders(getOrders);
  //       setIsLoading(false);
  //       setFilterData({
  //         startDate: "",
  //         endDate: "",
  //         orderId: "",
  //         shippingType: "",
  //       });
  //     })
  //     .catch((error) => {
  //       console.error("error:", error);
  //     });
  // }

  function getAllOrdersData() {
    setIsLoading(true);
    Promise.all([getAllOrders(), getOrderMeta()])
      .then(([ordersData, orderMetaData]) => {
        const getOrders = ordersData?.map((item1) => {
          const matchingItem2 = orderMetaData?.body?.data?.orders?.edges.find(
            (item2) => item2.node.id.includes(item1.id)
          );
  
          const orderDataEdge = matchingItem2?.node?.metafields?.edges.find(
            (edge) => edge.node.key === "order_data"
          );
  
          if (orderDataEdge) {
            const orderData = JSON.parse(orderDataEdge.node.value);
            return orderData.map((order) => ({
              ..._.cloneDeep(item1),  // Use lodash deep clone here
              node: { ...matchingItem2.node },
              orderData: { ...order }
            }));
          } else {
            return [{ ..._.cloneDeep(item1), node: matchingItem2?.node ?? {} }];
          }
        }).flat();
  
        setProcessedOrderList(getOrders);
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

    return location ? location.node.value : null;
  };

 

  const selectOrder = (e) => {
    const orderIds = selectedOrders.includes(e.target.value)
      ? selectedOrders.filter((item) => item !== e.target.value)
      : [...selectedOrders, e.target.value];
    setSelectedOrders(orderIds);
  };

  const handleSelectAll = (e) => {
    if (tabKey === "holdOrders") {
      var selectedIds = e.target.checked
        ? orders
            .filter((item) => item?.orderData?.order_status === "Hold")
            .map((element) => element.id.toString())
        : [];
      setSelectedOrders(selectedIds);
    } else {
      var selectedIds = e.target.checked
        ? orders
            .filter((item) => item?.orderData?.order_status === "Ready to Book")
            .map((element) => element.id.toString())
        : [];
      setSelectedOrders(selectedIds);
    }
  };

  const holdSelectedOrders = async () => {
    const selectedOrderDetails = orders?.filter((element) =>
      selectedOrders.includes(`${element.id}`)
    );
    try {
      setIsLoading(true);
      const response = await fetch("/api/hold-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orders: selectedOrderDetails,
        }),
      });
      toast.success(`${order_booking_status.processedOrders} Order processed!`, {
        position: "top-right",
        
      });i
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
            wpOrderId:element?.id,
            collectionDate: collectionDate,
            destinationEmail: element?.contact_email ?? "",
            destinationPhone: element?.shipping_address?.phone  ,
            // wpOrderId: element?.order_number,
            destinationFirstName: element?.shipping_address?.first_name,
            destinationLastName: element?.shipping_address?.last_name,
            destinationCompanyName: element?.shipping_address.company,
            destinationAddress1: element?.shipping_address.address1,
            destinationAddress2: element?.shipping_address.address2,
            pickupFirstName: defaultLocation?.first_name,
            pickupLastName: defaultLocation?.last_name,
            pickupCompanyName: null ?? "",
            pickupAddress1: defaultLocation?.address1,
            pickupAddress2: defaultLocation?.address2 ?? "",
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
      setIsLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      
      const selectedOrderIds = new Set();
      const selectedOrderDetails = orders?.filter((element) => {
        const idString = `${element.id}`;
        if (selectedOrders.includes(idString) && !selectedOrderIds.has(idString)) {
          selectedOrderIds.add(idString);
          return true;
        }
        return false;
      });
      

      const orderStructure = create2DArray(selectedOrderDetails); 
       
      const payload = {
        orders: orderStructure.flat(1),
        isReprocessOrders: false,
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
        .then(async (response) => {
          // let output = response.data.response;
          let _output = convertTo2DArray(
            response.data.response,
            orderStructure
          )  
          let order_booking_status =  await fetch("/api/book-orders", {
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
          order_booking_status = await order_booking_status.json();
          
          if(order_booking_status.success){
            if (order_booking_status.processedOrders>0 && order_booking_status.rejectedOrders>0) {
              toast.error(`${order_booking_status.processedOrders} Order processed and ${order_booking_status.rejectedOrders} Order rejected!`, {
                position: "top-right",
                
              });
              
            }else if(order_booking_status.processedOrders>0 && order_booking_status.rejectedOrders===0){
              toast.success(`${order_booking_status.processedOrders} Order processed!`, {
                position: "top-right",
                
              });}
              else if(order_booking_status.processedOrders===0 && order_booking_status.rejectedOrders>0){
                toast.error(`${order_booking_status.rejectedOrders} Order rejected!`, {
                  position: "top-right",
                  
                });}

          }else{
            toast.error('0 Order processed!', {
              position: "top-right",
             
              });
          }
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
  const bookRejectedOrders =  () => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      const rejectedOrderId = localStorage.getItem("rejectedOrderId");
      
      const selectedOrderDetails = orders?.find((element) => 
        element.id === Number(rejectedOrderId)
      );
      console.log(selectedOrderDetails,"selectedOrderDetails")
      const orderStructure = create2DArray([selectedOrderDetails]); 
       
      
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
        .then(async (response) => {
          // let output = response.data.response;
          let _output = convertTo2DArray(
            response.data.response,
            orderStructure
          ) 
       
        let order_booking_status = await fetch("/api/book-orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              collectionDate: collectionDate,
              orders: [selectedOrderDetails],
              orderStatuses: _output,
            }),
          });
          order_booking_status = await order_booking_status.json();
          

          if(order_booking_status.success){
            if (order_booking_status.processedOrders>0 && order_booking_status.rejectedOrders>0) {
              toast.error(`${order_booking_status.processedOrders} Order processed and ${order_booking_status.rejectedOrders} Order rejected!`, {
                position: "top-right",
                
              });
              
            }else if(order_booking_status.processedOrders>0 && order_booking_status.rejectedOrders===0){
              toast.success(`${order_booking_status.processedOrders} Order processed!`, {
                position: "top-right",
                
              });}
              else if(order_booking_status.processedOrders===0 && order_booking_status.rejectedOrders>0){
                toast.error(`${order_booking_status.rejectedOrders} Order rejected!`, {
                  position: "top-right",
                  
                });}

          }else{
            toast.error('0 Order processed!', {
              position: "top-right",
             
              });
          }

          setIsLoading(false);
          getAllOrdersData();
          setShowBookOrderModal(false);
          setBookRejectedOrder(false)
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


   const [syncing, setSyncing] = useState(false)
  function reSyncOrderApi() {
    setSyncing(true);

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
        }/api/wp/run-order-synicing-cron`,
        { headers: headers }
      )
      .then((response) => {
         
       
        if (response?.status === 200) {
          localStorage.setItem("reSyncTime", formatSyncTime(response?.data?.sync_time));
        }
        setSyncing(false);
      })
      .catch((error) => {
        setSyncing(false);

        console.log(error);
      });
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
            <div className="shipping-heading w-100 text-center">Process</div>
          </div>
          <div className="modal-body">
            <div className="input-container w-100">
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

      {/* REBOOK REJECTED ORDER */}
      <Modal showModal={bookRejectedOrder} width="30%">
        <div className="booking-modal">
          <div className="modal-header">
            <div className="shipping-heading w-100 text-center">Process</div>
          </div>
          <div className="modal-body">
            <div className="input-container w-100">
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
              onClick={() => setBookRejectedOrder(false)}
            >
              Close
            </div>
            <div className="submit-btn" onClick={() => bookRejectedOrders()}>
              Submit
            </div>
          </div>
        </div>
      </Modal>
      <Modal showModal={showHoldOrderModal} width="30%">
        <div className="booking-modal">
          <div className="modal-header">
            <div className="shipping-heading w-100 text-center">Hold Order</div>
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
          style={{
            width: "160px",
          }}
          onClick={() => {
            reSyncOrderApi();
          }}
        >
          {syncing ? "Please wait.." : "Re-sync orders"}
        </button>
        <div
          className="pl-4 d-flex"
          style={{
            alignItems: "end",
          }}
        >
          {localStorage.getItem("reSyncTime") && (
            <span>
              <strong>Last Synced:</strong> {localStorage.getItem("reSyncTime")}
            </span>
          )}
        </div>
      </div>

      <Tabs
        id="controlled-tab-example"
        activeKey={tabKey}
        onSelect={(k) => {
          setSelectedOrders([]);
          setTabKey(k);
        }}
        className="mb-3 mt-4"
      >
        <Tab eventKey="newOrders" title="New Orders">
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
                <th>Shipping type</th>
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
                    // ) != "Fallback" &&
                    // getMetaValue(
                    //   element.node?.metafields?.edges,
                    //   "fc_order_status"
                    // ) != "Rejected"
                    getOrderDataMetaField(element)?.every(
                      (item) => item?.order_status === "Ready to Book"
                    ) === true
                  ) {
                    return (
                      <tr
                        key={i}
                        className="products-row"
                        style={{
                          background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF",
                        }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            value={element.id}
                            onChange={(e) => selectOrder(e)}
                            checked={selectedOrders.includes(
                              element.id.toString()
                            )}
                          />
                        </td>
                        <td className="order-id-cell"
                          width="7%"
                          onClick={() =>
                            navigate("/orderDetails", {
                              state: {
                                order: element,
                                // redirectedtab: "newOrders",
                              },
                            })
                          }
                          style={{ cursor: "pointer" }}
                        >
                          {element.order_number}
                        </td>
                        <td width="5%">
                          {getFormattedDate(element.created_at)}
                        </td>
                        <td width="15%">
                          {/* Fast courier refernce Number */}
                         
                          {element?.orderData?.order_id}

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
                        <td width="10%">
                          {element?.shipping_address != null
                            ? getAddress(element.shipping_address)
                            : getAddress(element.billing_address)}
                        </td>

                        <td width="15%">
                          {/* Fast courier Order Status */}
                          {element?.orderData?.order_status}

                        </td>
                        <td width={"8%"}>${element.current_total_price}</td>
                        <td width="4%">
                          {element.line_items[0].fulfillable_quantity}
                        </td>
                        <td width="15%">
                          {/* Carrier Details */}
                          
                          {`$${element?.orderData?.price}`}<br />
                          {`(${element?.orderData?.courierName})`}


 
                        </td>
                        <td width="10%">{element.financial_status}</td>
                        <td width="8%">{"NA"}</td>
                      </tr>
                    );
                  }
                })}
            </table>
          </div>
        </Tab>
        <Tab eventKey="processedOrders" title="Processed Orders">
          <div className="pickup-locations-table">
            <table width={"100%"}>
              <tr className="table-head">
                {/* <th className="select-all">
                <input type="checkbox" onChange={(e) => handleSelectAll(e)} />
              </th> */}
                <th>Order Id</th>
                <th>Date</th>
                <th>Fastcourier Refrence No.</th>
                <th>Customer</th>
                <th>Ship To</th>
                <th>Status</th>
                <th>Total</th>
                <th>packages</th>
                <th>Carrier Details</th>
                {/* <th>Shipping type</th> */}
                <th>Errors</th>
                <th>Actions</th>
              </tr>
              {processedOrderList?.length > 0 &&
                processedOrderList?.map((element, i) => {
                  if (
                    element?.orderData?.order_status !==
                      "Ready to Book" &&
                    element?.orderData?.order_status !== "Fallback" &&
                    element?.orderData?.order_status !== "Rejected"
                  ) {
                    return (
                      <tr
                        key={i}
                        className="products-row"
                        style={{
                          background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF",
                        }}
                      >
                        <td className="order-id-cell"
                          width="7%"
                          onClick={() =>
                            navigate("/orderDetails", {
                              state: {
                                order: element,
                                // redirectedtab: "processedOrders",
                              },
                            })
                          }
                          style={{ cursor: "pointer" }}
                        >
                          {element.order_number}
                        </td>
                        <td width="5%">
                          {getFormattedDate(element.created_at)}
                        </td>
                        <td width="15%">
                          {/* Fast courier refernce Number */}

                          {element?.orderData?.order_id}
                        </td>
                        <td width="5%">
                          {element?.shipping_address != null
                            ? element?.shipping_address?.first_name +
                              " " +
                              element?.shipping_address?.last_name
                            : element?.billing_address?.first_name +
                              " " +
                              element?.billing_address?.last_name}
                        </td>
                        <td width="10%">
                          {element?.shipping_address != null
                            ? getAddress(element.shipping_address)
                            : getAddress(element.billing_address)}
                        </td>

                        <td width="8%">
                          {/* Fast courier Order Status */}

                          {element?.orderData?.order_status}
                        </td>
                        <td width={"8%"}>${element.current_total_price}</td>
                        <td width="7%">
                          {element.line_items[0].fulfillable_quantity}
                        </td>
                        <td width="15% text-center">
                          {/* Carrier Details */}
                          {`$${element?.orderData?.price}`}<br />
                          {`(${element?.orderData?.courierName})`}
                        </td>
                        <td width="10%">
                          {/* {element.financial_status} */}
                          {element?.orderData?.order_status === "Rejected" &&
                            element?.orderData?.errors}
                        </td>
                        <td width="8%">
                          {(element?.orderData?.order_status ===
                            "Booked for Collection" ||
                            element?.orderData?.order_status ===
                              "Rejected") && (
                            <Dropdown
                              as={ButtonGroup}
                              key={"start"}
                              id={`dropdown-button-drop-${"start"}`}
                              drop={"start"}
                              variant="warning"
                              title={`Options`}
                              className="options-dropdown"
                            >
                              <Dropdown.Toggle>
                                <FontAwesomeIcon
                                  icon="fa-solid fa-ellipsis"
                                  style={{
                                    width: "15px",
                                    height: "19px",
                                  }}
                                />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {element?.orderData?.label && (
                                  <Dropdown.Item
                                    eventKey="1"
                                    target="_blank"
                                    href={
                                      element?.orderData?.doc_prefix +
                                      element?.orderData?.label
                                    }
                                  >
                                    Download Label
                                  </Dropdown.Item>
                                )}
                                {element?.orderData?.invoice && (
                                  <Dropdown.Item
                                    eventKey="2"
                                    target="_blank"
                                    href={
                                      element?.orderData?.doc_prefix +
                                      element?.orderData?.invoice
                                    }
                                  >
                                    Download Invoice
                                  </Dropdown.Item>
                                )}
                                {element?.orderData?.additional?.[1] && (
                                  <Dropdown.Item
                                    eventKey="3"
                                    target="_blank"
                                    href={
                                      element?.orderData?.doc_prefix +
                                      element?.orderData?.additional?.[1]?.slice(
                                        1
                                      )
                                    }
                                  >
                                    Additional docs
                                  </Dropdown.Item>
                                )}
                              </Dropdown.Menu>
                            </Dropdown>
                          )}

                          {false &&
                            JSON.parse(
                              getMetaValue(
                                element.node?.metafields?.edges,
                                "order_data"
                              )
                            )?.map((item) => {
                              return (
                                <div
                                  className="d-flex align-items-center "
                                  style={{
                                    justifyContent: "space-around",
                                  }}
                                >
                                  {item?.label && (
                                    <div className="d-flex" title="Label">
                                      <a
                                        href={item?.doc_prefix + item?.label}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <FontAwesomeIcon
                                          icon="note-sticky"
                                          style={{
                                            color: "black",
                                            width: "15px",
                                          }}
                                        />
                                      </a>
                                    </div>
                                  )}

                                  {item?.invoice && (
                                    <div className="d-flex" title="Invoice">
                                      <a
                                        href={item?.doc_prefix + item?.invoice}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <FontAwesomeIcon
                                          icon="fa-solid fa-receipt"
                                          style={{
                                            color: "black",
                                            width: "15px",
                                          }}
                                        />
                                      </a>
                                    </div>
                                  )}

                                  {item?.additional?.[1] && (
                                    <div
                                      className="d-flex"
                                      title="Additional Documents"
                                    >
                                      <a
                                        href={
                                          item?.doc_prefix +
                                          item?.additional?.[1]?.slice(1)
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <FontAwesomeIcon
                                          icon="fa-solid fa-file-invoice"
                                          style={{
                                            color: "black",
                                            width: "15px",
                                          }}
                                        />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </td>
                      </tr>
                    );
                  }
                })}
            </table>
          </div>
        </Tab>
        <Tab eventKey="holdOrders" title="Hold Orders">
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
              disabled
              style={{
                visibility: "hidden",
              }}
              className="submit-btn "
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
                <th>Remarks</th>
                <th>Total</th>
                <th>packages</th>
                {/* <th>Shipping type</th> */}
                <th>Carrier details</th>
                <th>Actions</th>
              </tr>
              {orders?.length > 0 &&
                orders.map((element, i) => {
                  if (element?.orderData?.order_status === "Hold") {
                    return (
                      <tr
                        key={i}
                        className="products-row"
                        style={{
                          background: i % 2 == 0 ? "#F5F8FA" : "#FFFFFF",
                        }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            value={element.id}
                            onChange={(e) => selectOrder(e)}
                            checked={selectedOrders.includes(
                              element.id.toString()
                            )}
                          />
                        </td>
                        <td
                        className="order-id-cell"
                          width="7%"
                          onClick={() =>
                            navigate("/orderDetails", {
                              state: {
                                order: element,
                                // redirectedtab: "holdOrders",
                              },
                            })
                          }
                          style={{ cursor: "pointer" }}
                        >
                          {element.order_number}
                        </td>
                        <td width="7%">
                          {new Date(element.created_at).toLocaleDateString(
                            "en-GB"
                          )}
                        </td>
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
                          {element?.shipping_address?.first_name +
                            " " +
                            element?.shipping_address?.last_name}
                        </td>
                        <td width="10%">
                          {element?.shipping_address != null
                            ? getAddress(element.shipping_address)
                            : getAddress(element.billing_address)}
                        </td>
                        <td width="8%">
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
                        <td width="8%">{"NA"}</td>
                        <td width={"8%"}>${element.subtotal_price}</td>
                        <td width="7%">
                          {element.line_items[0].fulfillable_quantity}
                        </td>
                        <td width="15% text-center">
                          {/* Carrier Details */}
                          {`$${element?.orderData?.price}`}<br />
                          {`(${element?.orderData?.courierName})`}
                        </td>
                        <td width="10%" className="order-actions">
                          {/* <FontAwesomeIcon
                        icon="fa-solid fa-pen-to-square"
                        size="2xs"
                      /> */}
                          NA
                        </td>
                      </tr>
                    );
                  }
                })}
            </table>
          </div>
        </Tab>
        <Tab eventKey="rejectedOrders" title="Rejected Orders">
          <div className="pickup-locations-table">
            <table width={"100%"}>
              <tr className="table-head">
                <th>Order Id</th>
                <th>Date</th>
                <th>Fastcourier Refrence No.</th>
                <th>Customer</th>
                <th>Ship To</th>
                <th>Status</th>
                <th>Total</th>
                <th>packages</th>
                <th>Carrier Details</th>
                {/* <th>Shipping type</th> */}
                <th>Errors</th>
                <th>Actions</th>
              </tr>
              {orders?.length > 0 &&
                orders?.map((element, i) => {
                  if (element?.orderData?.order_status === "Rejected") {
                    return (
                      <tr
                        key={i}
                        className="products-row"
                        style={{
                          background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF",
                        }}
                      >
                        <td
                        className="order-id-cell"
                          width="7%"
                          onClick={() =>
                            navigate("/orderDetails", {
                              state: {
                                order: element,
                                // redirectedtab: "processedOrders",
                              },
                            })
                          }
                          style={{ cursor: "pointer" }}
                        >
                          {element.order_number}
                        </td>
                        <td width="5%">
                          {getFormattedDate(element.created_at)}
                        </td>
                        <td width="15%">
                          {/* Fast courier refernce Number */}
                          {element?.orderData?.order_id}
                        </td>
                        <td width="5%">
                          {element?.shipping_address != null
                            ? element?.shipping_address?.first_name +
                              " " +
                              element?.shipping_address?.last_name
                            : element?.billing_address?.first_name +
                              " " +
                              element?.billing_address?.last_name}
                        </td>
                        <td width="10%">
                          {element?.shipping_address != null
                            ? getAddress(element.shipping_address)
                            : getAddress(element.billing_address)}
                        </td>

                        <td width="8%">
                          {/* Fast courier Order Status */}

                          {element?.orderData?.order_status}
                        </td>
                        <td width={"8%"}>${element.current_total_price}</td>
                        <td width="7%">
                          {element.line_items[0].fulfillable_quantity}
                        </td>
                        <td width="15% text-center">
                          {/* Carrier Details */}

                          {`$${element?.orderData?.price}`}<br />
                          {`(${element?.orderData?.courierName})`}
                        </td>
                        <td width="10%">
                          {/* {element.financial_status} */}
                          {element?.orderData?.order_status === "Rejected" &&
                            element?.orderData?.errors}
                        </td>
                        <td width="8%">
                          {(element?.orderData?.order_status ===
                            "Booked for Collection" ||
                            element?.orderData?.order_status ===
                              "Rejected") && (
                            <Dropdown
                              as={ButtonGroup}
                              key={"start"}
                              id={`dropdown-button-drop-${"start"}`}
                              drop={"start"}
                              variant="warning"
                              title={`Options`}
                              className="options-dropdown"
                            >
                              <Dropdown.Toggle>
                                <FontAwesomeIcon
                                  icon="fa-solid fa-ellipsis"
                                  style={{
                                    width: "15px",
                                    height: "19px",
                                  }}
                                />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {element?.orderData?.errors?.length > 0 && (
                                  <Dropdown.Item
                                    eventKey="4"
                                    onClick={() => {
                                      let userData = JSON.parse(
                                        localStorage.getItem("userData")
                                      );
                                      let store = userData.shop?.replace(
                                        ".myshopify.com",
                                        ""
                                      );

                                      const newWindow = window.open(
                                        `https://admin.shopify.com/store/${store}/orders/${element.id}`,
                                        "popupWindow",
                                        "width=7000,height=7000"
                                      );

                                      var pollTimer = window.setInterval(
                                        function () {
                                          if (newWindow.closed !== false) {
                                            window.clearInterval(pollTimer);
                                            getAllOrdersData();
                                          }
                                        },
                                        500
                                      );
                                    }}
                                  >
                                    Edit
                                  </Dropdown.Item>
                                )}
                                {element?.orderData?.errors?.length > 0 && (
                                  <Dropdown.Item
                                    eventKey="4"
                                    onClick={() => {
                                      localStorage.setItem(
                                        "rejectedOrderId",
                                        element.id
                                      );
                                      setBookRejectedOrder(true);
                                    }}
                                  >
                                    Re-Book Order
                                  </Dropdown.Item>
                                )}
                              </Dropdown.Menu>
                            </Dropdown>
                          )}

                          
                        </td>
                      </tr>
                    );
                  }
                })}
            </table>
          </div>
        </Tab>
        <Tab eventKey="fallbackOrders" title="Fallback Orders">
          <div className="pickup-locations-table">
            <table>
              <tr className="table-head">
                {/* <th className="select-all">
                <input type="checkbox" onChange={(e) => handleSelectAll(e)} />
              </th> */}
                <th>Order Id</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Ship To</th>
                <th>Status</th>
                <th>Total</th>
                <th>packages</th>
                <th>Carrier Details</th>
                <th>Shipping type</th>
                <th>Actions</th>
              </tr>
              {orders?.length > 0 &&
                orders?.map((element, i) => {
                  if (element?.orderData?.order_status === "Fallback") {
                    return (
                      <tr
                        key={i}
                        className="products-row"
                        style={{
                          background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF",
                        }}
                      >
                        {/* <td>
                        <input
                          type="checkbox"
                          value={element.id}
                          onChange={(e) => selectOrder(e)}
                          checked={selectedOrders.includes(element.id.toString())}
                        />
                      </td> */}
                        <td
                          width="7%"
                          // onClick={() =>
                          //   navigate("/orderDetails", {
                          //     state: { order: element, redirectedtab: "newOrders" },
                          //   })
                          // }
                          style={{ cursor: "pointer" }}
                        >
                          {element.order_number}
                        </td>
                        <td width="10%">
                          {getFormattedDate(element.created_at)}
                        </td>
                        <td width="15%">
                          {element?.shipping_address != null
                            ? element?.shipping_address?.first_name +
                              " " +
                              element?.shipping_address?.last_name
                            : element?.billing_address?.first_name +
                              " " +
                              element?.billing_address?.last_name}
                        </td>
                        <td width="15%">
                          {element?.shipping_address != null
                            ? getAddress(element.shipping_address)
                            : getAddress(element.billing_address)}
                        </td>

                        <td width="8%">
                          Ready to Book
                          {/* {element.financial_status} */}
                        </td>
                        <td width={"8%"}>${element.current_total_price}</td>
                        <td width="7%">
                          {element.line_items[0].fulfillable_quantity}
                        </td>
                        <td width="15%">
                          {element?.shipping_lines?.[0]?.price &&
                          element?.shipping_lines?.[0]?.price > 0
                            ? "$" + element?.shipping_lines?.[0]?.price
                            : ""}{" "}
                          {element?.shipping_lines?.[0]?.title
                            ? `(${
                                element?.shipping_lines?.[0]?.title
                                  ?.replace("Fast Courier", "")
                                  ?.replace("[", "")
                                  ?.replace("]", "")
                                  ?.replace(" ", "") ?? "Free"
                              })`
                            : ""}
                        </td>
                        <td width="10%">{element.financial_status}</td>
                        <td width="8%">{"NA"}</td>
                      </tr>
                    );
                  }
                })}
            </table>
          </div>
        </Tab>
        {/* <Tab eventKey="rejectedOrders" title="Rejected Orders">
        </Tab> */}
      </Tabs>
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


export function getOrderDataMetaField(order) {
  try {
    for (const edge of order.node.metafields.edges) {
      if (edge.node.key === "order_data") {
        try {
          return JSON.parse(edge.node.value);
        } catch (e) {
          console.error("Failed to parse order_data:", edge.node.value);
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to parse order_data:", error);
    return null;
    
  }
  // Return null if order_data metafield is not found
}

export function formatSyncTime(timestamp) {
  // Convert the timestamp from seconds to milliseconds
  const date = new Date(timestamp * 1000);
  
  // Extract day, month, year, hours, and minutes
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based in JS
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // Format the date and time as dd/mm/yyyy hh:mm
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}