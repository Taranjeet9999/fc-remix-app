import { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import "./style.css";
import { Loader } from "../loader";
import { ErrorModal } from "../errorModal";
import { useAppQuery, useAuthenticatedFetch } from "../../hooks";

export function MerchantBillingDetails(props) {
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingCompanyName, setBillingCompanyName] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAbn, setBillingAbn] = useState("");
  const [billingAddress1, setBillingAddress1] = useState("");
  const [billingAddress2, setBillingAddress2] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");
  const [billingSuburb, setBillingSuburb] = useState("");
  const [bookingPreference, setBookingPreference] = useState("");
  const [fallbackAmount, setFallbackAmount] = useState(50);
  const [insuranceType, setInsuranceType] = useState("");
  const [isInsurancePaidByCustomer, setIsInsurancePaidByCustomer] = useState(0);
  const [automaticOrderProcess, setAutomaticOrderProcess] = useState(0);
  const [conditionalValue, setConditionalValue] = useState("");
  const [insuranceAmount, setInsuranceAmount] = useState("");
  const [processAfterMinutes, setProcessAfterMinutes] = useState(60);
  const [processAfterDays, setProcessAfterDays] = useState(0);
  const [isDropOffTailLift, setIsDropOffTailLift] = useState(false);
  const [tailLiftValue, setTailLiftValue] = useState(30);
  const [suburbs, setSuburbs] = useState([]);
  const [defaultSuburb, setDefaultSuburb] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [activeCouriers, setActiveCouriers] = useState([]);
  // const [shoppingPreference, setShoppingPreference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [carrierServices, setCarrierServices] = useState(null);
  const [openErrorModal, setOpenErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCourierPref, setSelectedCourierPref] = useState([]);
  const [categoryOfGoods, setCategoryOfGoods] = useState([]);
  const [selectedGoods, setSelectedGoods] = useState(null);
  const [errors, setErrors] = useState({
    billingFirstNameError: "",
    billingLastNameError: "",
    billingCompanyNameError: "",
    billingPhoneError: "",
    billingEmailError: "",
    billingAbnError: "",
    billingAddress1Error: "",
    billingSuburbError: "",
    bookingPreferenceError: "",
    fallbackAmountError: "",
    courierPreferencesError: "",
    categoryOfGoodsError: "",
  });

  async function validations() {
    let count_of_errros = 0;
    let _errors = {
      billingFirstNameError: null,
      billingLastNameError: null,
      billingCompanyNameError: null,
      billingPhoneError: null,
      billingEmailError: null,
      billingAbnError: null,
      billingAddress1Error: null,
      billingSuburbError: null,
      bookingPreferenceError: null,
      fallbackAmountError: null,
      courierPreferencesError: null,
      categoryOfGoodsError: null,
    };
    if (!billingFirstName) {
      count_of_errros++;
      _errors.billingFirstNameError = "Please enter first name.";
      // setErrorMessage("Please enter first name.");
    }
    if (!billingLastName) {
      count_of_errros++;
      _errors.billingLastNameError = "Please enter last name.";
    }
    if (!billingCompanyName) {
      count_of_errros++;
      _errors.billingCompanyNameError = "Please enter company name.";
    }
    if (!billingPhone) {
      count_of_errros++;
      _errors.billingPhoneError = "Please enter phone.";
    }
    if (!billingEmail) {
      count_of_errros++;
      _errors.billingEmailError = "Please enter email.";
    }
    if (!billingAddress1) {
      count_of_errros++;
      _errors.billingAddress1Error = "Please enter address1.";
    }
    if (!billingSuburb) {
      count_of_errros++;
      _errors.billingSuburbError = "Please enter suburb.";
    }
    if (!bookingPreference) {
      count_of_errros++;
      _errors.bookingPreferenceError = "Please select booking preference.";
    }
    if (!fallbackAmount || fallbackAmount < 50) {
      count_of_errros++;
      _errors.fallbackAmountError = "Please enter fallback amount.";
    }
    if (selectedCourierPref?.length == 0 || selectedCourierPref === null) {
      count_of_errros++;
      _errors.courierPreferencesError = "Please select courier preferences.";
    }

    if (!billingAbn) {
      count_of_errros++;
      _errors.billingAbnError = "Please enter ABN.";
    }

    if (selectedGoods?.length == 0 || selectedGoods === null) {
      count_of_errros++;
      _errors.categoryOfGoodsError = "Please select category of goods.";
    }
    setErrors(_errors);
    return count_of_errros;
  }

  const fetch = useAuthenticatedFetch();
  async function setDataIntoData(columnName, data) {
    const response = await fetch("/api/add-data-into-table", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        columnName: columnName,
        data: data,
      }),
    });
  }

  const [showCategoryGoods, setShowCategoryGoods] = useState(false);
  const [showSuburbModal, setShowSuburbModal] = useState(false);

  const getMerchantDetails = (categories) => {
    setIsLoading(true);
    const accessToken = localStorage.getItem("accessToken");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": process.env.REQUEST_TYPE,
      version: "3.1.1",
      Authorization: "Bearer " + accessToken,
    };
    axios
      .get(`${localStorage.getItem("isProduction")==="1"?process.env.PROD_API_ENDPOINT : process.env.API_ENDPOINT}/api/wp/get_merchant`, {
        headers: headers,
      })
      .then((response) => {
        setDataIntoData("merchant", response.data.data);
        if (response.data.data.billing_suburb) {
          setShowSuburbModal(false);
          setDefaultSuburb({
            value:
              response.data.data.billing_suburb +
              ", " +
              response.data.data.billing_postcode +
              " (" +
              response.data.data.billing_state +
              ")",
            label:
              response.data.data.billing_suburb +
              ", " +
              response.data.data.billing_postcode +
              "(" +
              response.data.data.billing_state +
              ")",
          });
        }
        setShowCategoryGoods(false);
        // Set default selected goods
        let selected_value = JSON.parse(response.data.data.categories_of_goods);

        setSelectedGoods(
          categories.filter((item) => selected_value?.includes(item.value))
        );
        setMerchantDetails(response.data.data);
        props.setMerchantDetails(response.data.data);
        setIsLoading(false);
        setShowCategoryGoods(true);
        setShowSuburbModal(true);
      })
      .catch((error) => {
        console.log(error, "get_merchanhte-ERROR");
        setIsLoading(false);
      });
  };

  const getCategoryOfGoods = () => {
    setIsLoading(true);
    const accessToken = localStorage.getItem("accessToken");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": process.env.REQUEST_TYPE,
      version: "3.1.1",
      Authorization: "Bearer " + accessToken,
    };
    axios
      .get(`${localStorage.getItem("isProduction")==="1"?process.env.PROD_API_ENDPOINT : process.env.API_ENDPOINT}/api/wp/categories_of_goods`, {
        headers: headers,
      })
      .then((response) => {
        setShowCategoryGoods(false);
        var categories = [];
        response.data.data.forEach((element) => {
          var category = { value: element.id, label: element.category };
          categories.push(category);
        });

        setCategoryOfGoods(categories);
        getMerchantDetails(categories);
        setIsLoading(false);
        setShowCategoryGoods(true);
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const saveMerchant = async (merchantDetails) => {
    const response = await fetch("/api/save-merchant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(merchantDetails),
    });
  };

  const getMerchant = async () => {
    const response = await fetch("/api/get-merchant", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const getCarriers = async () => {
    const response = await fetch("/api/carrier-services", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json(); 
    setCarrierServices(data.data);
    //filter the fast courier carreir service and get Id and update the carrier service
    const filteredCarrierService = data.data.filter(
      (item) => item.name === "Fast Courier"
    );
    
    if (filteredCarrierService.length > 0) {
      const maxIdObject = filteredCarrierService.reduce((max, item) => item.id > max.id ? item : max, filteredCarrierService[0]);
     if (maxIdObject.callback_url ==="https://fc-app.vuwork.com/api/shipping-rates") {
      return
     }
     
      updateCarrierService(maxIdObject.id);
    } else {
      // create a coueir service and then update it
      createAndUpdateCarrierService();
    }
  };

  function getDefaultGoods() {
    const values = selectedGoods?.map((element, i) => {
      return categoryOfGoods[element];
    });
    return values;
  }

  function setMerchantDetails(merchant) {
    setBillingFirstName(merchant.billing_first_name);
    setBillingLastName(merchant.billing_last_name);
    setBillingCompanyName(merchant.billing_company_name);
    setBillingPhone(merchant.billing_phone);
    setBillingEmail(merchant.billing_email);
    setBillingAbn(merchant.abn);
    setBillingAddress1(merchant.billing_address_1);
    setBillingAddress2(merchant.billing_address_2);
    setBillingState(merchant.billing_state);
    setBillingPostcode(merchant.billing_postcode);
    setBillingSuburb(merchant.billing_suburb);
    setBookingPreference(merchant.booking_preference);
    setFallbackAmount(merchant.fallback_amount);
    setInsuranceType(merchant.insurance_type);
    setIsInsurancePaidByCustomer(merchant.is_insurance_paid_by_customer);
    setConditionalValue(merchant.conditional_price);
    setInsuranceAmount(merchant.insurance_amount);
    setIsDropOffTailLift(merchant.is_drop_off_tail_lift);
    if (merchant.courier_preferences) {
      const carriers = JSON.parse(merchant.courier_preferences);
      setSelectedCourierPref(carriers);
    }
    // const tailLiftWeight = localStorage.getItem("tailLiftValue");
    // setTailLiftValue(tailLiftWeight);
    setTailLiftValue(merchant.weight <30 ? 30 : merchant.weight);
  }

  const getSuburbs = () => {
    const accessToken = localStorage.getItem("accessToken");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": process.env.REQUEST_TYPE,
      version: "3.1.1",
      Authorization: "Bearer " + accessToken,
    };
    axios
      .get(`${localStorage.getItem("isProduction")==="1"?process.env.PROD_API_ENDPOINT : process.env.API_ENDPOINT}/api/wp/suburbs`, { headers: headers })
      .then((response) => {
        var suburbData = [];
        response.data.data.forEach((element) => {
          var suburb = {
            value:
              element.name +
              ", " +
              element.postcode +
              " (" +
              element.state +
              ")",
            label:
              element.name +
              ", " +
              element.postcode +
              "(" +
              element.state +
              ")",
          };
          suburbData.push(suburb);
        });

        setSuburbs(suburbData);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getCouriers = () => {
    const accessToken = localStorage.getItem("accessToken");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": process.env.REQUEST_TYPE,
      version: "3.1.1",
      Authorization: "Bearer " + accessToken,
    };
    axios
      .get(`${localStorage.getItem("isProduction")==="1"?process.env.PROD_API_ENDPOINT : process.env.API_ENDPOINT}/api/wp/couriers`, { headers: headers })
      .then((response) => {
        setCouriers(response.data.data);
        var courierIds = [];
        courierIds = response.data.data.map((element) => element.id.toString());
        setActiveCouriers(courierIds);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const activateMerchant = async () => {
    try {
      const isValid = await validations();
      if (isValid === 0) {
        setIsLoading(true);
        const accessToken = localStorage.getItem("accessToken");
        const merchantDomainId = localStorage.getItem("merchantDomainId");
        const payload = {
          id: merchantDomainId,
          billingFirstName: billingFirstName,
          billingLastName: billingLastName,
          billingCompanyName: billingCompanyName,
          billingPhone: billingPhone,
          billingEmail: billingEmail,
          abn: billingAbn,
          packageType: "box",
          billingAddress1: billingAddress1,
          billingAddress2: billingAddress2,
          billingSuburb: billingSuburb,
          billingState: billingState,
          billingPostcode: billingPostcode,
          conditionalPrice: conditionalValue,
          courierPreferences: selectedCourierPref,
          bookingPreference: bookingPreference,
          isInsurancePaidByCustomer: isInsurancePaidByCustomer ? 1 : 0,
          fallbackAmount: fallbackAmount,
          insuranceType: insuranceType,
          insuranceAmount: insuranceAmount,
          isDropOffTailLift: isDropOffTailLift,
          tailLiftValue: tailLiftValue,
          weight: tailLiftValue,
          isAuthorityToLeave: "0",
          processAfterMinutes: processAfterMinutes,
          processAfterDays: processAfterDays,
          automaticOrderProcess: automaticOrderProcess,
          shoppingPreference: "show_shipping_price_with_carrier_name",
          action: "post_activate_mechant",
          paymentMethod: "pm_1O9jNICodfiDzZhka9lcNse4",
          categoriesOfGoods: selectedGoods ?? [],
        };
        props.setActiveApiPayload(payload);
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          "request-type": process.env.REQUEST_TYPE,
          version: "3.1.1",
          Authorization: "Bearer " + accessToken,
        };
        await axios
          .post(`${localStorage.getItem("isProduction")==="1"?process.env.PROD_API_ENDPOINT : process.env.API_ENDPOINT}/api/wp/activate`, payload, {
            headers: headers,
          })
          .then((response) => {
            saveUpdateMerchant(response.data.data);
            setDataIntoData("merchant", response.data.data);
            props.setMerchantDetails(response.data.data);

            console.log(response.data.data, "response.data.data");
            props.setActiveNavItem("paymentMethods");
            localStorage.setItem("tailLiftValue", tailLiftValue);
            const carrierService = getCarrierSerice(carrierServices);
            if (carrierService == null) {
              createCarrierService();
            }
            setIsLoading(false);
          })
          .catch((error) => {
            console.log(error);
            setIsLoading(false);
          });
      } else {
        // setOpenErrorModal(true);
      }
    } catch (error) {
      console.log("error==", error);
    }
  };

  const getCarrierSerice = (data) => {
    const item = data.find((obj) => obj.name === "Fast Courier");
    return item ?? null;
  };

  const createCarrierService = () => {
    return new Promise(async (resolve, reject) => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/carrier-service/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            package_name: "Fast Courier",
          }),
        });
        const data = await response.json();
        setIsLoading(false);
        console.log(data, "data");
        resolve(data);
      } catch (err) {
        setIsLoading(false);
        console.log(err);
        reject(err);
      }
    });
  };

  function createAndUpdateCarrierService() {
    createCarrierService().then((data) => {
      updateCarrierService(data.id);
    });
  }

  // const updateCarrierService = async (_id) => {

    
  //   try {
  //     setIsLoading(true);
  //     const response = await fetch("/api/carrier-service/update", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         package_name: "Fast Courier",
  //         id: _id,
  //       }),
  //     });
  
  //     if (!response.ok) {
  //       console.log(response, "response");
  //       console.log(response, "response");
  //       console.log(response, "response");
  //       console.log(response, "response");
  //       console.log(response, "response");
  //       console.log(response, "response");
      
  //       throw new Error(`API call failed with status: ${response.status}`);
  //     }
  
  //     const data = await response.json();
  //     setIsLoading(false);
  //   } catch (err) {
  //     setIsLoading(false);
  //     console.log(err);
  //   }
  // };

  const updateCarrierService = async (_id) => {
    const controller = new AbortController();
    const signal = controller.signal;
  
    const fetchWithTimeout = (url, options, timeout = 10000) => {
      return Promise.race([
        fetch(url, { ...options, signal }),
        new Promise((_, reject) =>
          setTimeout(() => {
            controller.abort();
            reject(new Error("Request timed out"));
        console.log("SUCCESS");
        createAndUpdateCarrierService()
        setIsLoading(false);
          }, timeout)
        ),
      ]);
    };
  
    try {
      setIsLoading(true);
      const response = await fetchWithTimeout("/api/carrier-service/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_name: "Fast Courier",
          id: _id,
        }),
      }, 10000);
  
      if (!response.ok) {
        console.log("SUCCESS");
        // await createAndUpdateCarrierService();
        throw new Error(`Error: ${response.statusText}`);
      }
  
      const data = await response.json();
      // Handle data if needed
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  
  const deleteCarrierService = async (_id) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/carrier-service/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_name: "Fast Courier",
          id: _id,
        }),
      });
      const data = await response.json();
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  const handleCourierChange = (e) => {
    const courierIds = selectedCourierPref.includes(e.target.value)
      ? selectedCourierPref.filter((item) => item !== e.target.value)
      : [...selectedCourierPref, e.target.value];

    setSelectedCourierPref(courierIds);
  };

  function handleCategoryChange(categorData) {
    const categoryIds = categorData.map((element, i) => {
      return element.value;
    });
    setSelectedGoods(categoryIds);
  }

  useEffect(() => {
    getCouriers();
    getSuburbs();
    getCarriers();
   // deleteCarrierService()
    getCategoryOfGoods(); // LIST OF CATEGORY OF GOODS
    //updateCarrierService()
    // createCarrierService()
    setMerchantTags();
    setPickupLocations()
  }, []);

  async function saveUpdateMerchant(merchantDetails) {
    const response = await fetch("/api/save-merchant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(merchantDetails),
    });
  }

  const setMerchantTags = () => {
    return new Promise((resolve, reject) => {
    
      const accessToken = localStorage.getItem("accessToken");
      const merchantDomainId = localStorage.getItem("merchantDomainId");

      if (!accessToken || !merchantDomainId) {
        return;
      }
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        "request-type": process.env.REQUEST_TYPE,
        version: "3.1.1",
        Authorization: "Bearer " + accessToken,
      };

      axios
        .get(
          `${localStorage.getItem("isProduction")==="1"?process.env.PROD_API_ENDPOINT : process.env.API_ENDPOINT}/api/wp/merchant_location_tags/${merchantDomainId}`,
          { headers: headers }
        )
        .then((response) => {
          setDataIntoData("merchant_tags", response.data.data);
          resolve(response.data.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const setPickupLocations = () => {
    
    const accessToken = localStorage.getItem("accessToken");
    const merchantDomainId = localStorage.getItem("merchantDomainId");

    if (!accessToken || !merchantDomainId) {
      return;
    }
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": process.env.REQUEST_TYPE,
      version: "3.1.1",
      Authorization: "Bearer " + accessToken,
    };
    axios
      .get(
        `${localStorage.getItem("isProduction")==="1"?process.env.PROD_API_ENDPOINT : process.env.API_ENDPOINT}/api/wp/merchant_domain/locations/${merchantDomainId}`,
        { headers: headers }
      )
      .then((response) => {
        setDataIntoData("merchant_locations", response.data.data);
      })
      .catch((error) => {
        setIsLoading(false);
        console.log(error);
      });
  };

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
        props.setIsStaging(props.executeSandboxStatus.value === "1" ? false : true);
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
          data: data
        }),
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(error => {
            throw new Error(`Error: ${error.message}`);
          });
        }
        return response.json();
      })
      .then(responseData => {
        resolve(responseData);
      })
      .catch(error => {
        console.error("Error:", error);
        reject(error);
      });
    });
  }
  useEffect(() => {
    if (props.executeSandboxStatus.execute == "sandbox") {
      setIsLoading(true);
      setDataIntoData("is_production", JSON.parse(props.executeSandboxStatus.value)).then(()=>{
        localStorage.setItem("isProduction", JSON.parse(props.executeSandboxStatus.value));
        logOutUser()
      })
    }
   
  }, [props.executeSandboxStatus])

  return (
    <div className="merchant-main">
      {isLoading && <Loader />}
      <ErrorModal
        showModal={openErrorModal}
        message={errorMessage}
        onConfirm={() => setOpenErrorModal(false)}
      />
      <div className="merchant-heading1">Merchant Billing Details</div>
      <div className="input-row">
        <div className="input-container1">
          <div className="input-lebel1">
            <span> First Name&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errors.billingFirstNameError && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="input-field">
            <input
              className="input-field-text1"
              type="text"
              value={billingFirstName}
              placeholder="First Name"
              onChange={(e) => setBillingFirstName(e.target.value)}
            />
          </div>
        </div>
        <div className="input-container1">
          <div className="input-lebel1">
            <span> Last Name&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errors.billingLastNameError && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="input-field">
            <input
              className="input-field-text1"
              type="text"
              value={billingLastName}
              placeholder="Last Name"
              onChange={(e) => setBillingLastName(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="input-row">
        <div className="input-container1">
          <div className="input-lebel1">
            <span> Company Name&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errors.billingCompanyNameError && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="input-field">
            <input
              className="input-field-text1"
              type="text"
              value={billingCompanyName}
              placeholder="Company Name"
              onChange={(e) => setBillingCompanyName(e.target.value)}
            />
          </div>
        </div>
        <div className="input-container1">
          <div className="input-lebel1">
            <span> Contact Phone Number&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errors.billingPhoneError && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="input-field">
            <input
              className="input-field-text1"
              type="number"
              value={billingPhone}
              placeholder="Contact Phone Number"
              onChange={(e) => setBillingPhone(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="input-row">
        <div className="input-container1">
          <div className="input-lebel1">
            <span> Email&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errors.billingEmailError && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="input-field">
            <input
              className="input-field-text1"
              type="text"
              value={billingEmail}
              placeholder="Email"
              onChange={(e) => setBillingEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="input-container1">
          <div className="input-lebel1">
            <span> ABN&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errors.billingAbnError && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="input-field">
            <input
              className="input-field-text1"
              type="text"
              value={billingAbn}
              placeholder="ABN"
              onChange={(e) => setBillingAbn(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="input-row">
        <div className="input-container1">
          <div className="input-lebel1">
            <span> Address 1&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errors.billingAddress1Error && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="input-field">
            <input
              className="input-field-text1"
              type="text"
              value={billingAddress1}
              placeholder="Address 1"
              onChange={(e) => setBillingAddress1(e.target.value)}
            />
          </div>
        </div>
        <div className="input-container1">
          <div className="input-lebel1">
            <span> Address 2</span>
          </div>
          <div className="input-field">
            <input
              className="input-field-text1"
              type="text"
              value={billingAddress2}
              placeholder="Address 2"
              onChange={(e) => setBillingAddress2(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="input-row">
        <div className="input-container1">
          <div className="input-lebel1">
            <span> Suburb&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errors.billingSuburbError && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          {/* {defaultSuburb != null && ( */}
          {showSuburbModal && (
            <Select
              options={suburbs}
              onChange={(e) => {
                const [, extractedCity, extractedPostcode, extractedState] =
                  e.value.match(/^(.*), (\d+) \((.*)\)$/);
                setBillingSuburb(extractedCity);
                setBillingPostcode(extractedPostcode);
                setBillingState(extractedState);
              }}
              defaultValue={defaultSuburb}
            />
          )}
          {/* )} */}
        </div>
      </div>
      <div className="shipping-config">
        <div className="shipping-left">
          <div className="merchant-heading1">Shipping Configuration</div>
          <div className="shipping-label">
            <span> Set your shipping costs preferences&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
          </div>
          <div className="input-radio">
            <input
              type="radio"
              name="bookingPreference"
              id="freeForAllOrders"
              value="free_for_all_orders"
              checked={bookingPreference == "free_for_all_orders"}
              onChange={(e) => setBookingPreference(e.target.value)}
            />
            <label htmlFor="freeForAllOrders">&nbsp;Free For All orders</label>
          </div>
          <div className="input-radio">
            <input
              type="radio"
              name="bookingPreference"
              id="freeForBasketValue"
              value="free_for_basket_value_total"
              checked={bookingPreference == "free_for_basket_value_total"}
              onChange={(e) => setBookingPreference(e.target.value)}
            />
            <label htmlFor="freeForBasketValue">
              &nbsp;Free for Orders with Prices{" "}
            </label>
            {bookingPreference == "free_for_basket_value_total" && (
              <span className="conditional-price">
                {"> "}
                <input
                  type="type"
                  name="conditionalPrice"
                  className="input-field-text1"
                  value={conditionalValue}
                  onChange={(e) => setConditionalValue(e.target.value)}
                />
              </span>
            )}
          </div>
          <div className="input-radio">
            <input
              type="radio"
              name="bookingPreference"
              id="notFree"
              value="shipping_cost_passed_on_to_customer"
              checked={
                bookingPreference == "shipping_cost_passed_on_to_customer"
              }
              onChange={(e) => setBookingPreference(e.target.value)}
            />
            <label htmlFor="notFree">
              &nbsp;All Shipping Costs Passed on to Customer
            </label>
          </div>
        </div>
        <div className="shipping-right">
          <div className="shipping-label">
            <span> Fallback Shipping Amount&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errors.fallbackAmountError && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          <div className="shipping-label1">
            <span>
              {" "}
              On occasions where no carrier can be found set a default shipping
              price&nbsp;
            </span>
          </div>
          <div className="input-field">
            <input
              className="input-field-text1"
              type="number"
              value={fallbackAmount}
              onChange={(e) => setFallbackAmount(e.target.value)}
              onBlur={()=>{
                if(fallbackAmount<50){
                  setFallbackAmount(50)
                }
              
              }}
            />
          </div>
        </div>
      </div>
      <div className="courier-preference">
        <div className="merchant-heading1">Courier Preferences</div>
        <div className="shipping-label">
          <span> Active Couriers&nbsp;</span>
          <span style={{ color: "red" }}> *</span>
          {errors.courierPreferencesError && (
            <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
          )}
        </div>
        <div className="courier-preference-items">
          {activeCouriers.length > 0 &&
            couriers.map((courier, i) => {
              return (
                <div className="input-checkbox" key={i}>
                  <input
                    type="checkbox"
                    name={courier.id}
                    id={courier.id}
                    value={courier.id}
                    onChange={(e) => handleCourierChange(e)}
                    checked={selectedCourierPref?.includes(
                      courier.id.toString()
                    )}
                  />
                  <label htmlFor={courier.id}>&nbsp;{courier.name}</label>
                </div>
              );
            })}
        </div>
      </div>
      <div className="input-row">
        <div className="input-container1">
          <div className="input-lebel1">
            <span> Category of Goods Sold&nbsp;</span>
            <span style={{ color: "red" }}> *</span>
            {errors.categoryOfGoodsError && (
              <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
            )}
          </div>
          {showCategoryGoods && (
            <Select
              defaultValue={selectedGoods ?? []}
              isMulti
              name="colors"
              options={categoryOfGoods}
              className="basic-multi-select"
              classNamePrefix="select"
              onChange={(e) => handleCategoryChange(e)}
            />
          )}
        </div>
      </div>
      <div className="insurance-preferences">
        <div className="merchant-heading1">Insurance Preferences</div>
        <div className="shipping-label">
          <span> Insurance Types&nbsp;</span>
          <span style={{ color: "red" }}> *</span>
        </div>
        <div className="input-radio">
          <input
            type="radio"
            name="insuranceType"
            id="notRequired"
            value="1"
            onChange={(e) => setInsuranceType(e.target.value)}
            checked={insuranceType == "1"}
          />
          <label htmlFor="notRequired">
            &nbsp;Complimentary Coverage - No Additional Charge
          </label>
        </div>
        <div className="input-radio">
          <input
            type="radio"
            name="insuranceType"
            id="requiredUpto"
            value="2"
            onChange={(e) => setInsuranceType(e.target.value)}
            checked={insuranceType == "2"}
          />
          <label htmlFor="requiredUpto">
            &nbsp;Transit Insurance Coverage up to $
          </label>
          {insuranceType == 2 && (
            <span className="conditional-price">
              {"> "}
              <input
                type="type"
                name="insuranceAmount"
                className="input-field-text1"
                value={insuranceAmount}
                onChange={(e) => setInsuranceAmount(e.target.value)}
              />
            </span>
          )}
        </div>
        <div className="input-radio">
          <input
            type="radio"
            name="insuranceType"
            id="fullCartValue"
            value="3"
            onChange={(e) => setInsuranceType(e.target.value)}
            checked={insuranceType == "3"}
          />
          <label htmlFor="fullCartValue">
            &nbsp;Full Insurance Coverage of Shipment Value (Max. $10,000 AUD)
          </label>
        </div>
        <div className="input-checkbox">
          <input
            type="checkbox"
            name="isInsurancePaidByCustomer"
            id="isInsurancePaidByCustomer"
            onChange={(e) => setIsInsurancePaidByCustomer(e.target.checked)}
            checked={isInsurancePaidByCustomer == "1"}
          />
          <label htmlFor="isInsurancePaidByCustomer">
            &nbsp;Insurance cost passed onto customer
          </label>
        </div>
      </div>
      {/* <div className="settings">
                <div className="merchant-heading1">
                    Settings
                </div>
                <div className="shipping-label">
                    <span> Order processing&nbsp;</span><span style={{ color: "red" }}> *</span>
                </div>
                <div className="input-radio">
                    <input type="radio" name="automaticOrderProcess" id="auto" value="1" checked={automaticOrderProcess == 1} onChange={(e) => setAutomaticOrderProcess(e.target.value)} />
                    <label htmlFor="auto">&nbsp;Auto</label>
                    {
                        automaticOrderProcess == "1" &&
                        <span className="conditional-price">
                            {" > "}<input type="type" name="processAfterMinutes" className="input-field-text1" value={processAfterMinutes} onChange={(e) => setProcessAfterMinutes(e.target.value)} /> <span>minutes</span>
                        </span>
                    }
                </div>
                <div className="input-radio">
                    <input type="radio" name="automaticOrderProcess" id="manual" value="0" checked={automaticOrderProcess == 0} onChange={(e) => setAutomaticOrderProcess(e.target.value)} />
                    <label htmlFor="manual">&nbsp;Manual</label>
                </div>
            </div> */}
      <div className="input-checkbox">
        <input
          type="checkbox"
          name="isDropOffTailLift"
          id="isDropOffTailLift"
          value={isDropOffTailLift}
          onChange={(e) => setIsDropOffTailLift(e.target.checked)}
          checked={isDropOffTailLift}
        />
        <label htmlFor="isDropOffTailLift">
          &nbsp;Default tail lift on delivery
        </label>
        {isDropOffTailLift == true && (
          <span className="conditional-price">
            {"> It will only apply for packages over "}
            <input
              type="type"
              name="tailLiftValue"
              className="input-field-text1"
              value={tailLiftValue}
              onChange={(e) => setTailLiftValue(e.target.value)}
              onBlur={()=>{
                if(tailLiftValue<30){
                  setTailLiftValue(30)
                }
              
              }}
            />{" "}
            {" Kgs."}
          </span>
        )}
      </div>

      <div className="submit">
        <button className="submit-btn" onClick={() => activateMerchant()}>
          Save details
        </button>
      </div>
    </div>
  );
}
