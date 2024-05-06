import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import "./style.css";
import { useState, useEffect } from "react";
import { Loader } from "../loader";

export function OrderDetails(props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {

    }, []);

    return (
        <div className="order-details-main">
            {isLoading && <Loader />}
            <div className="order-details-container">
                <div className="order-details-head">
                    <div className="order-detail-heading">
                        Order Details
                    </div>
                    <div className="back-btn" onClick={() => navigate(-1)}>
                        Back
                    </div>
                </div>
                <div className="order-details">
                    <div className="order-info">
                        <div className="order-details-item">
                            <div className="order-details-name">
                                Order:
                            </div>
                            <div className="order-details-value">
                                #177
                            </div>
                        </div>
                        <div className="order-details-item">
                            <div className="order-details-name">
                                Store:
                            </div>
                            <div className="order-details-value">
                                test-development-fc
                            </div>
                        </div>
                        <div className="order-details-item">
                            <div className="order-details-name">
                                Payment Method:
                            </div>
                            <div className="order-details-value">
                                COD
                            </div>
                        </div>
                        <div className="order-details-item">
                            <div className="order-details-name">
                                Total:
                            </div>
                            <div className="order-details-value">
                                $658.14
                            </div>
                        </div>
                        <div className="order-details-item">
                            <div className="order-details-name">
                                Insurance Required:
                            </div>
                            <div className="order-details-value">
                                Not Required
                            </div>
                        </div>
                        <div className="order-details-item">
                            <div className="order-details-name">
                                Authoriry to Leave:
                            </div>
                            <div className="order-details-value">
                                False
                            </div>
                        </div>
                    </div>

                    <div className="delivery-address">
                        <div className="delivery-heading">
                            Delivery Address
                        </div>
                    </div>

                    <div className="delivery-address">
                        <div className="delivery-heading">
                            Shipping Address
                        </div>
                    </div>
                </div>

                <div className="shipment-details">
                    <div className="shipment-heading">
                        <span style={{ color: "#f76b00" }}>Shipment1</span>&nbsp;<span>Paid</span>
                    </div>
                    <div className="shipment-table">
                        <table>
                            <tr className="table-head">
                                <th>Item</th>
                                <th>SKU</th>
                                <th>Cost</th>
                                <th>Quantity</th>
                                <th>Tax</th>
                                <th>{"Weight (kg)"}</th>
                                <th>Dimesions</th>
                                <th>Shipping Required</th>
                                <th>Total</th>
                            </tr>
                            <tr className="table-body">
                                <td>Snowboard</td>
                                <td>SKU-item1</td>
                                <td>$50</td>
                                <td>1</td>
                                <td>NA</td>
                                <td>5kg</td>
                                <td>NA</td>
                                <td>Yes</td>
                                <td>$250</td>
                            </tr>
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
                            <tr className="table-body">
                                <td>Bottle</td>
                                <td>0.2</td>
                                <td>15 X 15 X 15</td>
                                <td>0</td>
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
                            <tr className="table-body">
                                <td>RNMEREGBVO</td>
                                <td>Hunter Express</td>
                                <td>$58.14</td>
                                <td>5-8 Business Days</td>
                                <td>Melbourne</td>
                                <td>85 elizabeth st</td>
                                <td>MELBOURNE, 3000 (VIC)</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}