import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import "./style.css";
import { useEffect, useState } from 'react';
import { useAppQuery, useAuthenticatedFetch } from "../../hooks";
import { Loader } from "../loader";
import { ErrorModal } from "../errorModal";

export function PaymentMethods(props) {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiryMonth, setExpiryMonth] = useState("");
    const [expiryYear, setExpiryYear] = useState("");
    const [cvc, setCvc] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [openErrorModal, setOpenErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [merchantDetails, setMerchantDetails] = useState(null);

    const fetch = useAuthenticatedFetch();


    const getMerchantDetails = async () => {
        setIsLoading(true);
        const accessToken = localStorage.getItem("accessToken");
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "request-type": process.env.REQUEST_TYPE,
            "version": "3.1.1",
            "Authorization": "Bearer " + accessToken
        }
        await axios.get(`${process.env.API_ENDPOINT}/api/wp/get_merchant`, { "headers": headers }).then(response => {
            console.log("merchantDetials", response.data.data);
            setMerchantDetails(response.data.data);
            setSelectedMethod(response.data.data.payment_method);
            setIsLoading(false);
        }).catch(error => {
            console.log(error);
            setIsLoading(false);
        })
    }

    const savePaymentMethod = async () => {

        try {
            setIsLoading(true);
            const accessToken = localStorage.getItem("accessToken");
            // const payload = props.activateApiPayload;
            console.log("activateApiPayload", props.activateApiPayload)

            const updatedPayload = {
                ...props.activateApiPayload,
                paymentMethod: selectedMethod
            };

            console.log("selectedMethod=", selectedMethod);
            console.log("payload=", updatedPayload);
            const headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "request-type": process.env.REQUEST_TYPE,
                "version": "3.1.1",
                "Authorization": "Bearer " + accessToken
            }
            await axios.post(`${process.env.API_ENDPOINT}/api/wp/activate`, updatedPayload, { "headers": headers }).then(response => {
                props.setActiveNavItem("pickupLocations");
                props.setActiveApiPayload(payload);
                localStorage.setItem("tailLiftValue", tailLiftValue);
                const carrierService = getCarrierSerice(carrierServices);
                if (carrierService == null) {
                    createCarrierService();
                }
                setIsLoading(false);
            }).catch(error => {
                console.log(error);
                setIsLoading(false);
            })

        } catch (error) {
            console.log("error==", error);
        }

    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        return isValid;
    }

    function validations() {
        if (cardNumber == "") {
            setErrorMessage("Please enter card number");
            return false;
        }

        if (expiryMonth == "") {
            setErrorMessage("Please enter expiry month");
            return false;
        }

        if (expiryYear == "") {
            setErrorMessage("Please enter expiry year");
            return false;
        }

        if (email == "" || !isValidEmail(email)) {
            setErrorMessage("Please enter valid email");
            return false;
        }

        if (name == "") {
            setErrorMessage("Please enter name");
            return false;
        }
        return true
    }

    const addPaymentMethod = () => {
        try {
            const isValid = validations();
            if (isValid) {
                const accessToken = localStorage.getItem("accessToken");
                setIsLoading(true);
                const headers = {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "request-type": process.env.REQUEST_TYPE,
                    "version": "3.1.1",
                    "Authorization": "Bearer " + accessToken
                }

                const payload = {
                    "number": cardNumber,
                    "exp_month": expiryMonth,
                    "exp_year": expiryYear,
                    "cvc": cvc,
                    "email": email,
                    "name": name,
                    "company": companyName,
                }
                axios.post(`${process.env.API_ENDPOINT}/api/wp/savePaymentMethod`, payload, { "headers": headers }).then(response => {
                    setPaymentMethods(response.data.data);
                    getPaymentMethods();
                    setIsLoading(false);
                }).catch(error => {
                    setIsLoading(false);
                    console.log(error);
                })
            } else {
                setOpenErrorModal(true);
            }

        } catch (error) {
            console.log("error", error);
        }
    }

    const getPaymentMethods = () => {
        const accessToken = localStorage.getItem("accessToken");
        setIsLoading(true);
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "request-type": process.env.REQUEST_TYPE,
            "version": "3.1.1",
            "Authorization": "Bearer " + accessToken
        }
        axios.get(`${process.env.API_ENDPOINT}/api/wp/payment_method`, { "headers": headers }).then(response => {
            setPaymentMethods(response.data.data);
            setIsLoading(false);
        }).catch(error => {
            setIsLoading(false);
            console.log(error);
        })
    }


    function handleCardNumberChange(e) {
        const input = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
        if (input.length <= 16) {
            setCardNumber(input);
        }
    }

    function handleCVCChange(e) {
        const input = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
        if (input.length <= 3) {
            setCvc(input);
        }
    }



    useEffect(() => {
        getPaymentMethods();
        getMerchantDetails();
        // getShippingRates();
    }, []);
    return (
        <div className="payment-methods">
            {isLoading && <Loader />}
            <ErrorModal showModal={openErrorModal} message={errorMessage} onConfirm={() => setOpenErrorModal(false)} />
            {!props.isStaging &&
                <>
                    <div className='add-payment-methods'>
                        <div className="input-row">
                            <div className="input-container1">
                                <div className="input-lebel1">
                                    <span> Card Number&nbsp;</span><span style={{ color: "red" }}> *</span>
                                </div>
                                <div className="input-field">
                                    <input className="input-field-text1" type="text" value={cardNumber} placeholder="Card Number" onChange={(e) => handleCardNumberChange(e)} />
                                </div>
                            </div>
                            <div className='expiry-section'>
                                <div className="input-container1">
                                    <div className="input-lebel1">
                                        <span> Expiry Month&nbsp;</span><span style={{ color: "red" }}> *</span>
                                    </div>
                                    <div className="input-field">
                                        {/* <input className="input-field-text1" type="text" value={expiryMonth} placeholder="MM" onChange={(e) => setExpiryMonth(e.target.value)} /> */}
                                        <select className="input-field-text1" onChange={(e) => setExpiryMonth(e.target.value)}>
                                            <option value="">Select</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                            <option value="6">6</option>
                                            <option value="7">7</option>
                                            <option value="8">8</option>
                                            <option value="9">9</option>
                                            <option value="10">10</option>
                                            <option value="11">11</option>
                                            <option value="12">12</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="input-container1">
                                    <div className="input-lebel1">
                                        <span> Expiry Year&nbsp;</span><span style={{ color: "red" }}> *</span>
                                    </div>
                                    <div className="input-field">
                                        {/* <input className="input-field-text1" type="text" value={name} placeholder="YY" onChange={(e) => setExpiryYear(e.target.value)} /> */}
                                        <select className="input-field-text1" onChange={(e) => setExpiryYear(e.target.value)} placeholder='Select'>
                                            <option value="">Select</option>
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                            <option value="2026">2026</option>
                                            <option value="2027">2027</option>
                                            <option value="2028">2028</option>
                                            <option value="2029">2029</option>
                                            <option value="2030">2030</option>
                                            <option value="2031">2031</option>
                                            <option value="2032">2032</option>
                                            <option value="2033">2033</option>
                                            <option value="2034">2034</option>
                                            <option value="2035">2035</option>
                                            <option value="2036">2036</option>
                                            <option value="2037">2037</option>
                                            <option value="2038">2038</option>
                                            <option value="2039">2039</option>
                                            <option value="2040">2040</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="input-container1">
                                    <div className="input-lebel1">
                                        <span> CVC&nbsp;</span><span style={{ color: "red" }}> *</span>
                                    </div>
                                    <div className="input-field">
                                        <input className="input-field-text1" type="text" value={cvc} placeholder="CVC" onChange={(e) => handleCVCChange(e)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="input-container1">
                                <div className="input-lebel1">
                                    <span> Email&nbsp;</span><span style={{ color: "red" }}> *</span>
                                </div>
                                <div className="input-field">
                                    <input className="input-field-text1" type="text" value={email} placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>
                            <div className="input-container1">
                                <div className="input-lebel1">
                                    <span> Name&nbsp;</span><span style={{ color: "red" }}> *</span>
                                </div>
                                <div className="input-field">
                                    <input className="input-field-text1" type="text" value={name} placeholder="Name" onChange={(e) => setName(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="input-container1">
                                <div className="input-lebel1">
                                    <span> Company Name&nbsp;</span>
                                </div>
                                <div className="input-field">
                                    <input className="input-field-text1" type="text" value={companyName} placeholder="Company Name" onChange={(e) => setCompanyName(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="submit">
                            <button className="submit-btn" onClick={() => addPaymentMethod()}>
                                Add New Card
                            </button>
                        </div>
                    </div>
                    <div className="pickup-locations-table">
                        <table>
                            <tr className="table-head">
                                <th>Payment Method</th>
                                <th>Card Number</th>
                                <th>Expiry</th>
                                <th>Actions</th>
                            </tr>
                            {paymentMethods.length > 0 && paymentMethods.map((method, i) => {
                                return <tr className='products-row' style={{ background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF" }}>
                                    <td width="25%">{method?.brand}</td>
                                    <td width="25%">{"XXXX XXXX XXXX " + method?.last4}</td>
                                    <td width="25%">{method?.exp_month + " / " + method?.exp_year}</td>
                                    <td width="25%"></td>
                                </tr>
                            })}
                        </table>
                    </div>
                </>
            }
            <div className="payment-heading">
                Payment Methods<span style={{ color: "red" }}> *</span>
            </div>
            <div className="payment-container">
                {paymentMethods.length > 0 && paymentMethods.map((method, i) => {
                    return <div className="payment-card">
                        <div className="payment-item-left">
                            <div className="input-radio">
                                <input type="radio" name="paymentMethod" id={method.card_id} value={method.card_id} onChange={(e) => setSelectedMethod(e.target.value)} checked={selectedMethod == method.card_id} />
                            </div>
                            {method.brand == "visa" &&
                                <FontAwesomeIcon icon="fa-brands fa-cc-visa" />
                            }
                        </div>
                        <div className="payment-item-right">
                            <div className='card-number'>
                                XXXX XXXX XXXX {method.last4}
                            </div>
                            <div className='card-details'>
                                <div className='card-name'>
                                    {method.brand}
                                </div>
                                <div className='card-expiry'>
                                    Exp: {method.exp_month}/{method.exp_year}
                                </div>
                            </div>
                        </div>
                    </div>
                })}
            </div>

            <div className="submit">
                <button className="submit-btn" onClick={() => savePaymentMethod()}>
                    Save details
                </button>
            </div>
        </div>
    );
}