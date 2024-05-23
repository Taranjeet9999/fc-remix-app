import "./style.css";
import { Modal } from '../modal';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { AddLocation } from '../addLocation';
import { ErrorModal } from '../errorModal';
import { useAppQuery, useAuthenticatedFetch } from "../../hooks";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Loader } from "../loader";
import { ConfirmModal } from "../confirmModal";
import { Link, useNavigate } from "react-router-dom";

export function ProcessedOrders() {
    const fetch = useAuthenticatedFetch();
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showError, setShowError] = useState(false);
    const [orders, setOrders] = useState(null);
    const [orderMeta, setOrderMeta] = useState(null);

    const navigate = useNavigate();

    const getAllOrders = async () => {
        setIsLoading(true);
        const response = await fetch(
            `/api/orders`,
            {
                method: "GET",
                credentials: "include",
                headers: { "Accept": "application/json", },
            },
        );

        const data = await response.json();

        setOrders(data.data);
        setIsLoading(false);
    }

    const getOrderMeta = async () => {
        setIsLoading(true);
        const response = await fetch(
            `/api/order-metafields`,
            {
                method: "GET",
                credentials: "include",
                headers: { "Accept": "application/json", },
            },
        );

        const data = await response.json();

        console.log("ordermeta", data);

        setOrderMeta(data);
        setIsLoading(false);
    }

    useEffect(() => {
        getAllOrders();
        getOrderMeta();
    }, []);

    const getOrders = orders?.map(item1 => {
        const matchingItem2 = orderMeta?.body?.data?.orders?.edges.find(item2 => item2.node.id.includes(item1.id));
        return { ...item1, ...matchingItem2 };
    });

    useEffect(() => {

    }, []);

    const getMetaValue = (metafields, keyValue) => {
        var location = metafields?.find((element) => element.node.key == keyValue);
        return location != undefined ? location.node.value : null;
    }

    const selectOrder = (e) => {
        const orderIds = selectedOrders.includes(e.target.value)
            ? selectedOrders.filter(item => item !== e.target.value)
            : [...selectedOrders, e.target.value];
        setSelectedOrders(orderIds);
    }

    const handleSelectAll = (e) => {
        var selectedIds = e.target.checked ? orders.map((element) => element.id.toString()) : [];
        setSelectedOrders(selectedIds);
    }

    return (
        <div className="new-orders">
            {isLoading && <Loader />}
            <div className="orders-filters">
                <div className="input-container">
                    <div className="input-lebel">
                        <span> Start Date&nbsp;</span>
                    </div>
                    <div className="input-field1">
                        <input className="input-field-text" type="date" />
                    </div>
                </div>
                <div className="input-container">
                    <div className="input-lebel">
                        <span> End Date&nbsp;</span>
                    </div>
                    <div className="input-field1">
                        <input className="input-field-text" type="date" />
                    </div>
                </div>
                <div className="input-container">
                    <div className="input-lebel">
                        <span> Order Number&nbsp;</span>
                    </div>
                    <div className="input-field1">
                        <input className="input-field-text" type="text" placeholder="Order Number" />
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
                <div className="filter-buttons">
                    {/* <button> Filter </button> */}
                    <button> Reset </button>
                </div>
            </div>
            {/* <div className="order-actions">
                <button className="submit-btn">
                    Book Selected Orders
                </button>
                <button className="submit-btn">
                    Hide Selected Orders
                </button>
            </div> */}
            <div className="pickup-locations-table">
                <table>
                    <tr className="table-head">
                        {/* <th className="select-all"><input type="checkbox" onChange={(e) => handleSelectAll(e)} /></th> */}
                        <th>Order Id</th>
                        {/* <th>FastCourier Reference Number</th> */}
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>packages</th>
                        <th>Carrier Details</th>
                        <th>Shipping Date</th>
                        <th>Shipping type</th>
                        <th>Documents</th>
                    </tr>
                    {/* {orders?.data?.data.length > 0 && orders.data.data.map((element, i) => {
                        return <tr key={i} className='products-row' style={{ background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF" }}>
                            <td width="7%">{element.order_number}</td>
                            <td></td>
                            <td width="7%">{new Date(element.created_at).toLocaleDateString('en-GB')}</td>
                            <td width="15%">{ }</td>
                            <td width="8%">{element.financial_status}</td>
                            <td width={"8%"}>{element.subtotal_price}</td>
                            <td width="7%">{element.line_items[0].fulfillable_quantity}</td>
                            <td width="15%"></td>
                            <td width="10%">{new Date(element.created_at).toLocaleDateString('en-GB')}</td>
                            <td width="8%"></td>
                            <td width="8%"></td>
                        </tr>
                    })} */}

                    {getOrders?.length > 0 && getOrders.map((element, i) => {
                        if (getMetaValue(element.node?.metafields?.edges, "fc_order_status") == "Booked for collection" || getMetaValue(element.node?.metafields?.edges, "fc_order_status") == "Processed") {
                            console.log("i", i);
                            return <tr key={i} className='products-row' style={{ background: i % 2 == 0 ? "#F5F8FA" : "#FFFFFF" }}>
                                {/* <td><input type="checkbox" value={element.id} onChange={(e) => selectOrder(e)} checked={selectedOrders.includes(element.id.toString())} /></td> */}
                                <td width="7%" onClick={() =>                         navigate("/orderDetails", { state: { order: element ,redirectedtab:"processedOrders"} })
} style={{ cursor: "pointer" }}>{element.order_number}</td>
                                {/* <td width="8%">{"GROREYQJYM"}</td> */}
                                <td width="7%">{new Date(element.created_at).toLocaleDateString('en-GB')}</td>
                                <td width="15%">
                                    {element?.shipping_address?.first_name + " " + element?.shipping_address?.last_name}
                                    </td>
                                <td width="8%">{getMetaValue(element.node?.metafields?.edges, "fc_order_status")}</td>
                                <td width={"8%"}>${element.subtotal_price}</td>
                                <td width="8%">{"1"}</td>
                                <td width="15%">
                                    {/* {"$14.11(Aramax Express)"} */}
                                    {element?.shipping_lines?.[0]?.price ? "$"+ element?.shipping_lines?.[0]?.price : ""} {element?.shipping_lines?.[0]?.title ?         
                                
                                `(${element?.shipping_lines?.[0]?.title?.replace("Fast Courier", "")?.replace("[",'')?.replace("]","")?.replace(" ","")})`

                                :""
                                
                                }
                                    </td>
                                <td width="7%">{getMetaValue(element.node?.metafields?.edges, "collection_date")}</td>
                                <td width="15%">{"Paid"}</td>
                                <td width="10%" className="order-actions">
                                    {/* <FontAwesomeIcon icon="fa-solid fa-pen-to-square" size='2xs' /> */}
                                    NA
                                </td>
                            </tr>
                        }
                    })}
                </table>
            </div>
        </div>
    );
}