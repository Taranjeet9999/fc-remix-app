import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.css";
import { useState, useEffect } from "react";
import { Loader } from "../loader";
import { useAuthenticatedFetch } from "../../hooks";

export function OrderDetails(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const { order,redirectedtab } = location.state;
  const [products, setProducts] = useState([]);
  const fetch = useAuthenticatedFetch();

  console.log(order, "order");

  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    getAllProducts().then(() => {
      setIsLoading(false);
    });
  }, []);

  const getAllProducts = () => {
    return new Promise((resolve, reject) => {
      fetch(`/api/products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch products");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            const formattedProducts = formatProductData(
              data.body.data.products
            );

            setProducts(formattedProducts);

            resolve(formattedProducts);
          } else {
            reject("No data found");
          }
        })
        .catch((error) => {
          console.error("Error fetching products:", error);
          reject(error);
        });
    });
  };

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

  function getProductIdFromGID(gid) {
    const parts = gid.split("/"); // Split the URL by '/'
    const productId = parts[parts.length - 1];
    return productId;
  }

  function convertArrayToObject(array) {
    const result = {};
    array.forEach((item) => {
      result[item.key] = item.value;
    });
    return result;
  }
  function getProductDimensionsById(productId) {
    const product = products.find((product) => Number(product.id) === Number(productId));
    console.log(product,productId, "product")
    const metafieldsObj=[
      {
          "key": "title_tag",
          "value": "Complete Snowboard"
      },
      {
          "key": "description_tag",
          "value": "snowboard winter sport snowboarding"
      },
      {
          "key": "snowboard_length",
          "value": "{\"value\":159.0,\"unit\":\"CENTIMETERS\"}"
      },
      {
          "key": "snowboard_weight",
          "value": "{\"value\":7.0,\"unit\":\"POUNDS\"}"
      },
      {
          "key": "location",
          "value": "Adios"
      },
      {
          "key": "package_type",
          "value": "box"
      },
      {
          "key": "height",
          "value": "10"
      },
      {
          "key": "width",
          "value": "10"
      },
      {
          "key": "length",
          "value": "10"
      },
      {
          "key": "weight",
          "value": "1"
      }
  ]

    if (product) {
       
     return convertArrayToObject(product.metafields)
     
    }else{
      return {location:{}}
    }
  }

  const orderLocation = getProductDimensionsById(order?.line_items[0]?.product_id)?.['location'] !="{}" ?? null;
   console.log(orderLocation,"orderLocation")
  return (
    <div className="order-details-main">
      {isLoading && <Loader />}
      <div className="order-details-container">
        <div className="order-details-head">
          <div className="order-detail-heading">Order Details</div>
          <div className="back-btn" onClick={() =>                         navigate("/homepage", { state: { redirectedtab } })
}>
            Back
          </div>
        </div>
        <div className="order-details">
          <div className="order-info">
            <div className="order-details-item">
              <div className="order-details-name">Order:</div>
              <div className="order-details-value">{order?.name}</div>
            </div>
            <div className="order-details-item">
              <div className="order-details-name">Store:</div>
              <div className="order-details-value">
                {order.line_items[0].vendor}
              </div>
            </div>
            <div className="order-details-item">
              <div className="order-details-name">Payment Method:</div>
              <div className="order-details-value">{/* COD */}</div>
            </div>
            <div className="order-details-item">
              <div className="order-details-name">Total:</div>
              <div className="order-details-value">${order?.total_price}</div>
            </div>
            <div className="order-details-item">
              <div className="order-details-name">Insurance Required:</div>
              <div className="order-details-value">Not Required</div>
            </div>
            <div className="order-details-item">
              <div className="order-details-name">Authoriry to Leave:</div>
              <div className="order-details-value">False</div>
            </div>
          </div>

          <div className="delivery-address">
            <div className="delivery-heading">Delivery Address</div>
            <div className="order-details-value">
              <br />
              {order.billing_address.name && (
                <>
                  {order.billing_address.name},
                  <br />
                </>
              )}
              {order.billing_address.address1 && (
                <>
                  {order.billing_address.address1},
                  <br />
                </>
              )}
              {order.billing_address.address2 && (
                <>
                  {order.billing_address.address2},
                  <br />
                </>
              )}
              {order.billing_address.city && (
                <>
                  {order.billing_address.city},
                  <br />
                </>
              )}
              {order.billing_address.province && (
                <>
                  {order.billing_address.province},
                  <br />
                </>
              )}
              {order.billing_address.country && (
                <>
                  {order.billing_address.country},
                  <br />
                </>
              )}
              {order.billing_address.zip && <>{order.billing_address.zip}</>}
            </div>
          </div>

          <div className="delivery-address">
            <div className="delivery-heading">Shipping Address</div>
            <div className="order-details-value">
              <br />
              {order.shipping_address?.name && (
                <>
                  {order.shipping_address?.name},
                  <br />
                </>
              )}
              {order.shipping_address?.address1 && (
                <>
                  {order.shipping_address?.address1},
                  <br />
                </>
              )}
              {order.shipping_address?.address2 && (
                <>
                  {order.shipping_address?.address2},
                  <br />
                </>
              )}
              {order.shipping_address?.city && (
                <>
                  {order.shipping_address?.city},
                  <br />
                </>
              )}
              {order.shipping_address?.province && (
                <>
                  {order.shipping_address?.province},
                  <br />
                </>
              )}
              {order.shipping_address?.country && (
                <>
                  {order.shipping_address?.country},
                  <br />
                </>
              )}
              {order.shipping_address?.zip && <>{order.shipping_address?.zip}</>}
            </div>
          </div>
        </div>

        <div className="shipment-details">
          <div className="shipment-heading">
            <span style={{ color: "#f76b00" }}>Shipment</span>&nbsp;
            <span>{order?.financial_status} </span>
          </div>
          <div className="shipment-table">
            <table>
              <tr className="table-head">
                <th>Item</th>
                {/* <th>SKU</th> */}
                <th>Cost</th>
                <th>Quantity</th>
                <th>Tax</th>
                <th>{"Weight (kg)"}</th>
                <th>Dimesions</th>
                <th>Shipping Required</th>
                <th>Total</th>
              </tr>
              {order?.line_items?.map((item) => {
                return (
                  <tr className="table-body">
                    <td>{item.name}</td>
                    {/* <td>{item.sku}</td> */}
                    <td>${item.price}</td>
                    <td>{item.quantity}</td>
                    <td>{item.taxable ? "Yes" : "No"}</td>
                    {/* <td>{item.grams / 1000}</td> */}
                    <td>{getProductDimensionsById(item.product_id)['weight']}</td>
                    <td>{getProductDimensionsById(item.product_id)['length'] ?`${getProductDimensionsById(item.product_id)['length']}x
                    ${getProductDimensionsById(item.product_id)['width']}x
                    ${getProductDimensionsById(item.product_id)['height']}`:""}</td>
                    
                    
                  
                    <td>{item.requires_shipping ? "Yes" : "No"}</td>
                    <td>${item.price * item.quantity}</td>
                  </tr>
                );
              })}
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
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
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
                <td>{order.confirmation_number} </td>
                <td>{order.shipping_lines?.[0]?.title}</td>
                <td>  {order.shipping_lines?.[0]?.price ?`A$${order.shipping_lines?.[0]?.price}`:""}</td>
                <td>{  order?.line_items[0]?.requires_shipping ? "5-8 Business Days" :"NA"}</td>
                <td>{JSON.parse(orderLocation ?? "{}")?.value?.location_name} </td>
                <td>AUS </td>
                <td>- </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
