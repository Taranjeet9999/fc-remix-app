import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import "./style.css";
import { Modal } from "../modal";
import { useState, useEffect } from "react";
import { AddLocation } from "../addLocation";
import { Loader } from "../loader";
import { ConfirmModal } from "../confirmModal";
import CustomTooltip from "../customToolTip/CustomToolTip";

export function PickupLocations(props) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [editLocation, setEditLocation] = useState(null);
  const [merchantTags, setMerchantTags] = useState([]);

  const getPickupLocations = () => {
    setIsLoading(true);
    const accessToken = localStorage.getItem("accessToken");
    const merchantDomainId = localStorage.getItem("merchantDomainId");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": process.env.REQUEST_TYPE,
      version: "3.1.1",
      Authorization: "Bearer " + accessToken,
    };
    axios
      .get(
        `${process.env.API_ENDPOINT}/api/wp/merchant_domain/locations/${merchantDomainId}`,
        { headers: headers }
      )
      .then((response) => {
        setIsLoading(false);
        setPickupLocations(response.data.data);
      })
      .catch((error) => {
        setIsLoading(false);
        console.log(error);
      });
  };

  const getMerchantTags = () => {
    setIsLoading(true);
    const accessToken = localStorage.getItem("accessToken");
    const merchantDomainId = localStorage.getItem("merchantDomainId");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": process.env.REQUEST_TYPE,
      version: "3.1.1",
      Authorization: "Bearer " + accessToken,
    };
    axios
      .get(
        `${process.env.API_ENDPOINT}/api/wp/merchant_location_tags/${merchantDomainId}`,
        { headers: headers }
      )
      .then((response) => {
        setIsLoading(false);
        setMerchantTags(response.data.data);
      })
      .catch((error) => {
        setIsLoading(false);
        console.log(error);
      });
  };

  const deleteLocation = (element) => {
    setIsLoading(true);
    console.log("locationId==", element.id);
    const accessToken = localStorage.getItem("accessToken");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": process.env.REQUEST_TYPE,
      version: "3.1.1",
      Authorization: "Bearer " + accessToken,
    };
    const payload = {};
    axios
      .post(
        `${process.env.API_ENDPOINT}/api/wp/merchant_domain/location/delete/${element.id}`,
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
    console.log("location==", location);
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

  return (
    <div className="pickup-locations">
      {isLoading && <Loader />}
      <div className="pickup-head">
        <button className="submit-btn" onClick={() => setShowModal(true)}>
          Add New Location
        </button>
      </div>
   {showModal&&   <Modal showModal={showModal} width="60%">
        <AddLocation
          setShowModal={setShowModal}
          getPickupLocations={getPickupLocations}
          {...props}
        />
      </Modal>}

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
            <th>Actions</th>
          </tr>
          {pickupLocations.length > 0 &&
            pickupLocations.map((element, i) => {
              return (
                <tr
                  className="locations"
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
                    disabled={JSON.parse(element?.free_shipping_postcodes)?.length==0}
                    text={element?.free_shipping_postcodes}
                    >

                    {JSON.parse(element?.free_shipping_postcodes)?.length}
                    </CustomTooltip>
                  </td>
                  <td>{element.is_default == 1 ? "Yes" : "No"}</td>
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
                    {editLocation?.id === element.id && (
                      <>
                        <Modal showModal={showEditModal} width="60%">
                          <AddLocation
                            setShowModal={setShowEditModal}
                            getPickupLocations={getPickupLocations}
                            editLocation={pickupLocations[i]}
                            {...props}
                          />
                        </Modal>
                        <ConfirmModal
                          showModal={showDeleteModal}
                          message="You want to delete location."
                          onConfirm={() => deleteLocation(pickupLocations[i])}
                          onCancel={() => setShowDeleteModal(false)}
                        />
                      </>
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
