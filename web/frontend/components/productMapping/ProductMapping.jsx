import "./style.css";
import { Modal } from "../modal";
import axios from "axios";
import { useEffect, useState } from "react";
import { AddLocation } from "../addLocation";
import { ErrorModal } from "../errorModal";
import { useAppQuery, useAuthenticatedFetch } from "../../hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Loader } from "../loader";
import { ConfirmModal } from "../confirmModal";
import Papa from "papaparse";
import { csv } from "csvtojson";
import { locationMetafields } from "../../globals";

export function ProductMapping() {
  const [showShippingBoxesModal, setShowShippingBoxesModal] = useState(false);
  const [showAddShippingBoxModal, setShowAddShippingBoxModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAssignLocationModal, setShowAssignLocationModal] = useState(false);
  const [showDimensionsModal, setshowDimensionsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [merchantTags, setMerchantTags] = useState([]);
  const [packageTypes, setPackageTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [variantMetafields, setVariantMetafields] = useState([]);
  const [locationBy, setLocationBy] = useState("name");
  const [locationName, setLocationName] = useState("");
  const [packageType, setPackageType] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [isIndividual, setIsIndividual] = useState("Yes");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [showError, setShowError] = useState(false);
  const [addLocationSubmit, setAddLocationSubmit] = useState(false);
  const [dimensionCount, setDimensionCount] = useState(1);
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProductType, setSelectedProductType] = useState("all");
  const [productData, setProductData] = useState([]);
  const [shippingPackageName, setShippingPackageName] = useState("");
  const [shippingPackageType, setShippingPackageType] = useState("");
  const [shippingPackageHeight, setShippingPackageHeight] = useState("");
  const [shippingPackageLength, setShippingPackageLength] = useState("");
  const [shippingPackageWidth, setShippingPackageWidth] = useState("");
  const [isDefaultShippingPackage, setIsDefaultShippingPackage] =
    useState("No");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [openProductIds, setOpenProductIds] = useState([]);
  const [showImportDimensionsModal, setShowImportDimensionsModal] =
    useState(false);
  const [csvData, setCsvData] = useState(null);
  const [dataArray, setDataArray] = useState([]);
  const [products, setProducts] = useState(null);
  const [shippingBoxes, setShippingBoxes] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const fetch = useAuthenticatedFetch();

  const getAllProducts = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/products`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json(); 

    if(data){

      const formattedProducts = formatProductData(data.body.data.products);
      console.log("formattedproducts", formattedProducts);
  
      setProducts(formattedProducts);
      setIsLoading(false);

    }
  };
  function getProductIdFromGID(gid) {
    const parts = gid.split("/"); // Split the URL by '/'
    const productId = parts[parts.length - 1];
    return productId;
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

  // const getVariantMeta = async () => {
  //     const response = await fetch(
  //         `/api/variant-metafields`,
  //         {
  //             method: "GET",
  //             headers: {
  //                 'Content-Type': 'application/json',
  //             },
  //         },
  //     );

  //     const data = await response.json();
  //     console.log("variantmetafields", data.data);
  //     setVariantMetafields(data.data);
  // }

  const getShippingBoxes = async () => {
    const response = await fetch(`/api/shipping-boxes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    setShippingBoxes(data);
  };

  useEffect(() => {
    getShippingBoxes();
    getAllProducts();
    // getVariantMeta();
  }, []);

  // const uniqueTags = new Set();
  // const uniqueCategories = new Set();

  // Iterate over the products and add tags to the Set
  

  // products?.forEach((product) => {
  //   if (product.tags) {
  //     // product.tags.split(",").forEach((tag) => {
  //       uniqueTags.add(getLocationtagName(product.tags ));
  //     // });
  //   }
  //   if (product.product_type) {
  //     product.product_type.split(",").forEach((tag) => {
  //       uniqueCategories.add(tag.trim());
  //     });
  //   }
  // });

  // Convert Set to an array for rendering
  // const uniqueTagsArray = Array.from(uniqueTags);
  // const uniqueCategoriesArray = Array.from(uniqueCategories);

  // const getProducts = products?.map(item1 => {
  //     const matchingItem2 = data?.body?.data?.products?.edges.find(item2 => item2.node.id.includes(item1.id));
  //     return { ...item1, ...matchingItem2 };
  // });

  useEffect(() => {
    var productItems = products;
    var data = productItems?.filter((element) =>
      selectedTag == "all" ? true : element.tags.includes(selectedTag)
    );
    setProductData(data);
  }, [selectedTag]);

  useEffect(() => {
    var productItems = products;
    var data = productItems?.filter((element) =>
      selectedCategory == "all"
        ? true
        : element.product_type.includes(selectedCategory)
    );
    setProductData(data);
  }, [selectedCategory]);

  useEffect(() => {
    getMerchantTags();
    getPackageTypes();
    getPickupLocations();
  }, []);

  const handleCsvInputChange = (e) => {
    setCsvData(e.target.files[0]);
  };

  const [importDimensionError, setImportDimensionError] = useState('')
  useEffect(() => {
    setImportDimensionError("")
  }, [showImportDimensionsModal])
  

  const importDimensions = async () => {
    setIsLoading(true);
    try {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: false,
        complete: async (result) => {
          setDataArray(result.data);
          const importData = result.data; 
          const productIds = importData.map((element) => {
            const product = products?.find((element1) => {
              return element?.SKU == element1?.variants?.[0]?.sku;
            });
            if(product?.id){

              return product?.id;
            }
          });
          if(productIds?.length > 0){
            const element = importData[0];
            // importData.map(async (element) => {
            const response = await fetch("/api/product/add-dimensions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                package_type: element["Package Type"],
                height: element.Height,
                width: element.Width,
                length: element.Length,
                weight: element.Weight,
                isIndividual: element.Individual,
                product_ids:  productIds,
              }),
            });
    
            // })
            getAllProducts();
            setIsLoading(false);
            setShowImportDimensionsModal(false);

          }else{

            setImportDimensionError('No Products found')
            setIsLoading(false);
          }
        },
      });
      
    } catch (error) {
      console.log("import dmensions error",error)
    }
  };

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
        setLocations(response.data.data);
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

  const getPackageTypes = () => {
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
      .get(`${process.env.API_ENDPOINT}/api/wp/package_types`, {
        headers: headers,
      })
      .then((response) => {
        setIsLoading(false);
        setPackageTypes(response.data.data);
      })
      .catch((error) => {
        setIsLoading(false);
        console.log(error);
      });
  };

  const selectProduct = (e) => {
    const productIds = selectedProducts.includes(e.target.value)
      ? selectedProducts.filter((item) => item !== e.target.value)
      : [...selectedProducts, e.target.value];
    setSelectedProducts(productIds);

  };

  const selectVariant = (e) => {
    const variantIds = selectedVariants.includes(e.target.value)
      ? selectedVariants.filter((item) => item !== e.target.value)
      : [...selectedVariants, e.target.value];
    setSelectedVariants(variantIds);
  };

  const handleSelectAll = (e) => {
     
    var selectedProductIds = e.target.checked
      ? products.map((element) => element.id.toString())
      : [];
    setSelectedProducts(selectedProductIds);


    var selectedVariantIds = e.target.checked
      ? products.map((element) => element.variants.map((variant) => variant.id))
      : [];
    setSelectedVariants(selectedVariantIds.flat());
     
  };

  const assignLocation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/product/add-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_name: locationName,
          product_ids: selectedProducts,
          variant_ids: selectedVariants,
        }),
       
      });
       
      if (response) {
console.log(response,"responseeeeeee")
        
      }
      getAllProducts();
      setIsLoading(false);
      setShowAssignLocationModal(false);
      setSelectedProducts([]);
      setSelectedVariants([]);
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  function dimensionValidations() {
    if (packageType == "") {
      setErrorMessage("Please select package type.");
      return false;
    }
    if (height == "") {
      setErrorMessage("Please select package type.");
      return false;
    }
    if (width == "") {
      setErrorMessage("Please select package type.");
      return false;
    }
    if (length == "") {
      setErrorMessage("Please select package type.");
      return false;
    }
    if (weight == "") {
      setErrorMessage("Please select package type.");
      return false;
    }
    return true;
  }

  const assignDimensions = async () => {
    try {
      const isValid = dimensionValidations();
      if (isValid) {
        setIsLoading(true);
        await fetch("/api/product/add-dimensions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            package_type: packageType,
            height: height,
            width: width,
            length: length,
            weight: weight,
            isIndividual: isIndividual,
            product_ids: selectedProducts,
            variant_ids: selectedVariants,
          }),
        });
        getAllProducts();
        setIsLoading(false);
        setshowDimensionsModal(false);
        setSelectedProducts([]);
        setSelectedVariants([]);
      }
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  const dimensionDivsArray = Array.from(
    { length: dimensionCount },
    (_, index) => index
  );

  const extractNumericId = (gid) => {
    const numericId = gid.split("/").pop();
    return numericId;
  };

  const handleLocationChange = (e) => {
    let locationJson= {...locationMetafields}
    locationJson.type = locationBy;
    locationJson.value = JSON.parse(e.target.value);

    setLocationName(locationJson);
  };

  function closeAddShippingBoxModal() {
    setShowAddShippingBoxModal(false);
    setShippingForm();
  }

  function setShippingForm() {
    setShippingPackageName("");
    setShippingPackageType("");
    setShippingPackageHeight("");
    setShippingPackageLength("");
    setShippingPackageWidth("");
    setIsDefaultShippingPackage("No");
  }

  function validations() {
    if (shippingPackageName == "") {
      setErrorMessage("Please enter package name");
      return false;
    }
    if (shippingPackageType == "") {
      setErrorMessage("Please select package type");
      return false;
    }
    if (shippingPackageHeight == "") {
      setErrorMessage("Please select package height");
      return false;
    }
    if (shippingPackageWidth == "") {
      setErrorMessage("Please select package width");
      return false;
    }
    if (shippingPackageLength == "") {
      setErrorMessage("Please select package length");
      return false;
    }
    return true;
  }

  const createShippingBox = async () => {
    try {
      const isValid = validations();
      if (isValid) {
        setIsLoading(true);
        await fetch("/api/shipping-box/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            package_name: shippingPackageName,
            package_type: shippingPackageType,
            height: shippingPackageHeight,
            width: shippingPackageWidth,
            length: shippingPackageLength,
            is_default: isDefaultShippingPackage,
          }),
        });
        setIsLoading(false);
        getShippingBoxes();
        closeAddShippingBoxModal();
      }
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  const deleteShippingBox = async (shippingBox) => {
    try {
      setIsLoading(true);
      await fetch("/api/shipping-box/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shippingBox),
      });
      setIsLoading(false);
      getShippingBoxes();
      setShowConfirmModal(false);
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  const resetFilters = () => {
    setProductSearchString('')
    return;
    setSelectedCategory("all");
    setSelectedTag("all");
  };

  const getProductMetaField = (metafields, keyValue) => {
    var location = metafields?.find((element) => element.key == keyValue);
    return location != undefined ? location.value : null;
  };

  const handleFreeShippingChange = async (e, id) => {
    const checked = e.target.checked;
    try {
      setIsLoading(true);
      await fetch("/api/free-shipping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: id,
          isFreeShipping: checked,
        }),
      });
      getAllProducts();
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  const openVariableProduct = (id) => {
    const variableProducts = openProductIds.includes(id)
      ? openProductIds.filter((item) => item !== id)
      : [...openProductIds, id];
    setOpenProductIds(variableProducts);
  };


  useEffect(() => {
     if(showDimensionsModal){
      // setPackageType("bag")
      setLength("")
      setWidth("")
      setHeight("")
      setWeight("")
      setIsIndividual("Yes")
      setErrorMessage("")
    }
  }, [showDimensionsModal])
  useEffect(() => {
    if (showAddShippingBoxModal) {
      setErrorMessage("")
       
    }
  }, [showAddShippingBoxModal])
  
  const handleDownloadCSV = () => {
    // Define the filename of the CSV file to be downloaded
    const filename = 'dimensions-sample.csv';
    // Construct the URL to the CSV file in the public folder
    const fileUrl =  '/' + filename;
    // Trigger the download by creating a temporary link element
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  function getLocationtagName(tagData){
    
    
    try {
      let _tagData = JSON.parse(tagData)
    
      if (typeof _tagData == 'string') {
        return ''
        
      }
      
      if(_tagData.type == 'name'){
        let IsLocationExistForLoginUser = locations.find((element) => element.id == _tagData.value.id)
        if(!IsLocationExistForLoginUser){
          return ""
        }
        return _tagData.value.location_name
      
      }
      if(_tagData.type == 'tag'){

        let IsTagExistForLoginUser = merchantTags.find((element) => element.id == _tagData.value.id)
        if(!IsTagExistForLoginUser){
          return ""
        }
        return _tagData.value.name
      }
    } catch (error) {
      console.log(error,"error")
      return""
    }

  }
  const [productSearchString, setProductSearchString] = useState('')
  return (
    <div className="product-mapping">

       
      {isLoading && <Loader />}
      <div className="product-header">
        
        <div className="product-map-filters align-items-end">
          {/* <div className="input-container">
                        <div className="input-lebel">
                            <span> Keywords&nbsp;</span>
                        </div>
                        <div className="input-field">
                            <input className="input-field-text" type="text" />
                        </div>
                    </div> */}
            {false &&        <>
          <div className="input-container">
            <div className="input-lebel">
              <span> Category&nbsp;</span>
            </div>
            <div className="input-field">
              <select
                className="input-field-text"
                type="text"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All</option>
                {/* {uniqueCategoriesArray.map((element, i) => {
                  return <option value={element}>{element}</option>;
                })} */}
              </select>
            </div>
          </div>
          <div className="input-container">
            <div className="input-lebel">
              <span> Tags&nbsp;</span>
            </div>
            <div className="input-field">
              <select
                className="input-field-text"
                type="text"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="all">All</option>
                {/* {uniqueTagsArray.map((element, i) => {
                  return <option value={element}>{element}</option>;
                })} */}
              </select>
            </div>
          </div></>}
          <div className="input-container mr-2">
          <div className="input-lebel">
            <span> Product Name&nbsp;</span>
          </div>
          <div className="input-field1">
            <input
              className="input-field-text"
              type="text"
              placeholder="Product"
              onChange={(e) =>{
                setProductSearchString(e.target.value)
              }
                // setFilterData({ ...filterData, orderId: e.target.value })

              }
              value={productSearchString}
            />
          </div>
        </div>
          <div className="input-container mr-2">
            <div className="input-lebel">
              <span> Product Type&nbsp;</span>
            </div>
            <div className="input-field">
              <select
                className="input-field-text"
                type="text"
                value={selectedProductType}
                onChange={(e) => setSelectedProductType(e.target.value)}
              >
                <option value="all">All</option>
                {/* <option value="simple">Simple</option>
                <option value="virtual">Virtual</option>
                <option value="variable">Variable</option> */}
              </select>
            </div>
          </div>
          <div className="filter-buttons">
            {/* <button className="fc-yellow-btn pointer"> Filter </button> */}
            <button onClick={() => resetFilters()}> Reset </button>
          </div>
        </div>
        
        <div className="product-actions">
          <button
            className="submit-btn"
            onClick={() => setShowShippingBoxesModal(true)}
          >
            Shipping Boxes
          </button>
          <button
            className="submit-btn"
            onClick={() =>
              selectedProducts.length > 0 || selectedVariants.length > 0
                ? setshowDimensionsModal(true)
                : setShowError(true)
            }
          >
            Manually Assign Dimensions
          </button>
          <button
            className="submit-btn"
            onClick={() =>
              selectedProducts.length > 0 || selectedVariants.length > 0
                ? setShowAssignLocationModal(true)
                : setShowError(true)
            }
          >
            Assign Location
          </button>
          <button
            className="submit-btn"
             
            onClick={() =>
            
               setShowImportDimensionsModal(true)
                
            }
          >
            Import Dimensions
          </button>
        </div>
      </div>
      <Modal showModal={showImportDimensionsModal} width="40%">
        <div className="import-dimesions">
          <div className="modal-header">
            <div className="shipping-heading">
              Import dimensions & weight for product(s)
            </div>
          </div>
          <div className="modal-body">
            <div className="choose-file-row">
              <div className="input-field">
                <input
                  type="file"
                  className="choose-file"
                  accept=".csv"
                  onChange={(e) => handleCsvInputChange(e)}
                />
              </div>
              <div className="sample-download"
              onClick={()=>{
                handleDownloadCSV()
              }}
              
              >
                <a
                  href="#"
                  download={true}
                >
                  {" "}
                  Sample CSV{" "}
                </a>
              </div>
            </div>

            {importDimensionError&&
            <div className="error-message">
              {importDimensionError}
            </div>
            
            
            
            
            }
          </div>
          <div className="modal-footer">
            <div
              className="cancel-btn"
              onClick={() => setShowImportDimensionsModal(false)}
            >
              Close
            </div>
            <div className="submit-btn" onClick={() => importDimensions()}>
              Import
            </div>
          </div>
        </div>
      </Modal>
      <Modal showModal={showShippingBoxesModal} width="60%">
        {isLoading && <Loader />}
        <div className="shipping-boxes">
          <div className="modal-header">
            <div className="shipping-heading">Shipping Boxes</div>
            <div
              className="submit-btn"
              onClick={() => setShowAddShippingBoxModal(true)}
            >
              Add Shipping Box
            </div>
            <Modal showModal={showAddShippingBoxModal} width="40%">
              {isLoading && <Loader />}
              <div className="add-shipping-box">
                <div className="modal-header">
                  <div className="shipping-heading">Add Shipping Box</div>
                </div>
                <div className="modal-body">
                  <div className="input-container">
                    <div className="input-lebel">
                      <span> Package Name&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                      {errorMessage != "" && shippingPackageName == "" && (
                        <span style={{ color: "red" }}>
                          &nbsp; {"(Required)"}
                        </span>
                      )}
                    </div>
                    <div className="input-field">
                      <input
                        className="input-field-text1"
                        placeholder="Package Name"
                        type="text"
                        value={shippingPackageName}
                        onChange={(e) => setShippingPackageName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-container">
                    <div className="input-lebel">
                      <span> Package Types&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                      {errorMessage != "" && shippingPackageType == "" && (
                        <span style={{ color: "red" }}>
                          &nbsp; {"(Required)"}
                        </span>
                      )}
                    </div>
                    <div className="input-field">
                      <select
                        className="input-field-text1"
                        type="text"
                        onChange={(e) => setShippingPackageType(e.target.value)}
                      >
                        <option>Select package type</option>
                        {packageTypes.length > 0 &&
                          packageTypes.map((element, i) => {
                            return (
                              <option value={element.name}>
                                {element.name}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>
                  <div className="input-lebel">
                    <span> Dimensions&nbsp;</span>
                  </div>
                  <div className="input-row">
                    <div className="input-container1">
                      <div className="input-lebel1">
                        <span> Height&nbsp;</span>
                        <span style={{ color: "red" }}> *</span>
                        {errorMessage != "" && shippingPackageHeight == "" && (
                          <span style={{ color: "red" }}>
                            &nbsp; {"(Required)"}
                          </span>
                        )}
                      </div>
                      <div className="input-field">
                        <input
                          className="input-field-text1"
                          type="number"
                          placeholder="Height"
                          value={shippingPackageHeight}
                          onChange={(e) =>
                            setShippingPackageHeight(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="input-container1">
                      <div className="input-lebel1">
                        <span> Length&nbsp;</span>
                        <span style={{ color: "red" }}> *</span>
                        {errorMessage != "" && shippingPackageLength == "" && (
                          <span style={{ color: "red" }}>
                            &nbsp; {"(Required)"}
                          </span>
                        )}
                      </div>
                      <div className="input-field">
                        <input
                          className="input-field-text1"
                          type="number"
                          placeholder="Length"
                          value={shippingPackageLength}
                          onChange={(e) =>
                            setShippingPackageLength(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="input-container1">
                      <div className="input-lebel1">
                        <span> Width&nbsp;</span>
                        <span style={{ color: "red" }}> *</span>
                        {errorMessage != "" && shippingPackageWidth == "" && (
                          <span style={{ color: "red" }}>
                            &nbsp; {"(Required)"}
                          </span>
                        )}
                      </div>
                      <div className="input-field">
                        <input
                          className="input-field-text1"
                          type="number"
                          placeholder="Width"
                          value={shippingPackageWidth}
                          onChange={(e) =>
                            setShippingPackageWidth(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="input-row">
                    <div className="input-container1">
                      <div className="input-lebel1">
                        <span> Default&nbsp;</span>
                        <span style={{ color: "red" }}> *</span>
                      </div>
                      <div className=" "
                      style={{
                        width:'100%',
                        display: 'flex',
                        /* justify-content: center, */
                        marginTop: '10px',
                      }}
                      >
                        <input
                          type="radio"
                          name={"isDefault"}
                          id={"yes"}
                          value="Yes"
                          onChange={(e) =>
                            setIsDefaultShippingPackage(e.target.value)
                          }
                          checked={isDefaultShippingPackage == "Yes"}
                        />
                        <label htmlFor={"yes"}>&nbsp;Yes</label>
                        <input
                          type="radio"
                          name={"isDefault"}
                          id={"no"}
                          value="No"
                          onChange={(e) =>
                            setIsDefaultShippingPackage(e.target.value)
                          }
                          checked={isDefaultShippingPackage == "No"}
                        />
                        <label htmlFor={"no"}>&nbsp;No</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <div
                    className="submit-btn"
                    onClick={() => createShippingBox()}
                  >
                    Submit
                  </div>
                  <div
                    className="cancel-btn"
                    onClick={() => closeAddShippingBoxModal()}
                  >
                    Close
                  </div>
                </div>
              </div>
            </Modal>
          </div>
          <div className="modal-body">
            <table>
              <tr className="table-head">
                <th>Name</th>
                <th>Type</th>
                <th>Length</th>
                <th>Width</th>
                <th>Height</th>
                <th>Default</th>
                <th>Actions</th>
              </tr>
              {shippingBoxes?.length > 0 &&
                shippingBoxes.map((element, i) => {
                  return (
                    <tr
                      className="products-row"
                      style={{ background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF" }}
                    >
                      <td>{element.package_name}</td>
                      <td>{element.package_type}</td>
                      <td>{element.length}</td>
                      <td>{element.width}</td>
                      <td>{element.height}</td>
                      <td>{element.is_default}</td>
                      <td className="location-actions">
                        <FontAwesomeIcon
                          icon="fa-solid fa-trash-can"
                          onClick={() => setShowConfirmModal(true)}
                        />
                        <ConfirmModal
                          showModal={showConfirmModal}
                          onConfirm={() => deleteShippingBox(element)}
                          onCancel={() => setShowConfirmModal(false)}
                          message="you want to delete shipping box."
                        />
                      </td>
                    </tr>
                  );
                })}
            </table>
          </div>
          <div className="modal-footer">
            <div
              className="cancel-btn"
              onClick={() => setShowShippingBoxesModal(false)}
            >
              Close
            </div>
          </div>
        </div>
      </Modal>
      <ErrorModal
        showModal={showError}
        onConfirm={setShowError}
        message="Please select at least 1 product for mapping."
      />
      <Modal showModal={showAssignLocationModal} width="30%">
        {isLoading && <Loader />}
        <div className="assign-location">
          <div className="modal-header">
            Assign Location to selected product(s)
          </div>
          <div className="modal-body">
            <div className="input-container">
              <div className="input-lebel">
                <span> Location By&nbsp;</span>
              </div>
              <div className="input-field">
                <select
                  className="input-field-text"
                  type="text"
                  onChange={(e) => setLocationBy(e.target.value)}
                >
                  <option value={"name"}>Name</option>
                  <option value={"tag"}>Tags</option>
                </select>
              </div>
            </div>
            <div className="input-container">
              <div className="input-lebel">
                <span> Location List&nbsp;</span>
              </div>
              <div className="input-field">
                <select
                  className="input-field-text"
                  type="text"
                  onChange={(e) =>{ 
                     
                    handleLocationChange(e)}}
                >
                  <option>Select option</option>
                  {locationBy == "name" &&
                    locations.length > 0 &&
                    locations.map((element, i) => {
                      return (
                        <option value={JSON.stringify(element)}
                        
                        onChange={(e) =>{
                          
                          
                          console.log(e.target.value,"dd")
                          setLocationName(e.target.value)}}
                        
                        >
                          {element.location_name}
                        </option>
                      );
                    })}
                  {locationBy == "tag" &&
                    merchantTags.length > 0 &&
                    merchantTags.map((element, i) => {
                      return (
                        <option value={JSON.stringify(element)}>{element.name}</option>
                      );
                    })}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="cancel-btn"
              onClick={() => setShowAssignLocationModal(false)}
            >
              Close
            </button>
            <button className="submit-btn" onClick={() => assignLocation()}>
              Submit
            </button>
          </div>
        </div>
      </Modal>

      <Modal showModal={showDimensionsModal} width="60%">
        {isLoading && <Loader />}
        <div className="assign-location">
          <div className="modal-header">
            Assign dimensions to selected product(s)
          </div>
          <div className="modal-body">
            {dimensionDivsArray.map((item) => (
              <div className="dimension-container">
                <div className="input-row">
                  <div className="input-container1">
                    <div className="input-lebel1">
                      <span> Package Types&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                      {errorMessage != "" && packageType == "" && (
                        <span style={{ color: "red" }}>
                          &nbsp; {"(Required)"}
                        </span>
                      )}
                    </div>
                    <div className="input-field">
                      <select
                        className="input-field-text1"
                        type="text"
                        onChange={(e) => setPackageType(e.target.value)}
                      >
                        <option>Select package type</option>
                        {packageTypes.length > 0 &&
                          packageTypes.map((element, i) => {
                            return (
                              <option value={element.name}>
                                {element.name}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>
                  <div className="input-container1">
                    <div className="input-lebel1">
                      <span> Length&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                      {errorMessage != "" && length == "" && (
                        <span style={{ color: "red" }}>
                          &nbsp; {"(Required)"}
                        </span>
                      )}
                    </div>
                    <div className="input-field">
                      <input
                        className="input-field-text1"
                        type="number"
                        placeholder="Length"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-container1">
                    <div className="input-lebel1">
                      <span> Width&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                      {errorMessage != "" && width == "" && (
                        <span style={{ color: "red" }}>
                          &nbsp; {"(Required)"}
                        </span>
                      )}
                    </div>
                    <div className="input-field">
                      <input
                        className="input-field-text1"
                        type="number"
                        placeholder="Width"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="input-row">
                  <div className="input-container1">
                    <div className="input-lebel1">
                      <span> Height&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                      {errorMessage != "" && height == "" && (
                        <span style={{ color: "red" }}>
                          &nbsp; {"(Required)"}
                        </span>
                      )}
                    </div>
                    <div className="input-field">
                      <input
                        className="input-field-text1"
                        type="text"
                        placeholder="Height"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-container1">
                    <div className="input-lebel1">
                      <span> Weight(kgs)&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                    </div>
                    <div className="input-field">
                      <input
                        className="input-field-text1"
                        type="text"
                        placeholder="Weight(kgs)"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-container1">
                    <div className="input-lebel1">
                      <span> Individuals&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                    </div>
                    <div className="input-field">
                      <input
                        type="radio"
                        name={item + "isIndividual"}
                        id={item + "yes"}
                        value="Yes"
                        onChange={(e) => setIsIndividual(e.target.value)}
                        checked={isIndividual == "Yes"}
                      />
                      <label htmlFor={item + "yes"}>&nbsp;Yes</label>
                      <input
                        type="radio"
                        name={item + "isIndividual"}
                        id={item + "no"}
                        value="No"
                        onChange={(e) => setIsIndividual(e.target.value)}
                        checked={isIndividual == "No"}
                      />
                      <label htmlFor={item + "no"}>&nbsp;No</label>
                      {item != 0 && (
                        <FontAwesomeIcon
                          icon="fa-solid fa-trash"
                          style={{
                            height: "1.2rem",
                            color: "red",
                            marginLeft: "30px",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            dimensionCount > 1 &&
                            setDimensionCount(dimensionCount - 1)
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* <div className="add-more-dimension" onClick={() => setDimensionCount(dimensionCount + 1)}>
                        Add More Dimensions
                    </div> */}
          <div className="modal-footer">
            <button
              className="cancel-btn"
              onClick={() => setshowDimensionsModal(false)}
            >
              Close
            </button>
            <button className="submit-btn" onClick={() => assignDimensions()}>
              Submit
            </button>
          </div>
        </div>
      </Modal>
      <div className="pickup-locations-table">
        <table>
          <tr className="table-head">
            <th className="select-all">
              <input type="checkbox"
              
              checked={selectedProducts?.length === products?.length}
              
              onChange={(e) => handleSelectAll(e)} />
            </th>
            <th>Name</th>
            {/* <th>SKU</th> */}
            <th>Price</th>
            <th>Category</th>
            <th>Tags</th>
            <th>Package Type</th>
            <th>L x W x H</th>
            <th>Weight</th>
            <th>Is Individual</th>
            {/* <th>Eligible For Shipping</th> */}
            <th>Free Shipping</th>
            <th>Location/Tag</th>
          </tr>
          {products?.length > 0 &&
            products.filter((prod)=>prod.title.toLowerCase().includes(productSearchString.toLowerCase()))
            .map((element, i) => {
              return element?.variants.length > 0 &&
                element?.variants[0]?.title == "Default Title" ? (
                <tr
                  key={i}
                  className="products-row"
                  style={{ background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF" }}
                >
                  <td>
                    <input
                      type="checkbox"
                      style={{ width: "40px" }}
                      value={element.id}
                      onChange={(e) => selectProduct(e)}
                      checked={selectedProducts.includes(element.id.toString())}
                    />
                  </td>
                  <td width="10%">{element.title}</td>
                  {/* <td width="10%">{element?.variants?.[0]?.sku}</td> */}
                  <td width="10%">{"$" + element.variants[0].price}</td>
                  <td width="10%">{element.product_type}</td>
                  <td width="20%">{element.tags}</td>
                  <td width="10%">
                    {getProductMetaField(element.metafields, "package_type")}
                  </td>
                  <td width="20%">
                    {getProductMetaField(element.metafields, "width") != null
                      ? getProductMetaField(element.metafields, "length") +
                        " x " +
                        getProductMetaField(element.metafields, "width") +
                        " x " +
                        getProductMetaField(element.metafields, "height")
                      : "0 x 0 x 0"}
                  </td>
                  <td width="10%">
                    {getProductMetaField(element.metafields, "weight") ?? "0kg"}
                  </td>
                  <td width="10%">
                    {getProductMetaField(element.metafields, "is_individaul")}
                  </td>
                  {/* <td width="10%"><label className="switch">
                                    <input type="checkbox" />
                                    <span className="slider round"></span>
                                </label></td> */}
                  <td width="10%">
                    <label className="switch">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          handleFreeShippingChange(e, element.id)
                        }
                        checked={
                          getProductMetaField(
                            element.metafields,
                            "is_free_shipping"
                          ) == "1"
                            ? true
                            : false
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                  <td width="10%">
          
                    {getLocationtagName(getProductMetaField(element.metafields, "location"))}
                  </td>
                </tr>
              ) : (
                <>
                  <tr
                    className="products-row"
                    style={{
                      background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF",
                      cursor: "pointer",
                    }}
                    onClick={() => openVariableProduct(element.id)}
                  >
                    <td style={{ textAlign: "center" }}>
                      <FontAwesomeIcon
                        icon={
                          openProductIds.includes(element.id)
                            ? "fa-solid fa-caret-down"
                            : "fa-solid fa-caret-right"
                        }
                        style={{ height: "1.3rem" }}
                      />
                    </td>
                    <td width="10%">{element.title}</td>
                    <td width="10%">{element.variants[0].sku}</td>
                    <td width="10%">{"$" + element.variants[0].price}</td>
                    <td width="10%">{element.product_type}</td>
                    <td width="20%">{getLocationtagName(element.tags)}</td>
                    <td width="10%">{"-- --"}</td>
                    <td width="20%">{"-- --"}</td>
                    <td width="10%">{"-- --"}</td>
                    <td width="10%">{"-- --"}</td>
                    {/* <td width="10%"><label className="switch">
                                        <input type="checkbox" />
                                        <span className="slider round"></span>
                                    </label></td> */}
                    <td width="10%">
                      <label className="switch">
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            handleFreeShippingChange(e, element.id)
                          }
                          checked={
                            getProductMetaField(
                              element.metafields,
                              "is_free_shipping"
                            ) == "1"
                              ? true
                              : false
                          }
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>
                    <td width="10%">
                      {getLocationtagName(getProductMetaField(element.metafields, "location"))}
                    </td>
                  </tr>
                  {openProductIds.includes(element.id) &&
                    element.variants.map((value, i) => {
                      return (
                        <tr
                          className="products-row"
                          style={{ background: "#eaebeb" }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              style={{ width: "40px" }}
                              value={value.id}
                              onChange={(e) => selectVariant(e)}
                              checked={selectedVariants.includes(
                                value.id.toString()
                              )}
                            />
                          </td>
                          <td width="10%">{value.title}</td>
                          <td width="10%">{value.sku}</td>
                          <td width="10%">{"$" + value.price}</td>
                          <td width="10%">{}</td>
                          <td width="20%">{}</td>
                          <td width="10%">
                            {getProductMetaField(
                              value.metafields,
                              "package_type"
                            )}
                          </td>
                          <td width="10%">
                            {getProductMetaField(value.metafields, "width") !=
                            null
                              ? getProductMetaField(
                                  value.metafields,
                                  "length"
                                ) +
                                " x " +
                                getProductMetaField(value.metafields, "width") +
                                " x " +
                                getProductMetaField(value.metafields, "height")
                              : "0 x 0 x 0"}
                          </td>
                          <td width="20%">
                            {getProductMetaField(value.metafields, "weight")}
                          </td>
                          <td width="10%">
                            {getProductMetaField(
                              value.metafields,
                              "is_individaul"
                            )}
                          </td>
                          {/* <td width="10%"><label className="switch">
                                            <input type="checkbox" />
                                            <span className="slider round"></span>
                                        </label></td> */}
                          <td></td>
                          <td width="10%">
                             
                    {getLocationtagName(getProductMetaField(value.metafields, "location"))}

                          </td>
                        </tr>
                      );
                    })}
                </>
              );
            })}
        </table>
      </div>
    </div>
  );
}
