import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import "./style.css";
import { Modal } from "../modal";
import { useState, useEffect } from "react";
import { AddLocation } from "../addLocation";
import { Loader } from "../loader";
import { ConfirmModal } from "../confirmModal";
import CustomTooltip from "../customToolTip/CustomToolTip";
import { useAuthenticatedFetch } from "../../hooks";
import {   toast } from 'react-toastify';

export function PickupLocations(props) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [editLocation, setEditLocation] = useState(null);
  const [merchantTags, setMerchantTags] = useState([]);
  const fetch = useAuthenticatedFetch();
   
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
        setIsLoading(false);
        getMerchantTags()
          .then(() => {
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
        setPickupLocations(response.data.data);
        props.setPickupLocations(response.data.data);
        setDataIntoData("merchant_locations", response.data.data);
      })
      .catch((error) => {
        setIsLoading(false);
        console.log(error);
      });
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
        "store-domain": localStorage.getItem("userData") ?  JSON.parse(localStorage.getItem("userData")).id   :"",
      }

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
          setDataIntoData("merchant_tags", response.data.data);
          resolve(response.data.data);
        })
        .catch((error) => {
          setIsLoading(false);
          reject(error);
          console.log(error,"pick up errro");
        });
    });
  };

  const deleteLocation = (element) => {
    setIsLoading(true);
    console.log("locationId==", element.id);
    const accessToken = localStorage.getItem("accessToken");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": "shopify_development",
      version: "3.1.1",
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      "store-domain": localStorage.getItem("userData") ?  JSON.parse(localStorage.getItem("userData")).id   :"",
    }
    const payload = {};
    axios
      .post(
        `${
          localStorage.getItem("isProduction") === "1"
            ? process.env.PROD_API_ENDPOINT
            : process.env.API_ENDPOINT
        }/api/wp/merchant_domain/location/delete/${element.id}`,
        payload,
        { headers: headers }
      )
      .then((response) => {
        setShowDeleteModal(false);
        getPickupLocations();
      })
      .catch((error) => {
        setIsLoading(false);
        console.log(error);
      });
  };

  useEffect(() => {
    if (showEditModal) {
      return;
    }
    getPickupLocations();
    getMerchantTags();
    
  }, [showEditModal]);

  function handleEditClick(location) {
    
    setEditLocation(location);
    setShowEditModal(true);
  }

  function handleDeleteClick(location) {
    setEditLocation(location);
    setShowDeleteModal(true);
  }

  function getTagNames(ids = "") {
    if (!ids) {
      return "";
    }
    //   console.log(ids,"ids")
    //   ids = JSON.parse(ids);
    //   console.log(ids,"ids")
    ids = ids.split(",").map(Number);

    var tags = merchantTags.filter((element) => ids.includes(element.id));
    // console.log(tags,"tags")
    var tagNames = [];
    for (const tag of tags) {
      tagNames.push(tag.name);
    }
    return tagNames.join(", ");
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

    if (showEditModal===false) {
      setEditLocation()
    }
    
  }, [ showEditModal,])
  
  useEffect(() => {

    if (showDeleteModal===false) {
      setEditLocation()
      
    }
    
  }, [ showDeleteModal])
  

  return (
    <div className="pickup-locations">
      {isLoading && <Loader />}
   
      <div className="pickup-head">
        <button className="submit-btn" onClick={() => setShowModal(true)}>
          Add New Location
        </button>
      </div>

      { editLocation && (
                      <>
                        <Modal className="full-screen-modal" showModal={showEditModal}  >
                          <AddLocation
                            setShowModal={setShowEditModal}
                             showModal={showModal}

                            getPickupLocations={getPickupLocations}
                            editLocation={editLocation}
                            {...props}
                          />
                        </Modal>
                        <ConfirmModal
                          showModal={showDeleteModal}
                          message="You want to delete location."
                          onConfirm={() => deleteLocation(editLocation)}
                          onCancel={() => setShowDeleteModal(false)}
                        />
                      </>
                    )}
      {showModal && (
        <Modal className="full-screen-modal" showModal={showModal}  >
          <AddLocation
            setShowModal={setShowModal}
            showModal={showModal}
            getPickupLocations={getPickupLocations}
            isDefaultLocationExist={
              pickupLocations?.filter((location) => location.is_default == 1)
                .length > 0
            }
            {...props}
          />
        </Modal>
      )}

      <div className="pickup-locations-table">
        <table> 
          <tr className="table-head">
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Suburb, Postcode, State</th>
            <th>Tags</th>
            <th>Free Shipping Postcodes</th>
            <th>Default</th>
            <th>Flat rate enabled</th>
            <th>Flat rate amount</th>
            <th>Flat rate postcodes</th>
            <th>Actions</th>
          </tr>
          {pickupLocations.length > 0 &&
            pickupLocations.map((element, i) => {
              return (
                <tr
                  className="products-row "
                  key={i}
                  style={{ background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF" }}
                >
                  <td>{element.id}</td>
                  <td>{element.location_name}</td>
                  <td>{element.phone}</td>
                  <td>{element.email}</td>
                  <td>
                    {element.suburb}, {element.postcode}, {element.state}
                  </td>
                  <td>{element.tag == "[]" ? "" : getTagNames(element.tag)}</td>
                  {/* <td>{element.tag == "[]" ? "" : getTagName(element.tag)}</td> */}
                  <td
                    // title={element?.free_shipping_postcodes}
                    style={{ cursor: "pointer" }}
                  >
                    <CustomTooltip
                      disabled={
                        JSON.parse(element?.free_shipping_postcodes)?.length ==
                        0
                      }
                      text={element?.free_shipping_postcodes}
                    >
                      {JSON.parse(element?.free_shipping_postcodes)?.length}
                    </CustomTooltip>
                  </td>
                  <td>{element.is_default == 1 ? "Yes" : "No"}</td>
                  <td>{element.is_flat_enable == 1 ? "Yes" : "No"}</td>
                  <td>
                    {element.is_flat_enable == 1 ? `$${element.flat_rate}` : ""}
                  </td>
                  <td>
                    {element.is_flat_enable == 1 ? (
                      <CustomTooltip
                        disabled={false}
                        text={element?.flat_shipping_postcodes}
                      >
                        <FontAwesomeIcon
                          icon="fa-solid fa-circle-info"
                          style={{
                            width: "17px",
                            height: "17px",
                          }}
                        />
                      </CustomTooltip>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="location-actions">
                    <FontAwesomeIcon
                      icon="fa-solid fa-pen-to-square"
                      size="2xs"
                      onClick={() => handleEditClick(pickupLocations[i])}
                    />
                    {element.is_default != 1 && (
                      <FontAwesomeIcon
                        icon="fa-solid fa-trash-can"
                        size="2xs"
                        onClick={() => handleDeleteClick(pickupLocations[i])}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
        </table>
      </div>
    </div>
  );
}
