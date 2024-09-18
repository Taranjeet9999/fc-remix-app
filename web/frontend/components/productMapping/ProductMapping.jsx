import "./style.scss";
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
import { headers, locationMetafields } from "../../globals";
import { Dropdown } from "react-bootstrap";

export function ProductMapping(props) {
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
  const [locationName, setLocationName] = useState([]);
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
  const [dimensionCount, setDimensionCount] = useState(3);
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProductType, setSelectedProductType] = useState("all");
  const [productData, setProductData] = useState([]);
  const [shippingPackageName, setShippingPackageName] = useState("");
  const [shippingBoxToDelete, setShippingBoxToDelete] = useState();
  const [shippingPackageType, setShippingPackageType] = useState("");
  const [shippingPackageHeight, setShippingPackageHeight] = useState("");
  const [shippingPackageLength, setShippingPackageLength] = useState("");
  const [shippingPackageWidth, setShippingPackageWidth] = useState("");
  const [isDefaultShippingPackage, setIsDefaultShippingPackage] =
    useState("No");
  const [shippingBoxId, setShippingBoxId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [openProductIds, setOpenProductIds] = useState([]);
  const [showImportDimensionsModal, setShowImportDimensionsModal] =
    useState(false);
  const [productDimentionsError, setProductDimentionsError] = useState(false);
  const [productDimentions, setProductDimentions] = useState([
    {
      packageType: "box",
      height: "",
      width: "",
      length: "",
      weight: "",
      isIndividual: "Yes",
    },
  ]);
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

    if (data) {
      const formattedProducts = formatProductData(data.body.data.products);

      setProducts(formattedProducts);
      props.setProducts(formattedProducts);
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
            sku: variantEdge.node.sku,
            requires_shipping: variantEdge.node.requiresShipping,
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

  function hasEmptyFields(items) {
    for (let item of items) {
      for (let key in item) {
        if (item[key] === "" || item[key] === undefined || item[key] === null) {
          setErrorMessage("Please fill all the fields");
          return true;
        }
      }
    }
    return false;
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
    props.setShippingBoxes(data);
  };

  useEffect(() => {




    getMerchantTags();
    getPackageTypes();
    getPickupLocations();
    getShippingBoxes();
    getAllProducts();
    
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

 

  const handleCsvInputChange = (e) => {
    setCsvData(e.target.files[0]);
  };

  const [importDimensionError, setImportDimensionError] = useState("");
  useEffect(() => {
    setImportDimensionError("");
    setErrorMessage("");
  }, [showImportDimensionsModal]);
  function transformImportDimentionArray(inputArray) {
    const outputArray = [];
    let currentProduct = null;

    inputArray.forEach((item) => {
      if (item["Product Name"] || item["SKU"]) {
        // Create a new product if "Product Name" or "SKU" is present
        currentProduct = {
          "Product Name": item["Product Name"],
          SKU: item["SKU"],
          productDimentions: [],
        };
        outputArray.push(currentProduct);
      }

      // Add the dimensions to the current product
      if (
        currentProduct &&
        item["Length"] &&
        item["Width"] &&
        item["Height"] &&
        item["Weight"] &&
        item["Package Type"]
      ) {
        currentProduct.productDimentions.push({
          packageType: item["Package Type"],
          height: item["Height"],
          width: item["Width"],
          length: item["Length"],
          weight: item["Weight"],
          isIndividual: item["Individual"],
        });
      }
    });

    return outputArray;
  }

  const importDimensions = async () => {
    setIsLoading(true);
    try {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: false,
        complete: async (result) => {
          try {
            setDataArray(result.data);
            const importData = result.data;
            let importDataArray = transformImportDimentionArray(importData);
            console.log("importData", importDataArray);
            const allProductDimentions = importDataArray?.flatMap(
              (product) => product.productDimentions
            );
            const isAllItemsFitable = canFitAllProducts(
              shippingBoxes,
              allProductDimentions?.filter(
                (_product) => _product?.isIndividual?.toLowerCase() === "no"
              )
            );
            if (!isAllItemsFitable) {
              setImportDimensionError("Some products are not fit in any box");
              setIsLoading(false);
              return;
            }

            const productIds = await Promise.all(
              importDataArray.map(async (element) => {
                const product = products?.find(
                  (product) => product?.variants?.[0]?.sku === element?.SKU
                );

                console.log("product", product);

                if (product?.id) {
                  await fetch("/api/product/add-dimensions", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      productDimentions: element.productDimentions,
                      product_ids: [product.id],
                      variant_ids: [],
                    }),
                  });

                  return product.id;
                }

                // return null;
              })
            );

            if (productIds?.length > 0) {
              getAllProducts();
              setIsLoading(false);
              setShowImportDimensionsModal(false);
            } else {
              setImportDimensionError("No Products found");
              setIsLoading(false);
            }
          } catch (error) {
            console.log("import dmensions error", error);
          }
        },
      });
    } catch (error) {
      console.log("import dmensions error", error);
    }
  };

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
        { headers: headers  }
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
        }/api/wp/package_types`,
        {
          headers: headers,
        }
      )
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
      ? products.filter(element=> element?.variants[0]?.requires_shipping).map((element) => element.id.toString())
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
    let isAllItemsFitable = canFitAllProducts(shippingBoxes, productDimentions);
    if (!isAllItemsFitable) {
      setProductDimentionsError("Some products are not fit in any box");
      return;
    }
    try {
      const isValid = !hasEmptyFields(productDimentions);
      if (isValid) {
        setIsLoading(true);
        await fetch("/api/product/add-dimensions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // package_type: packageType,
            // height: height,
            // width: width,
            // length: length,
            // weight: weight,
            // isIndividual: isIndividual,
            productDimentions: productDimentions,
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
    let locationJson = { ...locationMetafields };
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
            id: shippingBoxId,
          }),
        });
        setIsLoading(false);
        getShippingBoxes();
        // setShippingBoxId(null);

        closeAddShippingBoxModal();
      }
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  const deleteShippingBox = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/shipping-box/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shippingBoxToDelete),
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
    setProductSearchString("");
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
  const handleVirtualShipping = async (e, id) => {
    const checked = e.target.checked;
    try {
      setIsLoading(true);
      await fetch("/api/virtual-shipping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: id,
          isVirtual: checked,
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
    setErrorMessage("");

    if (showDimensionsModal) {
      // setPackageType("bag")
      setLength("");
      setWidth("");
      setHeight("");
      setWeight("");
      setIsIndividual("Yes");
      setErrorMessage("");
      setProductDimentions([
        {
          packageType: "box",
          height: "",
          width: "",
          length: "",
          weight: "",
          isIndividual: "Yes",
        },
      ]);
    }
  }, [showDimensionsModal]);
  useEffect(() => {
    setErrorMessage("");

    if (showAddShippingBoxModal) {
      setErrorMessage("");
    }
  }, [showAddShippingBoxModal]);

  const handleDownloadCSV = () => {
    // Define the filename of the CSV file to be downloaded
    const filename = "dimensions-sample.csv";
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

  function getLocationtagName(tagData) {
   
    try {
      let _tagData = JSON.parse(tagData);

      if (typeof _tagData == "string" || !Array.isArray(_tagData)) {
        return "";
      }

      // if (_tagData?.type == "name") {
      let LocationsExistForLoginUser = locations.filter((element) => {
        return _tagData.findIndex((ite) => ite.id === element.id) !== -1;
      });
      if (!LocationsExistForLoginUser) {
        return "";
      }
      return LocationsExistForLoginUser.map((it) => it.location_name).join(", ");
      // }
      // if (_tagData?.type == "tag") {
      //   let IsTagExistForLoginUser = merchantTags.find(
      //     (element) => element.id == _tagData.value.id
      //   );
      //   if (!IsTagExistForLoginUser) {
      //     return "";
      //   }
      //   return _tagData.value.name;
      // }
    } catch (error) {
      console.log(error, "error");
      return "";
    }
  }
  const [productSearchString, setProductSearchString] = useState("");

  function getProductDimentionArray(_productDimension) {
    try {
      return JSON.parse(_productDimension);
    } catch (error) {
      return [];
    }
  }

  function canFitAllProducts(boxes, products) {
    // Convert dimensions to numbers for comparison
    boxes = boxes.map((box) => ({
      ...box,
      height: Number(box.height),
      width: Number(box.width),
      length: Number(box.length),
    }));

    products = products
      ?.filter((_product) => _product?.isIndividual?.toLowerCase() === "no")
      .map((product) => ({
        ...product,
        height: Number(product.height),
        width: Number(product.width),
        length: Number(product.length),
      }));

    // Function to check if a product fits in a box
    function fitsInBox(product, box) {
      return (
        product.height <= box.height &&
        product.width <= box.width &&
        product.length <= box.length
      );
    }

    // Check each product against each box
    for (let product of products) {
      // if (product.packageType === "box") {
      let fits = boxes.some((box) => fitsInBox(product, box));
      if (!fits) {
        return false; // If any product doesn't fit in any box, return false
      }
      // }
    }
    return true; // All products fit in some box
  }
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
          {false && (
            <>
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
              </div>
            </>
          )}
          <div className="input-container mr-2">
            <div className="input-lebel">
              <span> Product Name&nbsp;</span>
            </div>
            <div className="input-field1 highlight-input">
              <input
                className="input-field-text"
                type="text"
                placeholder="Product"
                onChange={
                  (e) => {
                    setProductSearchString(e.target.value);
                  }
                  // setFilterData({ ...filterData, orderId: e.target.value })
                }
                value={productSearchString}
              />
            </div>
          </div>
          {false && (
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
          )}
          <div className="filter-buttons">
            {/* <button className="fc-yellow-btn pointer"> Filter </button> */}
            <button onClick={() => resetFilters()}> Reset </button>
          </div>
        </div>

        <div className="product-actions">
          <button
            className="submit-btn "
            onClick={() => setShowShippingBoxesModal(true)}
          >
            <div className="d-flex align-items-center">
              <div>Shipping Boxes</div>

              {!shippingBoxes?.length && (
                <FontAwesomeIcon
                  icon="fa-solid fa-exclamation-circle"
                  size="sm"
                  color="black"
                  style={{
                    width: "18px",
                    height: "18px",
                    marginLeft: "10px",
                  }}
                />
              )}
            </div>
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
            onClick={() => {
              setErrorMessage("");

              selectedProducts.length > 0 || selectedVariants.length > 0
                ? (setLocationName([]),setShowAssignLocationModal(true))
                : setShowError(true);
            }}
          >
            Assign Location
          </button>
          <button
            className="submit-btn"
            onClick={() => setShowImportDimensionsModal(true)}
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
              <div
                className="sample-download"
                onClick={() => {
                  handleDownloadCSV();
                }}
              >
                <a href="#" download={true}>
                  {" "}
                  Sample CSV{" "}
                </a>
              </div>
            </div>

            {importDimensionError && (
              <div className="error-message mt-2">{importDimensionError}</div>
            )}
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
      <Modal className={"full-screen-modal"} showModal={showShippingBoxesModal}>
        {isLoading && <Loader />}
        <div className="shipping-boxes">
          <div className="modal-header">
            <div className="shipping-heading">Shipping Boxes</div>
            <div
              className="submit-btn"
              onClick={() => {
                setShippingBoxId(null);
                setShowAddShippingBoxModal(true);
              }}
            >
              Add Shipping Box
            </div>
            <Modal showModal={showAddShippingBoxModal} width="40%">
              {isLoading && <Loader />}
              <div className="add-shipping-box">
                <div className="modal-header">
                  <div className="shipping-heading">Add Shipping Box</div>
                </div>
                <div className="modal-body p-3">
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
                    <div className="input-field highlight-input">
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
                        value={shippingPackageType}
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
                      <div className="input-field highlight-input">
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
                      <div className="input-field highlight-input">
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
                      <div className="input-field highlight-input">
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
                    {/* {!shippingBoxes?.some(
                      (item) => item.is_default === "Yes"
                    ) && ( */}
                    <div className="input-container1">
                      <div className="input-lebel1">
                        <span> Default&nbsp;</span>
                        <span style={{ color: "red" }}> *</span>
                      </div>
                      <div
                        className=" "
                        style={{
                          width: "100%",
                          display: "flex",
                          /* justify-content: center, */
                          marginTop: "10px",
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
                          className="ml-2"
                          id={"no"}
                          // it should be disabled if its id machtes with any of the shipping box id and its default is yes
                          disabled={
                            shippingBoxes?.some(
                              (item) => item.id === shippingBoxId
                            ) &&
                            shippingBoxes?.find(
                              (item) => item.id === shippingBoxId
                            ).is_default === "Yes"
                          }
                          value="No"
                          onChange={(e) =>
                            setIsDefaultShippingPackage(e.target.value)
                          }
                          checked={isDefaultShippingPackage == "No"}
                        />
                        <label htmlFor={"no"}>&nbsp;No</label>
                      </div>
                    </div>
                    {/* // )} */}
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
                        {element.is_default === "No" ? (
                          <FontAwesomeIcon
                            icon="fa-solid fa-trash-can"
                            onClick={() => {
                              setShippingBoxToDelete(element);
                              setShowConfirmModal(true);
                            }}
                          />
                        ) : (
                          <></>
                        )}

                        <FontAwesomeIcon
                          icon="fa-solid fa-pen-to-square"
                          // size="2xs"
                          onClick={() => {
                            setShippingPackageName(element.package_name);
                            setShippingPackageType(element.package_type);
                            setShippingPackageHeight(element.height);
                            setShippingPackageLength(element.length);
                            setShippingPackageWidth(element.width);
                            setIsDefaultShippingPackage(element.is_default);
                            setShippingBoxId(element.id);
                            setShowAddShippingBoxModal(true);
                          }}
                        />
                        <ConfirmModal
                          showModal={showConfirmModal}
                          onConfirm={() => deleteShippingBox()}
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
      <ErrorModal
        showModal={productDimentionsError}
        onConfirm={setProductDimentionsError}
        message="Shipping box is not available for this product. Please add shipping box first."
      />
      <Modal showModal={showAssignLocationModal} width="30%">
        {isLoading && <Loader />}
        <div className="assign-location">
          <div className="modal-header">
            Assign Location to selected product(s)
          </div>
          <div className="modal-body overflow-unset">
            <div className="input-container">
              <div className="input-lebel">
                <span> Location List&nbsp;</span>
              </div>
              <div className="input-field">
                {false && (
                  <select
                    className="input-field-text"
                    type="text"
                    onChange={(e) => {
                      handleLocationChange(e);
                    }}
                  >
                    <option>Select option</option>
                    {locationBy == "name" &&
                      locations.length > 0 &&
                      locations.map((element, i) => {
                        return (
                          <option
                            value={JSON.stringify(element)}
                            onChange={(e) => {
                              setLocationName(e.target.value);
                            }}
                          >
                            {element.location_name}
                          </option>
                        );
                      })}
                  </select>
                )}

                <Dropdown className="location-list-dropdown">
                  <Dropdown.Toggle className="d-flex flex-wrap">

                 {locationName.length===0 &&   <div className="text-muted">
                      Select option

                    </div>}
                    {
                      locationName?.map((item)=>{
                        return(
                          <div className="location-chip">
                            {item.location_name}

                            <FontAwesomeIcon icon="fa-solid fa-xmark" style={{
                              width:"12px",
                              height:"12px",
                              marginLeft:"4px"
                            }} 
                            
                            onClick={(e)=>{
                              e.stopPropagation()

                              let updated_data =[...locationName].filter(it=>it.id !==item.id)
                              setLocationName(updated_data)


                            }}
                            
                            />
                          </div>
                        )
                      })
                    }
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {locations.map((element, i) => {
                      return (
                        <div
                          className="location-item"
                          value={JSON.stringify(element)}
                          onClick={() => {

                            let updated_data = [...locationName]
                            const map = new Map(updated_data.map(item => [item.id, item]));

                            if (!map.has(element.id)) {
                              updated_data.push(element)
                            }  
                            setLocationName( updated_data);
                          }}
                        >
                          {element.location_name}
                        </div>
                      );
                    })}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
            <div className="modal-footer pb-0 mt-3">
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
        </div>
      </Modal>

      <Modal showModal={showDimensionsModal} width="60%">
        {isLoading && <Loader />}
        <div className="assign-location">
          <div className="modal-header">
            Assign dimensions to selected product(s)
          </div>
          <div className="modal-body">
            {productDimentions.map((item, itemIndex) => (
              <div className="dimension-container">
                <div className="input-row">
                  <div className="input-container1">
                    <div className="input-lebel1">
                      <span> Package Types&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                      {errorMessage != "" && item.packageType == "" && (
                        <span style={{ color: "red" }}>
                          &nbsp; {"(Required)"}
                        </span>
                      )}
                    </div>
                    <div className="input-field">
                      <select
                        className="input-field-text1"
                        type="text"
                        value={item.packageType}
                        onChange={(e) => {
                          let updated_data = [...productDimentions];
                          updated_data[itemIndex].packageType = e.target.value;
                          setProductDimentions(updated_data);
                        }}
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
                      {errorMessage != "" && item.length == "" && (
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
                        value={item.length}
                        onChange={(e) => {
                          let updated_data = [...productDimentions];
                          updated_data[itemIndex].length = e.target.value;
                          setProductDimentions(updated_data);
                        }}
                      />
                    </div>
                  </div>
                  <div className="input-container1">
                    <div className="input-lebel1">
                      <span> Width&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                      {errorMessage != "" && item.width == "" && (
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
                        value={item.width}
                        onChange={(e) => {
                          let updated_data = [...productDimentions];
                          updated_data[itemIndex].width = e.target.value;
                          setProductDimentions(updated_data);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="input-row">
                  <div className="input-container1">
                    <div className="input-lebel1">
                      <span> Height&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                      {errorMessage != "" && item.height == "" && (
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
                        value={item.height}
                        onChange={(e) => {
                          let updated_data = [...productDimentions];
                          updated_data[itemIndex].height = e.target.value;
                          setProductDimentions(updated_data);
                        }}
                      />
                    </div>
                  </div>
                  <div className="input-container1">
                    <div className="input-lebel1">
                      <span> Weight(kgs)&nbsp;</span>
                      <span style={{ color: "red" }}> *</span>
                      {errorMessage != "" && item.weight == "" && (
                        <span style={{ color: "red" }}>
                          &nbsp; {"(Required)"}
                        </span>
                      )}
                    </div>
                    <div className="input-field">
                      <input
                        className="input-field-text1"
                        type="text"
                        placeholder="Weight(kgs)"
                        value={item.weight}
                        onChange={(e) => {
                          let updated_data = [...productDimentions];
                          updated_data[itemIndex].weight = e.target.value;
                          setProductDimentions(updated_data);
                        }}
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
                        name={itemIndex + "isIndividual"}
                        id={itemIndex + "yes"}
                        value="Yes"
                        onChange={(e) => {
                          let updated_data = [...productDimentions];
                          updated_data[itemIndex].isIndividual = e.target.value;
                          setProductDimentions(updated_data);
                        }}
                        checked={item.isIndividual == "Yes"}
                      />
                      <label htmlFor={itemIndex + "yes"}>&nbsp;Yes</label>
                      <input
                        type="radio"
                        name={itemIndex + "isIndividual"}
                        id={itemIndex + "no"}
                        value="No"
                        onChange={(e) => {
                          let updated_data = [...productDimentions];
                          updated_data[itemIndex].isIndividual = e.target.value;
                          setProductDimentions(updated_data);
                        }}
                        checked={item.isIndividual == "No"}
                      />
                      <label htmlFor={itemIndex + "no"}>&nbsp;No</label>
                      {itemIndex != 0 && (
                        <FontAwesomeIcon
                          icon="fa-solid fa-trash"
                          style={{
                            height: "1.2rem",
                            color: "red",
                            marginLeft: "30px",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            let updated_data = [...productDimentions];

                            updated_data.splice(itemIndex, 1);

                            setProductDimentions(updated_data);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            className="add-more-dimension"
            onClick={() => {
              let updated_data = [...productDimentions];
              updated_data.push({
                packageType: "box",
                height: "",
                width: "",
                length: "",
                weight: "",
                isIndividual: "Yes",
              });
              setProductDimentions(updated_data);
            }}
          >
            Add More Dimensions
          </div>
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
              {/* <input
                type="checkbox"
                checked={selectedProducts?.length === products?.length}
                onChange={(e) => handleSelectAll(e)}
              /> */}
            </th>
            <th>Name</th>
            {/* <th>SKU</th> */}
            <th>Price</th>
            <th>Category</th>
            <th>
              Tags
              {/* Virtual */}
            </th>
            <th>Package Type</th>
            <th>L x W x H </th>
            <th>Weight</th>
            <th>Is Individual</th>
            {/* <th>Eligible For Shipping</th> */}
            <th>Free Shipping</th>
            <th>Location</th>
          </tr>
          {products?.length > 0 &&
            products
              .filter((prod) =>
                prod.title
                  .toLowerCase()
                  .includes(productSearchString.toLowerCase())
              )
              .map((element, i) => {
                return element?.variants.length > 0 &&
                  element?.variants[0]?.title == "Default Title" ? (
                  <tr
                    key={i}
                    className="products-row"
                    style={{ background: i % 2 != 0 ? "#F5F8FA" : "#FFFFFF" }}
                  >
                    <td>
                      {element?.variants[0]?.requires_shipping && (
                        <input
                          type="checkbox"
                          value={element.id}
                          onChange={(e) => selectProduct(e)}
                          checked={selectedProducts.includes(
                            element.id.toString()
                          )}
                        />
                      )}
                    </td>
                    <td width="10%">{element.title}</td>
                    {/* <td width="10%">{element?.variants?.[0]?.sku}</td> */}
                    <td width="10%">{"$" + element.variants[0].price}</td>
                    <td width="10%">{element.product_type}</td>
                    <td width="20%">
                      {/* {element.tags} */}

                      {false && (
                        <label className="switch">
                          <input
                            type="checkbox"
                            onChange={(e) =>
                              handleVirtualShipping(e, element.id)
                            }
                            checked={
                              getProductMetaField(
                                element.metafields,
                                "is_virtual"
                              ) == "1"
                                ? true
                                : false
                            }
                          />
                          <span className="slider round"></span>
                        </label>
                      )}
                    </td>
                    <td width="10%">
                      {element?.variants[0]?.requires_shipping &&
                        getProductDimentionArray(
                          getProductMetaField(
                            element.metafields,
                            "product_dimentions"
                          )
                        )?.map((item, i) => {
                          return <div>{item.packageType}</div>;
                        })}
                    </td>
                    <td width="20%">
                      {element?.variants[0]?.requires_shipping &&
                        getProductDimentionArray(
                          getProductMetaField(
                            element.metafields,
                            "product_dimentions"
                          )
                        )?.map((item, i) => {
                          return (
                            <div>
                              {item.length} x {item.width} x {item.height}
                            </div>
                          );
                        })}
                    </td>
                    <td width="10%">
                      {element?.variants[0]?.requires_shipping &&
                        getProductDimentionArray(
                          getProductMetaField(
                            element.metafields,
                            "product_dimentions"
                          )
                        )?.map((item, i) => {
                          return <div>{item.weight}kg</div>;
                        })}
                    </td>
                    <td width="10%">
                      {element?.variants[0]?.requires_shipping &&
                        getProductDimentionArray(
                          getProductMetaField(
                            element.metafields,
                            "product_dimentions"
                          )
                        )?.map((item, i) => {
                          return <div>{item.isIndividual}</div>;
                        })}
                    </td>
                    {/* <td width="10%"><label className="switch">
                                    <input type="checkbox" />
                                    <span className="slider round"></span>
                                </label></td> */}
                    <td width="10%">
                      {element?.variants[0]?.requires_shipping && (
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
                      )}
                    </td>
                    <td width="10%">
                      {element?.variants[0]?.requires_shipping &&
                        getLocationtagName(
                          getProductMetaField(element.metafields, "location")
                        )}
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
                      {/* <td width="10%">{element.variants[0].sku}</td> */}
                      <td width="10%">{"$" + element.variants[0].price}</td>
                      <td width="10%">{element.product_type}</td>
                      <td width="20%">
                        {/* {getLocationtagName(element.tags)} */}
                        {false && (
                          <label className="switch">
                            <input
                              type="checkbox"
                              onChange={(e) =>
                                handleVirtualShipping(e, element.id)
                              }
                              checked={
                                getProductMetaField(
                                  element.metafields,
                                  "is_virtual"
                                ) == "1"
                                  ? true
                                  : false
                              }
                            />
                            <span className="slider round"></span>
                          </label>
                        )}
                      </td>
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
                        {/* {getLocationtagName(
                          getProductMetaField(element.metafields, "location")
                        )} */}
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
                                value={value.id}
                                onChange={(e) => selectVariant(e)}
                                checked={selectedVariants.includes(
                                  value.id.toString()
                                )}
                              />
                            </td>
                            <td width="10%">{value.title}</td>
                            {/* <td width="10%">{value.sku}</td> */}
                            <td width="10%">{"$" + value.price}</td>
                            <td width="10%">{}</td>
                            <td width="20%">{}</td>
                            <td width="10%">
                              {getProductDimentionArray(
                                getProductMetaField(
                                  value.metafields,
                                  "product_dimentions"
                                )
                              )?.map((item, i) => {
                                return <div>{item.packageType}</div>;
                              })}
                            </td>
                            <td width="20%">
                              {getProductDimentionArray(
                                getProductMetaField(
                                  value.metafields,
                                  "product_dimentions"
                                )
                              )?.map((item, i) => {
                                return (
                                  <div>
                                    {item.length} x {item.width} x {item.height}
                                  </div>
                                );
                              })}
                            </td>
                            <td width="10%">
                              {getProductDimentionArray(
                                getProductMetaField(
                                  value.metafields,
                                  "product_dimentions"
                                )
                              )?.map((item, i) => {
                                return <div>{item.weight}kg</div>;
                              })}
                            </td>
                            <td width="10%">
                              {getProductDimentionArray(
                                getProductMetaField(
                                  value.metafields,
                                  "product_dimentions"
                                )
                              )?.map((item, i) => {
                                return <div>{item.isIndividual}</div>;
                              })}
                            </td>
                            {/* <td width="10%"><label className="switch">
                                            <input type="checkbox" />
                                            <span className="slider round"></span>
                                        </label></td> */}
                            <td></td>
                            <td width="10%">
                              {getLocationtagName(
                                getProductMetaField(
                                  value.metafields,
                                  "location"
                                )
                              )}
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
