import axios from "axios";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import "./style.css";
import { useState, useEffect } from "react";
import { Loader } from "../loader";
import { ErrorModal } from "../errorModal";
import Papa from "papaparse";
import { toast } from "react-toastify";
import { Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CustomTooltip from "../customToolTip/CustomToolTip";

export function AddLocation(props) {
  const [isLoading, setIsLoading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [buildingType, setBuildingType] = useState("residential");
  const [timeWindow, setTimeWindow] = useState("9am to 5pm");
  const [selectedState, setSelectedState] = useState("");
  const [selectedPostcode, setSelectedPostcode] = useState("");
  const [selectedSuburb, setSelectedSuburb] = useState("");
  const [tailLift, setTailLift] = useState("0");
  const [isDefaultLocation, setIsDefaultLocation] = useState("0");
  const [suburbs, setSuburbs] = useState([]);
  const [tags, setTags] = useState(null);
  const [merchantTags, setMerchantTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [freeShippingPoscodes, setFreeShippingPoscodes] = useState([]);
  const [freeShippingPoscodeOptions, setFreeShippingPoscodeOptions] = useState(
    []
  );
  const [suburbsLoading, setSuburbsLoading] = useState(false);
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [suburbData, setSuburbData] = useState([]);
  const [openErrorModal, setOpenErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFreeShippingCodes, setSelectedFreeShippingCodes] = useState(
    []
  );
 
  const [flatRateData, setFlatRateData] = useState({
    flatRate: "",
    flatRatePostCodes: "",
    flatRateEnabled: false,
    flatRateError: null,
    flatRatePostCodesError: null,
  })

  const buildingTypes = [
    {
      value: "residential",
      label: "Residential",
    },
    {
      value: "commercial",
      label: "Commercial",
    },
  ];

  const timeWindowList = [
    {
      value: "9am to 5pm",
      label: "9am to 5pm",
    },
    {
      value: "12pm to 5pm",
      label: "12pm to 5pm",
    },
  ];

  const tailLiftList = [
    {
      value: "0",
      label: "No",
    },
    {
      value: "1",
      label: "Yes",
    },
  ];

  const downloadCSV = () => {
    const url = PostcodesCSV; // Use the imported CSV file
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "filename.csv"); // Set the desired filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function getSuburbs(search = "") {
    const accessToken = localStorage.getItem("accessToken");
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
    await axios
      .get(
        `${
          localStorage.getItem("isProduction") === "1"
            ? process.env.PROD_API_ENDPOINT
            : process.env.API_ENDPOINT
        }/api/wp/suburbs?term=${search}`,
        { headers: headers }
      )
      .then((response) => {
        setSuburbData(response.data.data);
        var suburbList = [];
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
          suburbList.push(suburb);
        });

        setSuburbs(suburbList);
      })
      .catch((error) => {
        console.log(error);
      });
  }
  const [timeoutId, setTimeoutId] = useState(null);

  const handleInputChange = (e) => {
    const query = e.target.value;

    // Clear the previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    const newTimeoutId = setTimeout(async () => {
      setSuburbsLoading(true);
      getSuburbs(query)
        .then((data) => {
          // setSuburbs(data);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setSuburbsLoading(false);
        });
    }, 500); // 500ms delay

    setTimeoutId(newTimeoutId);
  };

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    return isValid;
  }

  function validations() {
    if (locationName == "") {
      setErrorMessage("Please enter location name");
      return false;
    }
    if (firstName == "") {
      setErrorMessage("Please enter first name");
      return false;
    }
    if (email == "" || !isValidEmail(email)) {
      setErrorMessage("Please enter valid email");
      return false;
    }
    if (phoneNumber == "" || phoneNumber.length < 10) {
      setErrorMessage("Please enter phone number");
      return false;
    }
    if (address1 == "") {
      setErrorMessage("Please enter address1");
      return false;
    }
    if (flatRateData.flatRateEnabled && flatRateData.flatRate === "") {
      setFlatRateData((prevValue) => ({
        ...prevValue,
        flatRateError: "Please enter flat rate",
      }));
      return false;
      
    }

    if (flatRateData.flatRateEnabled && flatRateData.flatRatePostCodes ==="") {
      setFlatRateData((prevValue) => ({
        ...prevValue,
        flatRatePostCodesError: "Please enter flat rate postcodes",
      }));
      return false;
    }
    if (flatRateData.flatRateEnabled && checkFlatRatePostCodesValidation(flatRateData.flatRatePostCodes)===false ) {
      setFlatRateData((prevValue) => ({
        ...prevValue,
        flatRatePostCodesError: "Please enter valid format",
      }));
      return false;
    }








    return true;
  }

  const addLocation = () => {
    try {
       const isValid = validations();
      if (isValid) {
        setIsLoading(true);
        const accessToken = localStorage.getItem("accessToken");
        const merchantDomainId = localStorage.getItem("merchantDomainId");
        const freeShippingCodes = selectedFreeShippingCodes.map(
          (element) => element.value
        );

        const payload = {
          location_name: locationName?? "",
          first_name: firstName?? "",
          last_name: lastName?? "",
          email: email?? "",
          phone: phoneNumber?? "",
          address1: address1?? "",
          address2: address2 ?? "",
          building_type: buildingType?? "",
          time_window: timeWindow?? "",
          suburb: selectedSuburb?? "",
          state: selectedState?? "",
          postcode: selectedPostcode?? "",
          is_default: isDefaultLocation?? "",
          tag: selectedTags.map((element) => element.value)?? "",
          free_shipping_postcodes: JSON.stringify(freeShippingCodes)?? "",
          merchant_domain_id: merchantDomainId?? "",
          tail_lift: tailLift?? "",
          longitude: "144.956776",
          latitude: "-37.817403",
          flat_shipping_postcodes : flatRateData.flatRatePostCodes ?? "",
flat_rate       : flatRateData.flatRate ?? "",
is_flat_enable  : flatRateData.flatRateEnabled ? 1 : 0,
        };
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

        const url = props.editLocation
          ? `${
              localStorage.getItem("isProduction") === "1"
                ? process.env.PROD_API_ENDPOINT
                : process.env.API_ENDPOINT
            }/api/wp/merchant_domain/location/edit/${props.editLocation.id}`
          : `${
              localStorage.getItem("isProduction") === "1"
                ? process.env.PROD_API_ENDPOINT
                : process.env.API_ENDPOINT
            }/api/wp/merchant_domain/locations/add`;
        axios
          .post(url, payload, { headers: headers })
          .then((response) => {
            props.getPickupLocations();
            props.setShowModal(false);
            setIsLoading(false);
            if (props.editLocation) {
              // toast.success('Location updated successfully', {
              //   autoClose: 4000,
              // });
            } else {
              // toast.success('Location created successfully', {
              //   autoClose: 4000,
              // });
            }
          })
          .catch((error) => {
            setIsLoading(false);
            console.log(error);
            toast.error("Something went wrong", {
              autoClose: 3000,
              closeOnClick: true,
            });
          });
      } else {
        setOpenErrorModal(true);
      }
    } catch (error) {
      setIsLoading(false);
      console.log(error);
      toast.error("Something went wrong", {
        autoClose: 3000,
        closeOnClick: true,
      });
    }
  };

  const setEditLocationData = (location) => {
    setLocationName(location.location_name ?? "");
    setFirstName(location.first_name ?? "");
    setLastName(location.last_name ?? "");
    setEmail(location.email ??"");
    setAddress1(location.address1 ??"");
    setAddress2(location.address2 ??"");
    setPhoneNumber(location.phone ??"");
    setBuildingType(location.building_type ??"");
    setTimeWindow(location.time_window ??"");
    setSelectedState(location.state ??"");
    setSelectedPostcode(location.postcode ??"");
    setSelectedSuburb(location.suburb ??"");
    setTailLift(location.tail_lift ??"");
    setIsDefaultLocation(location.is_default ??"");
    setFlatRateData((prevValue) => ({
      ...prevValue,
      flatRate: location.flat_rate ?? "",
      flatRatePostCodes: location.flat_shipping_postcodes ?? "",
      flatRateEnabled: Boolean(location.is_flat_enable) ,
    }));
    const freeShippingCodes = JSON.parse(location.free_shipping_postcodes)?.map(
      (element) => {
        return { value: element, label: element };
      }
    );

    setSelectedFreeShippingCodes(freeShippingCodes);
    setFreeShippingPoscodeOptions(freeShippingCodes);
    setLongitude(location.longitude);
    setLatitude(location.latitude);
  };
 
  function refreshModal() {
    setLocationName("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setAddress1("");
    setAddress2("");
    setPhoneNumber("");
    setBuildingType("residential");
    setTimeWindow("9am to 5pm");
    setSelectedState("");
    setSelectedPostcode("");
    setSelectedSuburb("");
    setTailLift("0");
    // setIsDefaultLocation("0");
    // setSuburbs([]);
    setTags(null);

    setSelectedFreeShippingCodes([]);
    setFreeShippingPoscodeOptions([]);
    setLongitude("");
    setLatitude("");
  }

  const getDefaultBuildingType = () => {
    var defaultValue = props.editLocation
      ? {
          value: props.editLocation.building_type,
          label:
            props.editLocation.building_type[0].toUpperCase() +
            props.editLocation.building_type.slice(1),
        }
      : {
          value: "residential",
          label: "Residential",
        };

    return defaultValue;
  };

  const getDefaultTimeWindow = () => {
    var defaultValue = props.editLocation
      ? {
          value: props.editLocation.time_window,
          label: props.editLocation.time_window,
        }
      : {
          value: "9am to 5pm",
          label: "9am to 5pm",
        };

    return defaultValue;
  };

  const getDefaultTailLift = () => {
    var defaultValue = props.editLocation
      ? {
          value: props.editLocation.tail_lift,
          label: props.editLocation.tail_lift == 0 ? "No" : "Yes",
        }
      : props.isDefaultLocationExist
      ? {
          value: "0",
          label: "No",
        }
      : {
          value: "1",
          label: "Yes",
        };

    return defaultValue;
  };

  const getDefaultLocation = () => {
    if (props.editLocation) {
      const isDefault = props.editLocation.is_default;

      return {
        value: isDefault,
        label: isDefault == 0 ? "No" : "Yes",
      };
    }

    if (props.isDefaultLocationExist) {
      return {
        value: "0",
        label: "No",
      };
    }

    return {
      value: "1",
      label: "Yes",
    };
  };

  useEffect(() => {
    if (props.showModal) {
      console.log("default location set")
      setIsDefaultLocation(getDefaultLocation().value);
    }
  }, [props.showModal, props.editLocation, props.isDefaultLocationExist]);

  const getDefaultSuburbValue = () => {
    var defaultValue = props.editLocation
      ? {
          value:
            props.editLocation.suburb +
            ", " +
            props.editLocation.postcode +
            " (" +
            props.editLocation.state +
            ")",
          label:
            props.editLocation.suburb +
            ", " +
            props.editLocation.postcode +
            "(" +
            props.editLocation.state +
            ")",
        }
      : null;
    return defaultValue;
  };

  const getDefaultTags = (_merchantTags) => {
    if (props?.editLocation) {
      let selected_tags = props.editLocation?.tag
        ? props.editLocation?.tag?.split(",")?.map(Number)
        : [];

      var tagValues = _merchantTags.filter((element) =>
        selected_tags?.includes(element.id)
      );
      var tags = [];
      tagValues.map((val, key) => {
        const tag = { value: val.name, label: val.name };
        tags.push(tag);
      });
      setSelectedTags(tags);
    } else {
      return null;
    }
  };

  const getMerchantTags = () => {
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
          }/api/wp/merchant_location_tags/${merchantDomainId}`,
          { headers: headers }
        )
        .then((response) => {
          setIsLoading(false);
          setMerchantTags(response.data.data);
          var tagsValue = [];
          response.data.data.map((element) => {
            var item = { value: element.name, label: element.name };
            tagsValue.push(item);
          });
          setTagOptions(tagsValue);
          resolve(response.data.data);
        })
        .catch((error) => {
          setIsLoading(false);
          console.log(error);
          reject(error);
        });
    });
  };

  const handleTagChange = (newValueArray) => {
    const valueExistsIndex = selectedTags.findIndex(
      (element) => element.value == newValueArray[0].value
    );
    let updated_selected_tags = [...selectedTags];
    if (valueExistsIndex > -1) {
      updated_selected_tags.splice(valueExistsIndex, 1);
    } else {
      updated_selected_tags.push({ ...newValueArray[0] });
    }
    setSelectedTags(updated_selected_tags);
  };

  const handleTagCreate = (newValueString) => {
    const newOption = { value: newValueString, label: newValueString };
    // check if Tags Already Exist
    const tagsExist = tagOptions.find(
      (element) => element.value == newValueString
    );
    if (tagsExist) {
      return;
    }
    if (tags !== null) {
      setTags([...tags, newValueString]);
    } else {
      setTags([newValueString]);
    }
    setTagOptions([...tagOptions, { ...newOption }]);
    // Set Selected Tag
    setSelectedTags([...selectedTags, { ...newOption }]);
  };

  const handleShippingCodesChange = (value) => {
    // var shippingCodeValue = freeShippingPoscodes.filter(
    //   (element) => element != value
    // );
    // setFreeShippingPoscodes(shippingCodeValue);
    // setFreeShippingPoscodeOptions(value);
  };

  const handleCsvInputChange = (e) => {
    Papa.parse(e.target.files[0], {
      header: true,
      skipEmptyLines: false,
      complete: async (result) => {
        const importData = result.data;
        const postcodes = importData.map((element) => element.Postcodes);
        const selectedShippingCodes = postcodes
          .filter((el) => el)
          .map((element) => {
            return { value: element, label: element };
          });
        setSelectedFreeShippingCodes(selectedShippingCodes);
      },
    });
  };

  useEffect(() => {
    getSuburbs();
    getMerchantTags().then((merchant_tags) => {
      if (props.editLocation) {
        setEditLocationData(props.editLocation);
        getDefaultTags(merchant_tags);
      } else {
        refreshModal();
      }
    });
  }, []);

  const handleDownload = () => {
    // Define the filename of the CSV file to be downloaded
    const filename = "sample.csv";
    // Construct the URL to the CSV file in the public folder
    const fileUrl = "/" + filename;
    // Trigger the download by creating a temporary link element
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="add-location-modal">
      {isLoading && <Loader />}
      {/* <ErrorModal
        showModal={openErrorModal}
        message={errorMessage}
        onConfirm={() => setOpenErrorModal(false)}
      /> */}
      <div className="modal-header d-flex justify-content-center">
        <div className="header-text">Pick Up Location</div>
      </div>
      <div className="modal-body p-3">
        <div className="input-row">
          <div className="input-container1">
            <div className="input-lebel1">
              <span> Location Name&nbsp;</span>
              <span style={{ color: "red" }}> *</span>
              {errorMessage != "" && locationName == "" && (
                <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
              )}
            </div>
            <div className="input-field highlight-input">
              <input
                className="input-field-text1"
                type="text"
                placeholder="Location Name"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
          </div>


       
         
       

          
        





        </div>
        <div className="input-row">
        <div className="input-container1">
            <div className="input-lebel1">
              <span> First Name&nbsp;</span>
              <span style={{ color: "red" }}> *</span>
              {errorMessage != "" && firstName == "" && (
                <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
              )}
            </div>
            <div className="input-field highlight-input">
              <input
                className="input-field-text1"
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
          </div>
          <div className="input-container1">
            <div className="input-lebel1">
              <span> Last Name&nbsp;</span>
              <span style={{ color: "red" }}> *</span>
              {errorMessage != "" && lastName == "" && (
                <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
              )}
            </div>
            <div className="input-field highlight-input">
              <input
                className="input-field-text1"
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>




          

        



        </div>
        <div className="input-row">
        <div className="input-container1">
            <div className="input-lebel1">
              <span> Email&nbsp;</span>
              <span style={{ color: "red" }}> *</span>
              {errorMessage != "" && (email == "" || !isValidEmail(email)) && (
                <span style={{ color: "red" }}>
                  {" "}
                  &nbsp; {"(Invalid email)"}
                </span>
              )}
            </div>
            <div className="input-field highlight-input">
              <input
                className="input-field-text1"
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="input-container1">
            <div className="input-lebel1">
              <span> Phone Number&nbsp;</span>
              <span style={{ color: "red" }}> *</span>
              {errorMessage != "" &&
                (phoneNumber == "" || phoneNumber?.length < 10) && (
                  <span style={{ color: "red" }}>
                    {" "}
                    &nbsp; {"(Min 10 chars)"}
                  </span>
                )}
            </div>
            <div className="input-field highlight-input">
              <input
                className="input-field-text1"
                type="text"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>



          
        






        </div>
        <div className="input-row">
        <div className="input-container1">
            <div className="input-lebel1">
              <span> Address 1&nbsp;</span>
              <span style={{ color: "red" }}> *</span>
              {errorMessage != "" && address1 == "" && (
                <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
              )}
            </div>
            <div className="input-field highlight-input">
              <input
                className="input-field-text1"
                type="text"
                placeholder="Address 1"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
              />
            </div>
          </div>
          <div className="input-container1">
            <div className="input-lebel1">
              <span> Address 2&nbsp;</span>
            </div>
            <div className="input-field highlight-input">
              <input
                className="input-field-text1"
                type="text"
                placeholder="Address 2"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
              />
            </div>
          </div>



          

        



        </div>
        <div className="input-row">

        <div className="input-container1">
            <div className="input-lebel1">
              <span> Suburb, Postcode, State</span>
              <span style={{ color: "red" }}> *</span>
              {errorMessage != "" && selectedSuburb == "" && (
                <span style={{ color: "red" }}> &nbsp; {"(Required)"}</span>
              )}
            </div>
            <Select
              options={suburbs}
              onChange={(e) => {
                const [, extractedCity, extractedPostcode, extractedState] =
                  e.value.match(/^(.*), (\d+) \((.*)\)$/);
                setSelectedSuburb(extractedCity);
                setSelectedPostcode(extractedPostcode);
                setSelectedState(extractedState);
                var element = suburbData.map(
                  (element) => element.postcode == extractedPostcode
                );
                setLongitude(element.longitude);
                setLatitude(element.latitude);
              }}
              defaultValue={getDefaultSuburbValue()}
              onInputChange={(e) => {
                handleInputChange({ target: { value: e } });
              }}
              loadingMessage={() => "Loading..."}
              isLoading={suburbsLoading}
            />
          </div>

        <div className="input-container1">
            <div className="input-lebel1">
              <span> Building Type&nbsp;</span>
              <span style={{ color: "red" }}> *</span>
            </div>
            <Select
              options={buildingTypes}
              onChange={(e) => setBuildingType(e.value)}
              defaultValue={getDefaultBuildingType()}
            />
          </div>




        







        </div>
        <div className="input-row">
        <div className="input-container1">
            <div className="input-lebel1">
              <span> Time Window&nbsp;</span>
              <span style={{ color: "red" }}> *</span>
            </div>
            <Select
              options={timeWindowList}
              onChange={(e) => setTimeWindow(e.value)}
              defaultValue={getDefaultTimeWindow()}
            />
          </div>
          <div className="input-container1">
            <div className="input-lebel1">
              <span> Is this your primary Pick up location&nbsp;</span>
              <span style={{ color: "red" }}> *</span>
            </div>

            <Select
              options={tailLiftList}
              onChange={(e) => setIsDefaultLocation(e.value)}
              defaultValue={getDefaultLocation()}
              isDisabled={props?.editLocation?.is_default == "1"}
            />
          </div>




       

        



        </div>
        <div className="input-row">

        <div className="input-container1">
            <div className="input-lebel1">
              <span> Tail Lift&nbsp;</span>
              <span style={{ color: "red" }}> *</span>
            </div>
            <Select
              options={tailLiftList}
              onChange={(e) => setTailLift(e.value)}
              defaultValue={getDefaultTailLift()}
            />
          </div>
          <div className="input-container1">
            <div className="input-lebel1">
              <span> Free Shipping Area Postcodes&nbsp;</span>
              <span>
        <CustomTooltip
                     toolTipStyle={{
                      fontSize:"14px",
                      width:"310px"
                     }}  
                      text={"Enter a postcode or postcode range to enable free shipping for these postcodes from this location"}
                    >
                      <FontAwesomeIcon
            icon="fa-solid fa-exclamation-circle"
            className="ml-2 pointer"
            style={{
              width: "14px",
              height: "14px",
            }}
            color="black" 
          />
                    </CustomTooltip>
         
        </span>
            </div>
            <CreatableSelect
              closeMenuOnSelect={false}
              isMulti
              options={freeShippingPoscodeOptions}
              value={selectedFreeShippingCodes}
              // onCreateOption={(value) => handleShippingCodesCreate(value)}
              onChange={(value) => setSelectedFreeShippingCodes(value)}
            />
          </div>
        
        </div>
        <div className="choose-file-row">
          <div className="input-field highlight-input">
            <input
              type="file"
              className="choose-file"
              accept=".csv"
              onChange={(e) => handleCsvInputChange(e)}
            />
          </div>
          <div
            className="sample-download"
            onClick={() => {
              handleDownload();
            }}
          >
            <a href="#"> Free Shipping Sample CSV </a>
          </div>
        </div>
        {/* FLAT RATE FUNCTIONALITY */}

        <div className="input-row">
          <div className="input-container1">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="fw-bold ">Apply Flat rate option : </div>
                <div className="text-muted">
                  By turning on this option, you can apply a flat rate to all
                  the orders that are placed for selected postcodes.
                </div>
              </div>
 
              <div>
                <Form>
                  <Form.Check
                    type="switch"
                    id="custom-switch"
                    label=""
                    className="flat-rate-switch"
                    checked={flatRateData.flatRateEnabled}
                    value={flatRateData.flatRateEnabled}
                    onChange={(e) => {
                      let value = e.target.checked;
                      setFlatRateData((prevValue) => ({
                        ...prevValue,
                        flatRateEnabled: value,
                      }));
                    }}
                  />
                </Form>
              </div>
            </div>
          </div>
        </div>

        {flatRateData.flatRateEnabled && (
          <>
            <div className="input-row">
              <div className="input-container1">
                <div className="input-lebel1">
                  <span> Flat Rate&nbsp;</span>
                  <span style={{ color: "red" }}> *</span>
                  {flatRateData.flatRateError && (
                    <span className="f-error">&nbsp;  &nbsp;({flatRateData.flatRateError})</span>
                  )}
                </div>
                <div className="input-field highlight-input">
                  <input
                    className="input-field-text1"
                    type="number"
                    placeholder="Flat Rate"
                    value={flatRateData.flatRate}
                    onChange={(event) => {
                      const regex = /^[0-9]*$/;
                      const newValue = event.target.value;
                      if (regex.test(newValue)) {
                        setFlatRateData((prevValue) => ({
                          ...prevValue,
                          flatRate: newValue,
                          flatRateError: null,
                        }));
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="input-row">
              <div className="input-container1">
                <div className="input-lebel1">
                  <span> Flat Rate Shipping postcodes&nbsp;</span>
                  <span style={{ color: "red" }}> *</span>
                  <span className="pl-2 pointer parent-visible">
                    <span
                      className="text-muted "
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      More info
                    </span> &nbsp;
                    <span className="pointer">
                      <FontAwesomeIcon
                        icon="fa-solid fa-circle-info"
                        style={{
                          width: "12px",
                          height: "12px",
                        }}
                      />
                    </span>
                    <span className="child-visible">
                      <span>
                        <img  
                        src="/flat-rate-screenshot.jpg"
                        />
                      </span>

                    </span>
                  </span>


                  {flatRateData.flatRatePostCodesError && (
                  <span style={{ color: "red" }}>
                   &nbsp;
                   &nbsp;
                   
                    ({flatRateData.flatRatePostCodesError})
                  </span>
                )}








                </div>

                <div className="input-field highlight-input">
                  <textarea
                    className="w-100"
                    rows="5"
                    placeholder="Comma seperated postcodes or postcode range
                 1111 , 2222, 3333,
                 3000-4000,
                 5000-6000"
                    value={flatRateData.flatRatePostCodes}
                    onChange={(event) => {
                      const regex = /^[0-9, -]*$/;
                      const newValue = event.target.value;
                      if (regex.test(newValue)) {
                        setFlatRateData((prevValue) => ({
                          ...prevValue,
                          flatRatePostCodes: newValue,
                          flatRatePostCodesError: null,
                        }));
                      }
                    }}
                  />
                </div>
               
              </div>
            </div>
          </>
        )}
      </div>
      <div className="modal-footer">
        <button
          className="cancel-btn"
          onClick={() => props.setShowModal(false)}
        >
          Close
        </button>
        <button className="submit-btn" onClick={() => addLocation()}>
          Submit
        </button>
      </div>
    </div>
  );
}

function isPostCodeIncludedInFlatRate(postCode, flatRatePostCodes = 
  "1000,2000,300-800"
) {
  const postCodes = flatRatePostCodes.split(",");
  for (let i = 0; i < postCodes.length; i++) {
    const postCodeRange = postCodes[i].split("-");
    if (postCodeRange.length === 1) {
      if (postCode === parseInt(postCodes[i])) {
        return true;
      }
    } else if (postCodeRange.length === 2) {
      const start = parseInt(postCodeRange[0]);
      const end = parseInt(postCodeRange[1]);
      if (postCode >= start && postCode <= end) {
        return true;
      }
    }
  }
  return false;
} 

function checkFlatRatePostCodesValidation(flat_shipping_postcodes){
  const postCodes = flat_shipping_postcodes.split(",");
  for (let i = 0; i < postCodes.length; i++) {
    const postCodeRange = postCodes[i].split("-");
    if (postCodeRange.length === 1) {
      if (isNaN(parseInt(postCodes[i]))) {
        return false;
      }
    } else if (postCodeRange.length === 2) {
      if (isNaN(parseInt(postCodeRange[0])) || isNaN(parseInt(postCodeRange[1]))) {
        return false;
      }
    }
  }
  return true;
}