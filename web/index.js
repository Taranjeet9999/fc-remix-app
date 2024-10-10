// import { join } from "path";
// import { readFileSync } from "fs";

// import express from "express";
// import serveStatic from "serve-static";
// import { MongoClient, ObjectId } from "mongodb";
// import "dotenv/config";
// import Bottleneck from "bottleneck";
// import shopify from "./shopify.js";
// import productCreator from "./product-creator.js";
// import PrivacyWebhookHandlers from "./privacy.js";
// import bodyParser from "body-parser";
// import sqlite3 from "sqlite3";
// import log4js from "log4js";
const { join, parse } = require("path");
const { readFileSync } = require("fs");

const express = require("express");
const serveStatic = require("serve-static");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv/config");
const Bottleneck = require("bottleneck");
const shopify = require("./shopify.js");
const productCreator = require("./product-creator.js");
const PrivacyWebhookHandlers = require("./privacy.js");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3");
const log4js = require("log4js");
const BinPacking3D = require("binpackingjs").BP3D;

const { Item, Bin, Packer } = BinPacking3D;

log4js.configure({
  appenders: {
    file: {
      type: "file",
      filename: "logs.log",
    },
  },
  categories: {
    default: {
      appenders: ["file"],
      level: "info",
    },
  },
});

// Create a logger object
const logger = log4js.getLogger();
const db = new sqlite3.Database(
  "./database.sqlite",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error(err.message, "error");
    }
    console.log("Connected to the database.");
  }
);

// function getSession(_shop) {
//   return new Promise((resolve, reject) => {
//     db.all("SELECT * FROM shopify_sessions", [], (err, rows) => {
//       if (err) {
//         reject(err);
//       }
//       resolve(rows);
//     });
//   });
// }

function getSession(shop) {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM shopify_sessions WHERE shop = ?";
    db.all(query, [shop], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });

     
  });
}
function getSessionForShippingratesAPI(shop, company_name) {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM shopify_sessions";
    
    db.all(query, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Logging all rows for debugging purposes
        
        const filtered_session_by_shop = rows.find((item)=>item['shop']===shop)
        if (filtered_session_by_shop) {
          resolve([filtered_session_by_shop]);
          return
        }else{
          const filtered_session_by_company_name =  rows.find((row)=>{
            const merchant = JSON.parse(row['merchant'])
            if (merchant['billing_company_name']?.trim()?.toLowerCase() === company_name?.trim()?.toLowerCase()) {
              return true;
            } else {
              return false;
            }
            
          })
          if (filtered_session_by_company_name) {
            resolve([filtered_session_by_company_name]);
            return
          }else{
            resolve([])
          }
        }



         
      
      }
    });
  });
}


function isMerchantColumnExist(_columnName) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM shopify_sessions", [], (err, rows) => {
      if (err) {
        reject(err);
      }

      // Check if the rows contain the merchant_id column
      const columns = Object.keys(rows[0]); // Assuming rows is not empty

      const hasMerchantId = columns.includes(_columnName);

      // Resolve with rows and whether merchant_id column exists
      resolve(hasMerchantId);
    });
  });
}

const url = "mongodb://fc-staging:SweVFp75Rw@54.253.233.28:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.1&authMechanism=DEFAULT";
const MongoDatabase = "fc-staging";
const collectionName = 'shopify_frontend_logs';
const mongoBDClient = new MongoClient(url);
let mongoDB, collection;
 
mongoBDClient.connect()
    .then(() => {
        console.log('Connected successfully to MongoDB');
        
        // Select the database and collection
        mongoDB = mongoBDClient.db(MongoDatabase);
        collection = mongoDB.collection(collectionName);
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
    });
 
const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);
 
const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

function getKeyValueArray(objects) {
  return objects.map((obj) => {
    return {
      key: obj.key,
      value: obj.value,
    };
  });
}

const AllOrderStatuses = {
  "": "Draft",
  draft: "Draft",
  package_details_completed: "Draft",
  select_quote_completed: "Draft",
  shipment_details_completed: "Draft",
  additional_info_completed: "Draft",
  payment_failure: "Payment Failure",
  pay_now: "Payment Pending",
  pay_now_button_clicked: "Payment Pending",
  payment_pending: "Payment Pending",
  payment_completed: "Payment Completed",
  order_rejected:"Rejected",// "Order Rejected",
  order_completed: "Order Completed",
  booked_for_collection: "Booked for Collection",
  not_collected: "Not Collected",
  collected: "Collected",
  in_transit: "In Transit",
  out_for_delivery: "Out For Delivery",
  partially_delivered: "Partially Delivered",
  proof_of_delivery: "Proof of Delivery",
  under_investigation: "Under Investigation",
  rebooked_for_collection: "Rebooked for Collection",
  futile: "Futile",
  rejected: "Rejected",
  driver_error: "Driver Error",
  no_scans: "No Scans",
  cancelled: "Cancelled",
  refunded: "Refunded",
  fulfilled: "Fulfilled",
  "label:sent": "Label Sent",
  shipment_created: "Shipment Created",
  delivered: "Delivered",
  missed_delivery: "Delivery missed",
  on_route_to_pickup: "On Route To Pickup",
  processing: "Processing",
};

// app.use((req, res, next) => {
//   if (req.url === "/api/shipping-rates") {
//     const start = process.hrtime();
//     res.on("finish", () => {
//       const diff = process.hrtime(start);
//       const timeInSeconds = (diff[0] + diff[1] / 1e9).toFixed(2); // Convert to seconds
//       console.log(`API ${req.method} ${req.url} took ${timeInSeconds} seconds`);
//       logger.info(`API ${req.method} ${req.url} took ${timeInSeconds} seconds`);
//       logger.info(`Response: ${""}`);
//     });
//   }

//   next();
// });
// Order Create Webhook
const getOrderId = (orderIdString) => {
  const regex = /(\d+)/;
  const match = orderIdString.match(regex);

  // Check if there is a match and extract the numeric portion
  const orderId = match ? match[0] : null;
  return orderId;
};
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START
// MULTI ORDER IMPLEMEBTATION START




 

app.post("/api/update-order-status", bodyParser.json(), async (_req, res) => {
  try {
    const ordersBodyArray = _req.body;
    
    collection.insertOne({
      endPoint:"/api/update-order-status",
      data_in_string:JSON.stringify(ordersBodyArray),
      data_in_Object:ordersBodyArray,
      
      message:"API HIT start"
    })

    const updateOrderStatus = async (order) => {
      const storeDomain = order["store-domain"]
        ?.replace("offline_", "")
        .toLowerCase();
      const session = await getSession(storeDomain);
      logger.info("Shopify Order id ==", parseInt(order["wpOrderId"]));

      const orderMetafields = await shopify.api.rest.Metafield.all({
        session: session[0],
        metafield: {
          owner_id: parseInt(order["wpOrderId"]), // Shopify Order id
          owner_resource: "order",
        },
      });

      const metafieldsList = orderMetafields.data.map((item) => ({
        key: item.key,
        value: item.value,
      })); // List of all metafields of that Order

      const orderDataField = metafieldsList.find(
        (obj) => obj.key === "order_data"
      );
      if (!orderDataField) {
        throw new Error("Order data metafield not found");
      }

      const orderData = JSON.parse(orderDataField.value);
      const orderIndex = orderData.findIndex(
        (obj) => obj.order_id === order["order_id"]
      );
      if (orderIndex === -1) {
        throw new Error("Order ID not found in order data");
      }

      orderData[orderIndex].order_status =
        AllOrderStatuses[order["status_for_merchant"]];
      if (order["status_for_merchant"] === "order_rejected") {
        orderData[orderIndex].errors = typeof order.reason === 'object' ? Object.values(order.reason)
          .map((_value) => _value.join(","))
          .join(",")
          
          :
          order.reason;
          
          
          ;
      }
      orderData[orderIndex] = { ...orderData[orderIndex], ...order };

      const metafield = new shopify.api.rest.Metafield({
        session: session[0],
      });
      metafield.order_id = parseInt(order["wpOrderId"]);
      metafield.key = "order_data";
      metafield.value = JSON.stringify(orderData);
      metafield.type = "single_line_text_field";
      metafield.namespace = "Order";

      await metafield.save({ update: true });

      return orderData;
    };

    const results = await Promise.all(ordersBodyArray.map(updateOrderStatus));

    res.status(200).send(results);
  } catch (error) {
    logger.error("update-order-status-error==", error);

    collection.insertOne({
      endPoint:"/api/update-order-status",
      data_in_string:JSON.stringify(error),
      data_in_Object:error,
      
      message:"update-order-status-error"
    })
    res
      .status(500)
      .send({ error: "An error occurred while updating order status" });
  }
});


app.get("/api/oauth-callback", async (req, res) => {
  try {
    const { state, code, access_token, refresh_token, expires_at,error ,isProduction } = req.query;
 
 
    if (error) {
      const decodedState = JSON.parse(atob(state));
       
      const redirectURI = decodedState?.extra?.additional_redirect_uri;
      const redirectURL = new URL(redirectURI);
      const redirectOrigin = redirectURL.origin;
      const queryParams = new URLSearchParams(redirectURL.search);
        // Construct and redirect with updated query params
        const params = Object.fromEntries(queryParams);
        const queryParamsString = new URLSearchParams(params).toString();
  
        return res.redirect(
          `${redirectOrigin}/oauth-callback?${queryParamsString}`
        );
    }

    if (code) {
      const decodedState = JSON.parse(atob(state));
      const redirectURI = encodeURIComponent(
        decodedState?.extra?.additional_redirect_uri
      );
      // Decode the encoded URI to get the original URL with query parameters
const decodedURI = decodeURIComponent(redirectURI);

// Create a URLSearchParams object to parse the query parameters
const urlParams = new URLSearchParams(new URL(decodedURI).search);

// Get the value of the 'isProduction' parameter
const _isProduction = urlParams.get('isProduction');
       return res.redirect(
        `${_isProduction?.toString()?.includes("1")? "https://portal.fastcourier.com.au"  :  "https://portal.fastcourier.com.au"}/oauth/callback?code=${code}&state=${state}&redirect_uri=${redirectURI}`
      );
    }

    if (access_token && refresh_token) {
      const decodedState = JSON.parse(atob(state));
      const client_id = decodedState?.client_id;
      const client_secret = decodedState?.client_secret;
      const redirectURI = decodedState?.extra?.additional_redirect_uri;
      const redirectURL = new URL(redirectURI);
      const redirectOrigin = redirectURL.origin;
      const queryParams = new URLSearchParams(redirectURL.search);

      const shop = queryParams.get("shop");

      // Update access token and refresh token in the database
      db.run(
        "UPDATE shopify_sessions SET merchant_token = ?, merchant_refresh_token = ?, merchant_token_expires_at = ?, client_id = ?, client_secret = ? WHERE shop = ?",
        [
          access_token,
          refresh_token,
          expires_at,
          client_id,
          client_secret,
          shop,
        ],
        
        function (err) {
          if (err) {
            console.error("Database update error:", err);
            logger.info("Database update error:", err);
            return res.status(500).send("Internal Server Error");
          }
        }
      );

      // Construct and redirect with updated query params
      const params = Object.fromEntries(queryParams);
      const queryParamsString = new URLSearchParams(params).toString();

      return res.redirect(
        `${redirectOrigin}/oauth-callback?${queryParamsString}`
      );
    }

    res.status(400).send("Bad Request");
  } catch (error) {
    console.error("OAuth callback error:", error);
    logger.info("oauth-callback-error==", error);
    // res.status(500).send("Internal Server Error");
  }
});

app.get("/api/oauth-callback", async (req, res) => {
  console.log("req.query==", req.query);
  const { state, code } = req.query;
  //  const {state}= success;

  const decodedString = atob(state);
  //  res.redirect(`https://google.com?${req.query}`);
  res.status(200).send({ state: JSON.parse(decodedString), code: code });
});

// app.post("/api/webhook/order-create", bodyParser.json(), async (_req, res) => {

//       logger.info(
//       "order-create-webhook==",
//       _req.body,
//     )
//     const getCarrier = (item) => {
//       // const item = data.find((obj) => obj.source === "Fast Courier");
//       const title = item ? item.title : null;
//       const startIndex = title.indexOf("[");
//       const endIndex = title.indexOf("]");
//       // Extract the substring between '[' and ']'
//       const carrierName = title.substring(startIndex + 1, endIndex);
//       return carrierName;
//     };

//     const getCodes = (item) => {
//       // const item = data.find((obj) => obj.source === "Fast Courier");
//       return item ? item.code : null;
//     };

//     function extractQuoteIds(array) {
//       let quoteIds = array[0]
//         .split(",")
//         .map((item) => item?.match(/\(([^-]+)-/)[1])
//         .join(",");
//       return quoteIds;
//     }

//     function extractOrderIds(array) {
//     let orderIds = array[0]
//     .split(",")
//     .map((item) => item?.match(/-([^\)]+)\)/)[1])
//     .join(",");
//     return orderIds;
//     }


 
//   try {
//     const session = await getSession(
//       `${new URL(_req.body.order_status_url).hostname}`.toLowerCase()
//     );
//     let orderDetails = _req.body;
//     const fast_courier_orders = orderDetails.shipping_lines.filter(
//       (obj) => obj.source === "Fast Courier"
//     );
//     let ordersData = [];
// for (let orderIndex = 0; orderIndex < fast_courier_orders.length; orderIndex++) {
//   const codes = getCodes(fast_courier_orders[orderIndex]);

//   if (codes != null) {
    
//     const valuesArray = codes.split("~"); // FORMAT = = = = = (WKQLDRPXEQ-WKMVEZBDPO)~[PAID]~[31.98]

//     // Trim the quotes from each value and assign them to variables
//     const carrierName = getCarrier(fast_courier_orders[orderIndex]);
//     const quoteIds = extractQuoteIds(valuesArray);
//     const orderIds = extractOrderIds(valuesArray);
   
//     for (let index = 0; index < quoteIds.split(",").length; index++) {
//       ordersData.push({
//         quote_id: quoteIds.split(",")[index],
//         order_id: orderIds.split(",")[index],
//         price: JSON.parse(valuesArray[2])[index],
//         courierName: carrierName.split(",")[index],
//         order_status:
//           valuesArray[1][index] === "FALLBACK" ? "Fallback" : "Ready to Book",

//         order_type:
//           valuesArray[1][index] === "FALLBACK"
//             ? "Fallback"
//             : valuesArray[1][index] === "FREESHIPPING"
//             ? "Freeshipping"
//             : "Paid",
//       });
//       try {
//         await update_shopify_order_id_on_portal(
//           orderIds.split(",")[index],
//          parseInt(orderDetails.id),
//           _req.body?.contact_email,
//           _req.body?.shipping_address?.phone,
//           _req.body?.shipping_address?.first_name,
//           _req.body?.shipping_address?.last_name
//         );
//       } catch (error) {
//         logger.info(`Failed to update Shopify order ID on portal: ${error}`);
//         // You can decide how to handle errors in updating each order individually.
//       }
//     }
//     const order = new shopify.api.rest.Order({
//       session: session[0],
//     });
//     order.id = parseInt(orderDetails.id);
//     order.metafields = [
//       {
//         key: "quote_id",
//         value: quoteIds,
//         type: "single_line_text_field",
//         namespace: "Order",
//       },
//       {
//         key: "order_hash_id",
//         value: orderIds,
//         type: "single_line_text_field",
//         namespace: "Order",
//       },
//       {
//         key: "carrier_name",
//         value: carrierName,
//         type: "single_line_text_field",
//         namespace: "Order",
//       },
//       {
//         key: "fc_order_status",
//         value:
//           valuesArray[1] === "FALLBACK"
//             ? "Fallback"
//             : valuesArray[1] === "FREESHIPPING"
//             ? "Freeshipping"
//             : "Paid",
//         type: "single_line_text_field",
//         namespace: "Order",
//       },
//       {
//         key: "courier_charges",
//         value: valuesArray[2],
//         type: "single_line_text_field",
//         namespace: "Order",
//       },
//       {
//         key: "order_data",
//         value: JSON.stringify(ordersData),
//         type: "single_line_text_field",
//         namespace: "Order",
//       },
//     ];

//     await order.save({
//       update: true,
//     });
//     res.status(200).send(order);
//   }
  
// }






   
//   } catch (error) {
//     logger.info("order-create-webhook-error==", error);
//   }
// });




app.post("/api/webhook/order-create", bodyParser.json(), async (_req, res) => {
  try {

    collection.insertOne({
      endPoint:"/api/webhook/order-creates",
      data_in_string:JSON.stringify(_req.body),
          data_in_Object:_req.body,
      message:"webhook/order-create-hit-successfully"
    }) 
    const orderDetails = _req.body; 
    
    // Helper functions
    const getCarrier = (item) => {
      const title = item?.title || null;
      if (!title) return null;
      const startIndex = title.indexOf("[");
      const endIndex = title.indexOf("]");
      return title.substring(startIndex + 1, endIndex);
    };

    const getCodes = (item) => item?.code || null;

    const extractValues = (array, pattern) =>
      array[0]
        .split(",")
        .map((item) => item?.match(pattern)[1])
        .join(",");

    const extractQuoteIds = (array) => extractValues(array, /\(([^-]+)-/);
    const extractOrderIds = (array) => extractValues(array, /-([^\)]+)\)/);

    const session =  await getSessionForShippingratesAPI(
      new URL(orderDetails.order_status_url).hostname.toLowerCase(),
      orderDetails?.line_items?.[0]?.vendor
    )
     
    // Filter for Fast Courier orders
    const fastCourierOrders = orderDetails.shipping_lines.filter(
      (obj) => obj.source === "Fast Courier"
    );

    const ordersData = [];

    for (const fastCourierOrder of fastCourierOrders) {
      const codes = getCodes(fastCourierOrder);
      if (!codes) continue;

      const valuesArray = codes.split("~");
      const carrierName = getCarrier(fastCourierOrder);
      const quoteIds = extractQuoteIds(valuesArray);
      const orderIds = extractOrderIds(valuesArray);
      const prices = JSON.parse(valuesArray[2]);

      // Map over each quote and order id
      logger.info("quoteIds",quoteIds)
      logger.info("valuesArray",valuesArray)
      quoteIds.split(",").forEach((quoteId, index) => {
        const orderId = orderIds.split(",")[index];
        const price = prices[index];
        const courier = carrierName.split(",")[index];
        const orderStatus =
          quoteIds.split(",")[index] === "FLATRATE"
            ? "Flat-Rate"
            : quoteIds.split(",")[index] === "FALLBACK"
            ? "Fallback"
            : "Ready to Book";
        const orderType =
          quoteIds.split(",")[index] === "FALLBACK"
            ? "Fallback"
            : quoteIds.split(",")[index] === "FREESHIPPING"
            ? "Freeshipping"
            : "Paid";

        ordersData.push({ quote_id: quoteId, order_id: orderId, price, courierName: courier, order_status: orderStatus, order_type: orderType });

        // Update Shopify order
      
        update_shopify_order_id_on_portal(
          orderId,
          parseInt(orderDetails.id),
          orderDetails?.contact_email,
          orderDetails?.shipping_address?.phone,
          orderDetails?.shipping_address?.first_name,
          orderDetails?.shipping_address?.last_name
        ).catch((error) =>
          logger.info(`Failed to update Shopify order ID on portal: ${error}`)
        );
      });

    
    }

    const order = new shopify.api.rest.Order({ session: session[0] });
    order.id = parseInt(orderDetails.id);
    order.metafields = [
      // { key: "quote_id", value: "quoteIds", type: "single_line_text_field", namespace: "Order" },
      // { key: "order_hash_id", value: "orderIds", type: "single_line_text_field", namespace: "Order" },
      // { key: "carrier_name", value: "carrierName", type: "single_line_text_field", namespace: "Order" },
      // {
      //   key: "fc_order_status",
      //   value: valuesArray[1] === "FALLBACK" ? "Fallback" : valuesArray[1] === "FREESHIPPING" ? "Freeshipping" : "Paid",
      //   type: "single_line_text_field",
      //   namespace: "Order",
      // },
      // { key: "courier_charges", value: valuesArray[2], type: "single_line_text_field", namespace: "Order" },
      { key: "order_data", value: JSON.stringify(ordersData), type: "single_line_text_field", namespace: "Order" },
    ];

    await order.save({ update: true });

    res.status(200).send(ordersData);
  } catch (error) {
    logger.info("order-create-webhook-error==", error);
    collection.insertOne({
      endPoint:"/api/webhook/order-creates",
      data_in_string:JSON.stringify(error),
          data_in_Object:error,
      message:"webhook/order-create ERROR"
    })
    res.status(500).send({ error: "An error occurred during processing" });
  }
});


 
app.post("/api/shipping-rates", bodyParser.json(), async (_req, res) => {
   
  collection.insertOne({
    endPoint:"/api/shipping-rates",
    data_in_string:JSON.stringify(_req.body),
        data_in_Object:_req.body,
    message:"shopify-webhook-hit-successfully"
  })
  try {

   
    const session = await getSessionForShippingratesAPI(
      `${_req.body.rate.origin.company_name?.replaceAll(" ","")}.myshopify.com`.toLowerCase(),
      _req.body.rate.origin.company_name
    );
 
    if (session.length === 0 || !session[0].merchant_token) {
      collection.insertOne({
        endPoint:"/api/shipping-rates",
        data_in_string:JSON.stringify(session),
        data_in_Object:session,
        message:"Merchant not found"
      })
      logger.info("Merchant not found", "session =>", session);
      res.status(200).json({ error: "Merchant not found" });
      return;
    }
    if (!session[0].merchant_locations) {
      collection.insertOne({
        endPoint:"/api/shipping-rates",
        data_in_string:JSON.stringify(session[0]),
        data_in_Object:session[0],
        
        message:"merchant_locations not found"
      })
      logger.info("merchant_locations not found");
      res.status(200).json({ error: "Merchant not found" });
      return;
    }

    const merchant = JSON.parse(session[0].merchant);
    const shipping_boxes = ParseShippingBoxes(session[0].shipping_boxes);
    if (!shipping_boxes && false || shipping_boxes?.length === 0 && false) {
      logger.info("shipping_boxes not found");
      res.status(500).json({ error: "Shipping boxes not found" });
      return;
    }
    const destination = _req.body.rate.destination;
    const merchant_locations = JSON.parse(session[0].merchant_locations);
    
    
    let courierData = await Promise.all(
      _req.body.rate.items.map(async (element) => {
        const productMetafields = await shopify.api.rest.Metafield.all({
          session: session[0],
          // metafield: {
          //   // owner_id: element.product_id,
          //   // owner_resource: "product",
          //   owner_id: element.variant_id,
          //   owner_resource: "product variant",
          // },
          variant_id:element.variant_id,
          // product_id:element.product_id,
        });
 

        const metaData = getKeyValueArray(productMetafields.data);

        let isFreeShipping =
          getValueByKey(metaData, "is_free_shipping") === "1";

        let isVirtualProduct =
          getValueByKey(metaData, "is_virtual") === "1" ? true : false;
        let locationData;
        var cal_locationData = JSON.parse(getValueByKey(metaData, "location"));

        // Get The Locations to Compare with the Destination Location
        let locations_to_compare=[];
        if (Array.isArray(cal_locationData) && cal_locationData?.length >0) {
          locations_to_compare =[...cal_locationData]
        }else{
          locations_to_compare = [...merchant_locations]
        }

        let minDistance = Infinity;
       

        for (let location of locations_to_compare) {
         let distance   = haversineDistance(
            parseFloat(destination.latitude),
            parseFloat(destination.longitude),
            parseFloat(location.latitude),
            parseFloat(location.longitude)
          );


          if (distance < minDistance) {
            minDistance = distance
            locationData = {...location}
          }
          
        }

 



        return {
          product_id: element.product_id,
          type: getValueByKey(metaData, "package_type"),
          height: getValueByKey(metaData, "height"),
          length: getValueByKey(metaData, "length"),
          width: getValueByKey(metaData, "width"),
          weight: getValueByKey(metaData, "weight"),
          productDimentions:
            JSON.parse(getValueByKey(metaData, "product_dimentions")) ?? [],
          quantity: element.quantity,
          price: parseInt(element.price) / 100,
          is_free_shipping:
            getFreeShippingFlagForUser(merchant) ??
            (isFreeShipping
              ? true
              : pickUpLocationIncluded(
                  locationData?.free_shipping_postcodes,
                  destination.postal_code
                )),
          location_id: locationData?.id,
          location_name: locationData?.location_name,
          location_address: `${locationData?.address1 ?? ""} ${
            locationData?.address2 ?? ""
          } ${locationData?.suburb ?? ""} ${locationData?.state ?? ""} ${
            locationData?.postcode ?? ""
          }`,
          location_lat: locationData?.latitude,
          location_long: locationData?.longitude,
          free_shipping_postcodes: locationData?.free_shipping_postcodes,
          free: isVirtualProduct
            ? isVirtualProduct
            : !element.requires_shipping,
          pickupLocation: locationData,
          is_flat_rate_enabled:
            Boolean(Number(locationData?.is_flat_enable)) &&
            isPostCodeIncludedInFlatRate(
              destination.postal_code,
              locationData?.flat_shipping_postcodes
            ),
          flat_price: Number(locationData?.flat_rate),
        };
      })
    );

     
    let total_cart_value = courierData.reduce(
      (acc, item) => acc + item.price,
      0
    );

    if (
      merchant.booking_preference === "free_for_basket_value_total" &&
      total_cart_value > merchant.conditional_price
    ) {
      courierData = courierData.map((item) => {
        return {
          ...item,
          is_free_shipping: true,
        };
      });
    }
    let courier_data_to_Show_end_user = { ...groupByLocation(courierData) };

    const quotes = await Promise.all( 
      Object.entries(groupByLocation(courierData)).map(
        async ([location, _items], index) => {

          // Only Process those items those are not free shipping

          let items = _items.filter((_item) => !_item.free);
          if (items.length === 0) {
            return {
              amount: 0,
              description: "Free Shipping",
              eta: "1-2 days",
              serviceCode: "FREESHIPPING",
              courierName: "Free Shipping",
              totalPrice: 0,
            };
          }
 
          let itemsArray = [];
          items.forEach((entry) => {
            let product_parts = entry.productDimentions;
            let quantity = entry.quantity;

            product_parts.forEach((__item) => {
              for (let i = 0; i < quantity; i++) {
                itemsArray.push({
                  type: __item.packageType,
                  weight: __item.weight,
                  width: __item.width,
                  height: __item.height,
                  length: __item.length,
                  isIndividual: __item.isIndividual,
                  quantity: 1,
                });
              }
            });
          });

          // IF SHIPPING BOX EXISTS
          let itemsArray_to_send_to_courier;
         

          if(shipping_boxes && shipping_boxes?.length > 0 && Array.isArray(shipping_boxes)){
           
            let individual_items = itemsArray.filter(
              (item) => item.isIndividual === "Yes"
            );

            let non_individual_items = itemsArray.filter(
              (item) => item.isIndividual === "No"
            ); 
            const _bins = shipping_boxes.map((box, idx) => {
              return {
                // name: box.package_name,
                name: `Le petite box-${idx}`,
                width: Number(box.width),
                height: Number(box.height),
                length: Number(box.length),
              };
            });
            let individual_items_packed = packItems(_bins, non_individual_items);
            
              itemsArray_to_send_to_courier = [
              ...individual_items_packed,
              ...individual_items,
            ];
          }else{
            // IF THERE ARE NO SHIPPING BOXES
itemsArray_to_send_to_courier=[
  ...itemsArray
]
          }

          
         
          // SHipping Box Functionality STOP

          let totalWeightOfItems = 0;

          items.forEach((entry) => {
            let product_parts = entry.productDimentions;
            let totalWeight = product_parts.reduce((sum, __item) => {
              const weight = parseFloat(__item.weight);
              const quantity = parseInt(entry.quantity); // Use the quantity of the product entry
              return sum + weight * quantity;
            }, 0);
            totalWeightOfItems += totalWeight;
          });

          const totalPriceOfItems = items.reduce(
            (acc, item) => acc + item.price,
            0
          );

          const payload = {
            subOrderType: "flat_rate", 
            flatPrice: items[0]?.flat_price,
            request_type: "wp",
            pickupFirstName: items[0].pickupLocation?.first_name?? "",
            pickupLastName: items[0].pickupLocation?.last_name?? "",
            pickupCompanyName: "",
            pickupEmail: items[0].pickupLocation?.email?? "",
            pickupAddress1: items[0].pickupLocation?.address1 ?? "",
            pickupAddress2: items[0].pickupLocation?.address2 ?? "",
            pickupPhone: items[0].pickupLocation?.phone?? "",
            pickupSuburb: items[0].pickupLocation?.suburb?? "",
            pickupState: items[0].pickupLocation?.state?? "",
            pickupPostcode: items[0].pickupLocation?.postcode?? "",
            pickupBuildingType: items[0].pickupLocation?.building_type?? "",
            pickupTimeWindow: `${items[0].pickupLocation?.time_window?? ""}`,
            isPickupTailLift: `${
              merchant?.is_drop_off_tail_lift
                ? Number(totalWeightOfItems > merchant.weighht)
                : 0
            }`,
            destinationSuburb: destination.city ?? "",
            destinationState: destination.province ?? "",
            destinationPostcode: destination.postal_code ?? "",
            destinationBuildingType: destination.company
              ? "commercial"
              : "residential",
            destinationFirstName: destination.name,
            destinationLastName: "",
            destinationCompanyName: "",
            destinationEmail: destination.email ?? "",
            destinationAddress1: destination.address1?? "",
            destinationAddress2: destination.address2 ?? "",
            destinationPhone: destination.phone?? "",
            parcelContent: "Order from Main Hub",
            valueOfContent: `${totalPriceOfItems}`,
            items: JSON.stringify(
              itemsArray_to_send_to_courier.map((item) =>
                Object.assign({}, item, {
                  quantity: String(item.quantity),
                  width: String(item.width),
                  height: String(item.height),
                  length: String(item.length),
                  weight: String(item.weight),
                  contents:"Other"
                })
              )
            ),
            isDropOffTailLift: merchant?.is_drop_off_tail_lift,
            orderType: "8",
          };

          
          let data; 
if (items[0]?.is_flat_rate_enabled) {

  // IF FLAT RATE ENABLED
  // IF FLAT RATE ENABLED
  // IF FLAT RATE ENABLED
  // IF FLAT RATE ENABLED
  const quote = await fetch(
    `${ session[0].is_production?.includes("1")?  "https://portal.fastcourier.com.au"   : "https://portal.fastcourier.com.au"}/api/wp/create-flate-order`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "request-type": "shopify_development",
        version: "3.1.1",
        Authorization: `Bearer ${merchant.access_token}`,
        "store-domain":
        session[0]?.id.toLowerCase(),
      },
      body: JSON.stringify(payload)
    },
  );
    data = await quote.json();

    collection.insertOne({
      endPoint:"/api/shipping-rates",
       
   
        data_in_string:JSON.stringify(data),
        data_in_Object:data,
       
      message:"with flat rate"
    })

    logger.info("with flat rate",data); 
  
}else{
 
  const quote = await fetch(
    `${ session[0].is_production?.includes("1")?  "https://portal.fastcourier.com.au"   : "https://portal.fastcourier.com.au"}/api/wp/quote?${new URLSearchParams(
      payload
    )}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "request-type": "shopify_development",
        version: "3.1.1",
        Authorization: `Bearer ${merchant.access_token}`,
        "store-domain":
        session[0]?.id.toLowerCase(), },
    }
  );
    data = await quote.json();
    collection.insertOne({
      endPoint:"/api/shipping-rates",
     
      data_in_string:JSON.stringify(data),
        data_in_Object:data,
      message:"without flat rate"
    })
    logger.info("without flat rate",data); 
     
}
     

          
          courier_data_to_Show_end_user[location] = items.map((xitem) => {
            return {
              ...xitem, 
              totalPrice: xitem?.is_flat_rate_enabled
                ? xitem?.flat_price
                : xitem?.totalPrice, 
              quoteData: {
                id: xitem?.is_free_shipping ? 999 : index,
                amount: xitem?.is_free_shipping
                  ? 0
                  : xitem?.is_flat_rate_enabled
                  ? xitem?.flat_price
                  : data?.status
                  ? `${data?.data?.priceIncludingGst}`
                  :  `${merchant?.fallback_amount}`,
              },
            };
          });

          return {
            amount: items[0]?.is_flat_rate_enabled
              ? items[0]?.flat_price
              : data?.status
              ? `${data?.data?.priceIncludingGst}`
              :  `${merchant?.fallback_amount}`,
            description:
              data?.status
                ? "Includes tracking and insurance" 
                :"Incl.Tax",
            eta: data?.data?.eta ?? "5-10 Business days",
            serviceCode: items[0]?.is_flat_rate_enabled
              ? `(FLATRATE-${data?.order_id})`
              : data?.status
              ? `(${data?.data?.id}-${data?.data?.orderHashId})` 
              :  "(FALLBACK-FALLBACK)",
            courierName: items[0]?.is_flat_rate_enabled
              ? "Flat-Rate"
              : data?.data?.courierName ?? "Shipping",
            totalPrice:
            items[0]?.is_flat_rate_enabled
            ? items[0]?.flat_price
            :data?.status
            ? `${data?.data?.priceIncludingGst}` 
            :  `${merchant?.fallback_amount}`,
            quoteData: {
              ...data,
              ...payload,
            },
          };
        }
      )
    );

   
    const totalPrice = getUniqueQuoteData(courier_data_to_Show_end_user).reduce(
      (sum, quote) => sum + parseFloat(quote?.amount ?? 0),
      0
    );
 

    const response = {
      rates: [
        {
          service_name: quotes.every(
            (quote) => quote.serviceCode === "FALLBACK"
          )
            ? "Shipping"
            : `Fast Courier [${quotes
                .map((quote) => quote.courierName)
                .join(",")}]`,
          service_code: `${quotes
            .map((quote) => quote.serviceCode)
            .join(",")}~[${quotes.map((quote) => {
            if (quote.serviceCode === "FALLBACK") {
              return "FALLBACK";
            } else if (quote.serviceCode === "FREESHIPPING") {
              return "FREESHIPPING";
            } else {
              return "PAID";
            }
          })}]~[${quotes.map((quote) =>
            parseFloat(String(quote?.totalPrice ?? 0))
          )}]`,
          // service_code: JSON.stringify(quotes),
          total_price: `${Number(totalPrice * 10 * 10)}`,
          description: quotes.map((quote) => quote.description).join(","),
          currency: "AUD",
        },
      ],
    };
    collection.insertOne({
      endPoint:"/api/shipping-rates",
  
      data_in_string:JSON.stringify(response),
        data_in_Object:response,
      message:"response"
    })
    logger.info("response",response); 
     
    res.status(200).json(response);
  } catch (error) {
    console.error("shipping-rates==", error);
    logger.info("shipping-rates-=error=", error);
    collection.insertOne({
      endPoint:"/api/shipping-rates",
      data_in_string:JSON.stringify(error),
      data_in_Object:error,
      
      message:"shipping-rates-error"
    })
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function pickUpLocationIncluded(free_pickup_locations, location_postcode) {
  // Convert location_postcode to a number
  const numB = Number(location_postcode);

  if (typeof free_pickup_locations === "string") {
    free_pickup_locations = JSON.parse(free_pickup_locations);
  }

  // Check if free_pickup_locations is an array
  if (!Array.isArray(free_pickup_locations)) {
    return false; // free_pickup_locations is not an array
  }

  // Check if location_postcode is present in free_pickup_locations after converting all elements of free_pickup_locations to numbers
  for (let i = 0; i < free_pickup_locations.length; i++) {
    const numA = Number(free_pickup_locations[i]);
    if (numA === numB) {
      return true; // Exact match found
    }
  }

  return false; // No exact match found
}

function getFreeShippingFlagForUser(_merchant, product) {
  if (_merchant.booking_preference === "free_for_all_orders") {
    return true;
  }
  // if (condition) {

  // }

  return null;
}

function getUniqueQuoteData(data) {
  const quoteDataMap = new Map();
  for (const locationKey in data) {
    if (data.hasOwnProperty(locationKey)) {
      const items = data[locationKey];
      items.forEach((item) => {
        const quoteData = item.quoteData;
        if (!quoteDataMap.has(quoteData?.id)) {
          quoteDataMap.set(quoteData?.id, quoteData);
        }
      });
    }
  }

  return Array.from(quoteDataMap.values());
}

// async function getMerchantData(access_token) {
//   const headers = {
//     Accept: "application/json",
//     "Content-Type": "application/json",
//     "request-type": "shopify_development",
//     version: "3.1.1",
//     Authorization: "Bearer " + access_token,
//   };
//   const merchant = await fetch(
//     `https://portal.fastcourier.com.au/api/wp/get_merchant`,
//     {
//       method: "GET",
//       credentials: "include",
//       headers: headers,
//     }
//   );

//   let merchant_details = await merchant.json();
//   return merchant_details;
// }
// async function getMerchantDefaultLocation(access_token, merchant_id) {
//   const headers = {
//     Accept: "application/json",
//     "Content-Type": "application/json",
//     "request-type": "shopify_development",
//     version: "3.1.1",
//     Authorization: "Bearer " + access_token,
//   };

//   const pickupLocations = await fetch(
//     `https://portal.fastcourier.com.au/api/wp/merchant_domain/locations/${merchant_id}`,
//     {
//       method: "GET",
//       credentials: "include",
//       headers: headers,
//     }
//   );

//   const locations = await pickupLocations.json();

//   const defaultPickupLocation = locations?.data?.find(
//     (element) => element.is_default == 1
//   );

//   return defaultPickupLocation;
// }
// async function getMerchantLocationDataFromTagId(
//   access_token,
//   merchant_id,
//   tagId
// ) {
//   const headers = {
//     Accept: "application/json",
//     "Content-Type": "application/json",
//     "request-type": "shopify_development",
//     version: "3.1.1",
//     Authorization: "Bearer " + access_token,
//   };
//   const merchant_location = await fetch(
//     `https://portal.fastcourier.com.au/api/wp/merchant_locations/` +
//       merchant_id +
//       "/" +
//       tagId,
//     {
//       method: "GET",
//       credentials: "include",
//       headers: headers,
//     }
//   );

//   let merchant_location_details = await merchant_location.json();
//   return merchant_location_details;
// }
// async function getMerchantLocationDataFromLocationId(
//   access_token,
//   merchant_id,
//   locationId
// ) {
//   const headers = {
//     Accept: "application/json",
//     "Content-Type": "application/json",
//     "request-type": "shopify_development",
//     version: "3.1.1",
//     Authorization: "Bearer " + access_token,
//   };
//   const merchant_location = await fetch(
//     `https://portal.fastcourier.com.au/api/wp/merchant_domain/location/` +
//       // merchant_id +
//       // "/" +
//       locationId,
//     {
//       method: "GET",
//       credentials: "include",
//       headers: headers,
//     }
//   );

//   let merchant_location_details = await merchant_location.json();
//   console.log(merchant_location_details, "merchant_location_details");
//   return merchant_location_details;
// }

async function update_shopify_order_id_on_portal(
  fastcourier_hash_id,
  shopify_order_id,
  destination_email,
  destination_phone,
  destination_first_name,
  destination_last_name
) {
 const response=  await fetch("https://portal.fastcourier.com.au/api/update-order-id", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": "shopify_development",
      version: "3.1.1",
    },
    body: JSON.stringify({
      hash_id: fastcourier_hash_id,
      order_id: shopify_order_id,
      destination_email,
      destination_phone,
      destination_first_name,
      destination_last_name

    }),
  });

  const data = await response.json()
  collection.insertOne({
    endPoint:"/api/webhook/order-create",
    data_in_string:JSON.stringify(data),
    data_in_Object:data,
    message:"update order details On Portal"
  })

  logger.info("response-response",data)
}

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

console.log([shopify, STATIC_PATH]);
// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/orders/count", async (_req, res) => {
  const countData = await shopify.api.rest.Order.all({
    session: res.locals.shopify.session,
  });
  console.log(countData);
  res.status(200).send(countData);
});

const getValueByKey = (data, key) => {
  const item = data.find((obj) => obj.key === key);
  return item ? item.value : null;
};

// APIs with authenticaion
// app.get('/oauth/shopify', (req, res) => {

//   res.redirect(`https://google.com`);
// });
app.get("/oauth/callback", async (req, res) => {
  console.log("Query Parameters:", req.query);
  // "http://portal.fastcourier.test/oauth/redirect?client_id=11&client_secret=r8i7gKonVYBS0CJQPlacd4QZFxp7FPmK4Fx6TguJ&redirect_uri=http://portal.fastcourier.test/oauth/callback"

  // res.json(user);
});

 
app.get("/api/get-merchant-token", async (_req, res) => {
  try {
    let current_session = res.locals.shopify.session;

    const session = await getSession(current_session.shop);

    if (
      session.length == 0 ||
      !session[0].merchant_token ||
      !session[0].merchant_id
    ) {
      res.status(200).send({ data: null });
      return;
    }

    res.status(200).send({ data: session[0] });
  } catch (error) {
    console.log("get-merchant=", error);
  }
});
app.get("/api/get-current-session", async (_req, res) => {
  try {
    let current_session = res.locals.shopify.session;

    // const session = await getSession(current_session.shop);

    let updated_data = await createColumnsIfNotExist(current_session.shop);

    res.status(200).send({
      data: updated_data.data,
      newlyCreatedColumns: updated_data.newlyCreatedColumns,
      existingColumns: updated_data.existingColumns,
    });
  } catch (error) {
    console.log("get-current-session-error=", error);
  }
});
app.get("/api/remove-merchant-token", async (_req, res) => {
  try {
    let current_session = res.locals.shopify.session;
    const session = await getSession(current_session.shop);
    if (session.length == 0) {
      res.status(200).send({ data: null });
      return;
    }

    let removed_token = await deleteMerchantTokenAndId(current_session.shop);

    res.status(200).send({ data: "Deleted successfully" });
  } catch (error) {
    console.log("get-merchant=", error);
  }
});

 

 
app.post("/api/set-merchant-token", bodyParser.json(), async (_req, res) => {
  try {
    const body = _req.body;
    const token = body.token;
    const merchant_domain_id = body.merchant_domain_id;
    let current_session = res.locals.shopify.session;
    console.log(
      token,
      merchant_domain_id,
      current_session.shop,
      "token,merchant_domain_id, current_session.shop"
    );
    await addMerchantToken(token, merchant_domain_id, current_session.shop);
    res.status(200).send({ message: "Merchant_token updated successfully" });
  } catch (error) {
    console.log("save-merchant=", error);
    res.status(500).send("Internal Server Error"); // Sending a generic error response
  }
});
app.post("/api/add-data-into-table", bodyParser.json(), async (_req, res) => {
  try {
    const body = _req.body;
    const columnName = body.columnName;
    const data = JSON.stringify(body.data);

    let current_session = res.locals.shopify.session;

    let updated_data = db.run(
      `UPDATE shopify_sessions SET ${columnName} = ? WHERE shop = ?`,
      [data, current_session.shop],
      function (err) {
        if (err) {
          console.log("updateMerchantId=", err);

          return false;
        }
        // if (this.changes === 0) {
        //   reject(`No rows updated. AccessToken "${shop}" not found.`);
        //   return;
        // }
        return true;
      }
    );

    if (updated_data) {
      res.status(200).send({ message: "Merchant_token updated successfully" });
    } else {
      res.status(200).send({ message: "Merchant_token NOT updated " }); // Sending a generic error response
    }
  } catch (error) {
    console.log("save-merchant=", error);
    res.status(500).send("Internal Server Error"); // Sending a generic error response
  }
});

// app.post("/api/shipping-box/create", async (_req, res) => {
//   try {
//     let current_session = res.locals.shopify.session;
//     const query = "SELECT shipping_boxes FROM shopify_sessions WHERE shop = ?";
//     let shipping_boxes = await new Promise((resolve, reject) => {
//       db.all(query, [current_session.shop], (err, rows) => {
//         if (err) {
//           logger.info("createColumnsIfNotExist-error==", err);
//           reject(err);
//           res.status(500).send({
//             err
//           });
//           return;
//         }
//         resolve(rows?.length > 0 ? rows?.[0]?.shipping_boxes : []);
//       });
//     });
//     const boxes = shipping_boxes?.length > 0 ? JSON.parse(shipping_boxes ?? "[]") : [];

//     let new_package = {
//       package_name: _req.body.package_name,
//       package_type: _req.body.package_type,
//       height: _req.body.height,
//       width: _req.body.width,
//       length: _req.body.length,
//       is_default: _req.body.is_default,
//       id: _req.body.id,
//     };

//     // Generate a new unique ID for the new box
//     let newId;
//     do {
//       newId = Math.floor(Math.random() * 1000000); // Example ID generation logic
//     } while (boxes.some((box) => box?.id === newId));

//     new_package.id = newId;
//     boxes.push(new_package);

//     // Update the database with the new list of shipping boxes
//     const updateQuery =
//       "UPDATE shopify_sessions SET shipping_boxes = ? WHERE shop = ?";
//     const updatedBoxesString = JSON.stringify(boxes);
//     await new Promise((resolve, reject) => {
//       db.run(updateQuery, [updatedBoxesString, current_session.shop], (err) => {
//         if (err) {
//           logger.info("updateShippingBoxes-error==", err);
//           res.status(500).send({
//             err
//           });
//           reject(err);
//           return;
//         }

//         resolve();
//       });
//     });

//     res.status(200).send(new_package);
//   } catch (error) {
//     console.log("shipping-box/create=", error);
//     logger.info("shipping-box/create-error==", error);
//     res.status(500).send({
//       error :JSON.stringify(error)
//     });
//   }
// });
app.post("/api/shipping-box/create", async (_req, res) => {
  try {
    let current_session = res.locals.shopify.session;
    const query = "SELECT shipping_boxes FROM shopify_sessions WHERE shop = ?";
    let shipping_boxes = await new Promise((resolve, reject) => {
      db.all(query, [current_session.shop], (err, rows) => {
        if (err) {
          logger.info("createColumnsIfNotExist-error==", err);
          reject(err);
          res.status(500).send({
            err,
          });
          return;
        }
        resolve(rows?.length > 0 ? rows?.[0]?.shipping_boxes : []);
      });
    });
    const boxes =
      shipping_boxes?.length > 0 ? JSON.parse(shipping_boxes ?? "[]") : [];

    let new_package = {
      package_name: _req.body.package_name,
      package_type: _req.body.package_type,
      height: _req.body.height,
      width: _req.body.width,
      length: _req.body.length,
      is_default: _req.body.is_default,
      id: _req.body.id,
    };

    if (_req.body.is_default === "Yes") {
      // Make all other boxes not default
      boxes.forEach((box) => {
        box.is_default = "No";
      });
    }

    if (new_package.id) {
      // Edit existing package
      let index = boxes.findIndex((box) => box.id === new_package.id);
      if (index !== -1) {
        boxes[index] = new_package;
      } else {
        return res.status(404).send({ error: "Box not found" });
      }
    } else {
      // Create new package
      // Generate a new unique ID for the new box
      let newId;
      do {
        newId = Math.floor(Math.random() * 1000000); // Example ID generation logic
      } while (boxes.some((box) => box?.id === newId));

      new_package.id = newId;
      boxes.push(new_package);
    }

    // Update the database with the new list of shipping boxes
    const updateQuery =
      "UPDATE shopify_sessions SET shipping_boxes = ? WHERE shop = ?";
    const updatedBoxesString = JSON.stringify(boxes);
    await new Promise((resolve, reject) => {
      db.run(updateQuery, [updatedBoxesString, current_session.shop], (err) => {
        if (err) {
          logger.info("updateShippingBoxes-error==", err);
          res.status(500).send({
            err,
          });
          reject(err);
          return;
        }

        resolve();
      });
    });

    res.status(200).send(new_package);
  } catch (error) {
    console.log("shipping-box/create=", error);
    logger.info("shipping-box/create-error==", error);
    res.status(500).send({
      error: JSON.stringify(error),
    });
  }
});

app.delete("/api/shipping-box/delete", async (_req, res) => {
  try {
    let current_session = res.locals.shopify.session;
    const boxToDelete = _req.body;

    const query = "SELECT shipping_boxes FROM shopify_sessions WHERE shop = ?";

    const shipping_boxes = await new Promise((resolve, reject) => {
      db.all(query, [current_session.shop], (err, rows) => {
        if (err) {
          logger.info("createColumnsIfNotExist-error==", err);
          reject(err);
          return;
        }

        resolve(rows.length > 0 ? rows[0].shipping_boxes : []);
      });
    });

    // Parse existing shipping boxes (assuming they are stored as JSON in the database)
    const boxes = shipping_boxes.length > 0 ? JSON.parse(shipping_boxes) : [];

    // Find and remove the box to delete
    const updatedBoxes = boxes.filter((box) => box.id !== boxToDelete.id);

    // Update the database with the new list of shipping boxes
    const updateQuery =
      "UPDATE shopify_sessions SET shipping_boxes = ? WHERE shop = ?";
    const updatedBoxesString = JSON.stringify(updatedBoxes);

    await new Promise((resolve, reject) => {
      db.run(updateQuery, [updatedBoxesString, current_session.shop], (err) => {
        if (err) {
          logger.info("updateShippingBoxes-error==", err);
          reject(err);
          return;
        }

        resolve();
      });
    });

    res.status(200).send(updatedBoxes);
  } catch (error) {
    console.log("delete-shipping-box-error=", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/shipping-boxes", async (_req, res) => {
  try {
    let current_session = res.locals.shopify.session;

    const query = "SELECT shipping_boxes FROM shopify_sessions WHERE shop = ?";

    db.all(query, [current_session.shop], (err, rows) => {
      if (err) {
        logger.info("createColumnsIfNotExist-error==", err);
        res.status(500).send([]);
        return;
      }

      const shipping_boxes = rows[0].shipping_boxes
        ? rows[0].shipping_boxes
        : [];
      res.status(200).send(shipping_boxes);
    });
  } catch (error) {
    console.log("shipping-box=", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/get-token", async (_req, res) => {
  try {
    const products = await shopify.api.rest.Product.all({
      session: res.locals.shopify.session,
    });
    res.status(200).send(products);
  } catch (error) {
    console.log("get-token=", error);
  }
});

app.post("/api/product/add-dimensions", async (_req, res) => {
  try {
    const {
      // package_type,
      // height,
      // width,
      // length,
      // weight,
      // isIndividual,
      productDimentions,
      product_ids,
      variant_ids,
    } = _req.body;
    const session = res.locals.shopify.session;

    let metaFields_list = [
      // package_type,
      // height,
      // width,
      // length,
      // weight,
      // isIndividual,
      productDimentions,
    ];

    let products = [];

    const metafields_Item = [
      {
        key: "product_dimentions",
        type: "single_line_text_field",
        namespace: "Product",
      },
      // {
      //   key: "height",
      //   type: "single_line_text_field",
      //   namespace: "Product",
      // },
      // {
      //   key: "width",
      //   type: "single_line_text_field",
      //   namespace: "Product",
      // },
      // {
      //   key: "length",
      //   type: "single_line_text_field",
      //   namespace: "Product",
      // },
      // {
      //   key: "weight",
      //   type: "single_line_text_field",
      //   namespace: "Product",
      // },
      // {
      //   key: "is_individaul", // Corrected key name
      //   type: "single_line_text_field",
      //   namespace: "Product",
      // },
    ];

    // Process product_ids
    if (product_ids?.length > 0) {
      for (const productId of product_ids) {
        const metafieldPromises = metafields_Item.map(async (item, index) => {
          return limiter.schedule(async () => {
            const metafield = new shopify.api.rest.Metafield({ session });
            metafield.variant_id = parseInt(productId);
            metafield.key = item.key;

            metafield.value = JSON.stringify(metaFields_list[index]);
            // metafield.type = "single_line_text_field";
            // metafield.type = "json";
            // metafield.namespace = "Product";
            metafield.type = "single_line_text_field"; 
            metafield.namespace = "Product Variant";
            // Assign value from metaFields_list
            await metafield.save({ update: true });
            return metafield;
          });
        });

        const savedMetafields = await Promise.all(metafieldPromises);
        products.push(...savedMetafields);
      }
    }

    // Process variant_ids
    if (variant_ids?.length > 0) {
      for (const variantId of variant_ids) {
        const metafieldPromises = metafields_Item.map(async (item, index) => {
          return limiter.schedule(async () => {
            const metafield = new shopify.api.rest.Metafield({ session });
            metafield.variant_id = parseInt(variantId);
            metafield.key = item.key;
            metafield.value = JSON.stringify(metaFields_list[index]);

            metafield.type = "single_line_text_field"; 
            metafield.namespace = "Product Variant";
            await metafield.save({ update: true });
            return metafield;
          });
        });

        const savedMetafields = await Promise.all(metafieldPromises);
        products.push(...savedMetafields);
      }
    }
    res.status(200).send(products);
  } catch (error) {
    console.log("add-dimensions==", error);
  }
});
app.post("/api/product/add-excel-data", async (_req, res) => {
  try {
    const { excelArrayData } = _req.body;
    const session = res.locals.shopify.session;

    const excelDataPromises = excelArrayData.map(async (item, index) => {
      try {
        if (item["type"]?.trim() === "Product") {
          return limiter.schedule(async () => {
            try {
              const metafield = new shopify.api.rest.Metafield({ session });
              metafield.variant_id = parseInt(item.id);
              metafield.key = "product_dimentions";
              metafield.value = JSON.stringify(item?.productDimentions);
              // metafield.type = "json";
              // metafield.namespace = "Product";
              metafield.type = "single_line_text_field";
              metafield.namespace = "Product Variant";

              // Save metafield and handle error
              await metafield.save({ update: true });
              return metafield;
            } catch (error) {
              console.error(
                `Error saving metafield for product ${item.id}:`,
                error
              );
              logger.info(
                `Error saving metafield for product ${item.id}:`,
                error
              );
              // logger.info(JSONI.stringify(item));
              // Re-throw error to ensure it's handled properly
            }
          });
        } else {
          return limiter.schedule(async () => {
            try {
              const metafield = new shopify.api.rest.Metafield({ session });
              metafield.variant_id = parseInt(item.id);
              metafield.key = "product_dimentions";
              metafield.value = JSON.stringify(item?.productDimentions);
              metafield.type = "single_line_text_field";
              metafield.namespace = "Product Variant";

              // Save metafield and handle error
              await metafield.save({ update: true });
              return metafield;
            } catch (error) {
              console.error(
                `Error saving metafield for variant ${item.id}:`,
                error
              );
              logger.info(
                `Error saving metafield for variant ${item.id}:`,
                error
              );
              // logger.info(JSONI.stringify(item));

              // Re-throw error to ensure it's handled properly
            }
          });
        }
      } catch (error) {
        console.error(
          `Error in scheduling task for item at index ${index}:`,
          error
        );
        throw error; // Ensure the error gets propagated to the main flow
      }
    });

    // Wait for all promises to resolve
    const result = await Promise.allSettled(excelDataPromises);
    res.status(200).send(result);
  } catch (error) {
    console.error("add-dimensions==", error);
    logger.info("Excel Data filling Error", error);
    res.status(500).send("An error occurred while processing the excel data");
  }
});


// app.post("/api/product/add-location", async (_req, res) => {
//   try {
//     const { location_name, product_ids, variant_ids } = _req.body;
//     const session = res.locals.shopify.session;
//     var products = [];
//     if (product_ids.length > 0) {
//       product_ids.forEach(async (element) => {
//         // const product = new shopify.api.rest.Product({ session: session });
//         // product.id = parseInt(element);
//         // product.metafields = [
//         //   {
//         //     key: "location",
//         //     value: location_name,
//         //     type: "single_line_text_field",
//         //     namespace: "Product",
//         //     // namespace: "global",
//         //   },
//         // ];

//         // await product.save({
//         //   update: true,
//         // });

//         // products.push(product);
//         const metafield = new shopify.api.rest.Metafield({
//           session: session,
//         });
//         metafield.product_id = parseInt(element);
//         metafield.namespace = "Product";
//         metafield.key = "location";
//         metafield.type = "single_line_text_field";
//         metafield.value = location_name;
//         await metafield.save({
//           update: true,
//         });
//       });
//     }

//     console.log(variant_ids, "variant_ids");
//     if (variant_ids.length > 0) {
//       variant_ids.forEach(async (element) => {
//         // const variant = new shopify.api.rest.Variant({ session: session });
//         // variant.id = parseInt(element);

//         // variant.metafields = [
//         //   {
//         //     key: "location",
//         //     value: location_name,
//         //     type: "single_line_text_field",
//         //     namespace: "Product Variant",
//         //   },
//         // ];

//         // await variant.save({
//         //   update: true,
//         // });

//         const metafield = new shopify.api.rest.Metafield({
//           session: session,
//         });
//         metafield.variant_id = parseInt(element);
//         metafield.namespace = "Product Variant";
//         metafield.key = "location";
//         metafield.type = "single_line_text_field";
//         metafield.value = location_name;
//         await metafield.save({
//           update: true,
//         });
//       });
//     }
//     res.status(200).send(products);
//   } catch (error) {
//     console.log("add-location==", error);
//   }
// });
// const Bottleneck = require('bottleneck');

// Create a limiter with a maximum of 2 requests per second
const limiter = new Bottleneck({
  maxConcurrent: 1, // Ensure only one request is processed at a time
  minTime: 500, // Set a minimum time of 500 milliseconds between requests (2 requests per second)
});

app.post("/api/product/add-location", async (_req, res) => {
  try {
    const { location_name, product_ids, variant_ids } = _req.body;
    const session = res.locals.shopify.session;
    let productMetafieldsList = [];
    let VariantsMetafieldsList = [];

    
    //Process product_ids
    if (product_ids.length > 0) {
      productMetafieldsList = await Promise.all(
        product_ids.map(async (element) => {
          await limiter.schedule(async () => {
            const metafield = new shopify.api.rest.Metafield({
              session: session,
            });
            // metafield.product_id = parseInt(element);
            // metafield.namespace = "Product";
            // metafield.key = "location"; 
            // metafield.type = "single_line_text_field";
            // metafield.value = JSON.stringify(location_name);
            metafield.variant_id = parseInt(element);
            metafield.namespace = "Product Variant";
            metafield.key = "location"; 
            metafield.type = "single_line_text_field";
            metafield.value = JSON.stringify(location_name);
            await metafield.save({
              update: true,
            });
          });
        })
      );
    }

    // Process variant_ids
    if (variant_ids.length > 0) {
      VariantsMetafieldsList = await Promise.all(
        variant_ids.map(async (element) => {
          await limiter.schedule(async () => {
            const metafield = new shopify.api.rest.Metafield({
              session: session,
            });
            metafield.variant_id = parseInt(element);
            metafield.namespace = "Product Variant";
            metafield.key = "location"; 
            metafield.type = "single_line_text_field";
            metafield.value = JSON.stringify(location_name);
            await metafield.save({
              update: true,
            });
          });
        })
      );
    }

    res.status(200).send({
      productMetafieldsList,
      VariantsMetafieldsList,
    });
  } catch (error) {
    console.log("add-location==", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/free-shipping", async (_req, res) => {
  try {
    const { productId, isFreeShipping } = _req.body;
    const session = res.locals.shopify.session;
    // const order = new shopify.api.rest.Order({ session: session });
    // order.id = productId;

    const value = isFreeShipping === true ? "1" : "0";

    const metafield = new shopify.api.rest.Metafield({
      session: session,
    });
    // metafield.product_id = productId;
    metafield.variant_id = parseInt(productId);

    // metafield.namespace = "Order";
    metafield.namespace = "Product Variant";

    metafield.key = "is_free_shipping";
    metafield.type = "single_line_text_field";
    metafield.value = value;
    await metafield.save({
      update: true,
    });

    res.status(200).send(metafield);
  } catch (error) {
    console.log("free-shipping=", error);
  }
});
app.post("/api/get-order-metafields", async (_req, res) => {
  try {
    const { orderId } = _req.body;
    const session = res.locals.shopify.session;

    const order_metafields = await shopify.api.rest.Metafield.all({
      session: session,
      metafield: {
        owner_id: orderId,
        owner_resource: "order",
      },
    });

    res.status(200).send(order_metafields);
  } catch (error) {
    console.log("order-Metafields=", error);
    logger.info("order-Metafields-==", error);
  }
});
app.post("/api/virtual-shipping", async (_req, res) => {
  try {
    const { productId, isVirtual } = _req.body;
    const session = res.locals.shopify.session;

    const value = isVirtual === true ? "1" : "0";

    const metafield = new shopify.api.rest.Metafield({
      session: session,
    });
    metafield.product_id = productId;
    metafield.namespace = "Order";
    metafield.key = "is_virtual";
    metafield.type = "single_line_text_field";
    metafield.value = value;
    await metafield.save({
      update: true,
    });

    res.status(200).send(metafield);
  } catch (error) {
    console.log("free-shipping=", error);
  }
});

app.get("/api/carrier-services", async (_req, res) => {
  try {
    const carriers = await shopify.api.rest.CarrierService.all({
      session: res.locals.shopify.session,
    });
    res.status(200).send(carriers);
  } catch (error) {
    console.log("carrier-services=", error);
  }
});

app.post("/api/carrier-service/create", async (_req, res) => {
  try {
    const carrier_service = new shopify.api.rest.CarrierService({
      session: res.locals.shopify.session,
    });

    carrier_service.name = "Fast Courier";

    carrier_service.callback_url =
      "https://shop.fastcourier.com.au/api/shipping-rates";
    carrier_service.service_discovery = true;
    await carrier_service.save({
      update: true,
    });
    res.status(200).send(carrier_service);
  } catch (error) {
    console.log("carrier-create=", error);
    res.status(500).send(error);

  }
});

app.post(
  "/api/carrier-service/update",
  bodyParser.json(),
  async (_req, res) => {

     
    try {
      const body = _req.body;
      const id = body?.id;
      const carrier_service = new shopify.api.rest.CarrierService({
        session: res.locals.shopify.session,
      });
      carrier_service.id = id ?? 68618911963;
      carrier_service.name = "Fast Courier"; // Update the name if needed
      carrier_service.callback_url =
        "https://shop.fastcourier.com.au/api/shipping-rates";
      await carrier_service.save({
        update: true,
      });

      // Get All Webhooks List
      const webhook_URL =
        "https://shop.fastcourier.com.au/api/webhook/order-create";
      const webhooks = await shopify.api.rest.Webhook.all({
        session: res.locals.shopify.session,
      });

      const unused_webhooks = webhooks.data.filter(
        (webhook) =>
          webhook.topic === "orders/paid" && webhook.address !== webhook_URL
      );

      // Delete All Unused Webhooks
      unused_webhooks.forEach(async (_webhook) => {
        await shopify.api.rest.Webhook.delete({
          session: res.locals.shopify.session,
          id: Number(_webhook.id),
        });
      });
      // Create Webhook if doesnt exist
      const if_webhook_exist = webhooks.data.find(
        (webhook) =>
          webhook.topic === "orders/paid" && webhook.address === webhook_URL
      );
      if (if_webhook_exist) {
        // logger.info("Webhook Already Exist==", if_webhook_exist);,,
      } else {
        const webhook = new shopify.api.rest.Webhook({
          session: res.locals.shopify.session,
        });
        webhook.address = webhook_URL;
        webhook.topic = "orders/paid";
        webhook.format = "json";
        await webhook.save({
          update: true,
        });
      }

     
 
      res.status(200).send(carrier_service);
    } catch (error) {
      console.log("carrier-update=", error);
      logger.info("carrier-update-==", error);
      res.status(500).send(error);

    }
  }
);

app.get("/api/orders", async (_req, res) => {
  try {
    const orders = await shopify.api.rest.Order.all({
      session: res.locals.shopify.session,
      status: "any",
    });
    res.status(200).send(orders);
  } catch (error) {
    console.log("orders=", error);
  }
});

app.get("/api/order-metafields", async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });
    const queryString = `{
    orders(first: 200, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          metafields(first: 15) {
            edges {
              node {
                key
                value
              }
            }
          }
        }
      }
    }
  }`;
  //   const queryString = `{
  //   orders(first: 200) {
  //     edges {
  //       node {
  //         id
  //         metafields(first: 15) {
  //           edges {
  //             node {
  //               key
  //               value
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }`;
   


    const data = await client.query({
      data: queryString,
    });
    res.status(200).send(data);
  } catch (error) {
    console.log("order-metafields=", error);
    logger.info("order-metafields-==", error);
  }
});

app.post("/api/hold-orders", async (_req, res) => {
  const { orders } = _req.body;
  const session = res.locals.shopify.session;
  let _orders = parseOrderData(orders);

  if (_orders?.length > 0) {
    const metafieldsPromises = _orders.map(async (order, orderIndex) => {
      let order_data_metafield = getOrderDataMetaField(order);
      order_data_metafield = order_data_metafield.map((item) => {
        return {
          ...item,
          order_status: "Hold",
        };
      });

      const metafield = new shopify.api.rest.Metafield({ session });
      metafield.order_id = parseInt(order.id);
      metafield.key = "order_data";
      metafield.value = JSON.stringify(order_data_metafield);
      metafield.type = "single_line_text_field";
      metafield.namespace = "Order";

      // Assign value from metaFields_list
      return metafield.save({ update: true });
    });

    await Promise.all(metafieldsPromises);
  }

  res.status(200).send({});
  return;
});

app.post("/api/book-orders", bodyParser.json(), async (_req, res) => {
  try {
    const { orders, collectionDate, orderStatuses } = _req.body;
    const session = res.locals.shopify.session;

    let _orders = parseOrderData(orders);
    var processedOrders = 0;
    var rejectedOrders = 0;

  
    
    if (_orders?.length > 0) {
      const metafieldsPromises = _orders.map(async (order, orderIndex) => {
        let order_data_metafield = getOrderDataMetaField(order); 
        orderStatuses[orderIndex].forEach((orderStatus, orderStatusIndex) => {
          const { status, errors } = orderStatus;
          order_data_metafield[orderStatusIndex].order_status = status
            ? "Processed"
            : "Rejected";
          order_data_metafield[orderStatusIndex].errors = status
            ? null
            : errors.join(",");

            if (status) {
              processedOrders++;
            } else {
              rejectedOrders++;
            }
        });

       

        

        const metafield = new shopify.api.rest.Metafield({ session });
        metafield.order_id = parseInt(order.id);
        metafield.key = "order_data";
        metafield.value = JSON.stringify(order_data_metafield);
        metafield.type = "single_line_text_field";
        metafield.namespace = "Order";

        // Assign value from metaFields_list
        return metafield.save({ update: true });
      });

      await Promise.all(metafieldsPromises);
      res.status(200).send({
        metafieldsPromises,
        processedOrders,
        rejectedOrders,
        success:true
      });
       return
    }
    res.status(200).send({
      processedOrders: 0
    });

    return
 
  } catch (error) {
    console.log("book-orders=", error);
    logger.info("book-orders-error==", error);
    res.status(200).send({ error: error,processedOrders: 0 });
  }
});

app.get("/api/products", async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const cursor = _req.query.cursor;
    const searchString = _req.query.searchString;
    const client = new shopify.api.clients.Graphql({ session });
    const queryString = `{
      products(first: 20 ${cursor ? `, after: "${cursor}"` : ''} ${searchString ? `, query: "${searchString}"` : ''}) {
        edges {
          node {
            id
            title
            metafields(first: 15) {
              edges {
                node {
                  key
                  value
                }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                  requiresShipping
                  metafields(first: 15) {
                    edges {
                      node {
                        key
                        value
                      }
                    }
                  }
                }
                cursor # Cursor for each variant
              }
            }
          }
          cursor # Cursor for each product
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }`;
    

    const data = await client.query({
      data: queryString,
    });
    res.status(200).send(data);
  } catch (error) {
    console.log("products==", error);
  }
});

app.post("/api/set-order-metafields", async (_req, res) => {
  try {
    const {
      quoteId,
      orderHashId,
      orderId,
      carrierName,
      orderStatus,
      courierCharges,
    } = _req.body;
    const order = new shopify.api.rest.Order({
      session: res.locals.shopify.session,
    });
    order.id = parseInt(orderId);
    order.metafields = [
      {
        key: "quote_id",
        value: quoteId,
        type: "single_line_text_field",
        namespace: "Order",
      },
      {
        key: "order_hash_id",
        value: orderHashId,
        type: "single_line_text_field",
        namespace: "Order",
      },
      {
        key: "carrier_name",
        value: carrierName,
        type: "single_line_text_field",
        namespace: "Order",
      },
      {
        key: "fc_order_status",
        value: orderStatus,
        type: "single_line_text_field",
        namespace: "Order",
      },
      {
        key: "courier_charges",
        value: courierCharges,
        type: "single_line_text_field",
        namespace: "Order",
      },
    ];

    await order.save({
      update: true,
    });
    res.status(200).send(order);
  } catch (error) {
    console.log("set-order-metafields=", error);
  }
});

app.get("/api/process-order/:orderId", async (_req, res) => {
  try {
    const orderId = _req.params.orderId;
    const order = new shopify.api.rest.Order({
      session: res.locals.shopify.session,
    });
    order.id = parseInt(orderId);
    order.metafields = [
      {
        key: "fc_order_status",
        value: "Processed",
        type: "single_line_text_field",
        namespace: "Order",
      },
    ];
    await order.save({
      update: true,
    });
    res.status(200).send(order);
  } catch (error) {
    console.log("process-order=", error);
  }
});

app.get("/api/get-order/:orderId", async (_req, res) => {
  try {
    const orderId = _req.params.orderId;
    const order = await shopify.api.rest.Order.find({
      session: res.locals.shopify.session,
      id: parseInt(orderId),
    });
    res.status(200).send(order);
  } catch (error) {
    console.log("get-order=", error);
  }
});

app.get("/api/get-checkout/:checkoutToken", async (_req, res) => {
  try {
    const checkoutToken = _req.params.checkoutToken;
    const checkout = await shopify.api.rest.Checkout.find({
      session: res.locals.shopify.session,
      token: checkoutToken,
    });
    res.status(200).send(checkout);
  } catch (error) {
    console.log("get-checkout=", error);
  }
});

app.post("/api/carrier-service/delete", async (_req, res) => {
  try {
    const deleted_data = await shopify.api.rest.CarrierService.delete({
      session: res.locals.shopify.session,
      id: 69140578549,
    });

    res.status(200).send(deleted_data);
  } catch (error) {
    console.log("carrier-delete=", error);
  }
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

function parseOrderData(orders) {
  return orders?.map((order) => {
    const newEdges = order.node.metafields.edges.map((edge) => {
      if (edge.node.key === "order_data") {
        try {
          edge.node.value = JSON.parse(edge.node.value);
        } catch (e) {
          console.error("Failed to parse order_data:", edge.node.value);
        }
      }
      return edge;
    });

    return {
      ...order,
      node: {
        ...order.node,
        metafields: {
          edges: newEdges,
        },
      },
    };
  });
}

function getOrderDataMetaField(order) {
  for (const edge of order.node.metafields.edges) {
    if (edge.node.key === "order_data") {
      try {
        return edge.node.value;
      } catch (e) {
        console.error("Failed to parse order_data:", edge.node.value);
        return null;
      }
    }
  }
  return null; // Return null if order_data metafield is not found
}

async function addMerchantToken(merchantToken, merchantId, shop) {
  return new Promise((resolve, reject) => {
    // Check if the column exists
    db.get("PRAGMA table_info(shopify_sessions)", async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      let columnExists = await isMerchantColumnExist("merchant_token");

      if (!columnExists) {
        Promise.all([
          addColumn("merchant_token", "TEXT"),
          addColumn("merchant_refresh_token", "TEXT"),
          addColumn("merchant_id", "TEXT"),
          addColumn("merchant_locations", "TEXT"), // Add other columns as needed
          addColumn("merchant_tags", "TEXT"),
          addColumn("merchant", "TEXT"),
          addColumn("is_production", "TEXT", "false"),
          // Add more columns here
        ])
          .then(() => {
            console.log(shop, "accessTokenaccessToken");
            updateMerchantToken(
              merchantToken,
              merchantId,
              shop,
              resolve,
              reject
            );
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        // If the column exists, directly insert the merchant ID
        updateMerchantToken(merchantToken, merchantId, shop, resolve, reject);
      }
    });
  });
}

async function createColumnsIfNotExist(
  shop,
  columnNames = [
    { name: "merchant_token", type: "TEXT", defaultValue: null },
    { name: "merchant_refresh_token", type: "TEXT", defaultValue: null },
    { name: "merchant_token_expires_at", type: "TEXT", defaultValue: null },
    { name: "client_id", type: "TEXT", defaultValue: null },
    { name: "client_secret", type: "TEXT", defaultValue: null },
    { name: "merchant_id", type: "TEXT", defaultValue: null },
    { name: "merchant_locations", type: "TEXT", defaultValue: null },
    { name: "merchant_tags", type: "TEXT", defaultValue: null },
    { name: "merchant", type: "TEXT", defaultValue: null },
    { name: "is_production", type: "TEXT", defaultValue: true },
    { name: "shipping_boxes", type: "TEXT", defaultValue: null },
  ]
) {
  return new Promise((resolve, reject) => {
    // Check if the columns exist
    try {
      const query = "SELECT * FROM shopify_sessions WHERE shop = ?";

      db.all(query, [shop], async (err, rows) => {
        if (err) {
          logger.info("createColumnsIfNotExist-error==", err);
          reject(err);
          return;
        }

        const existingColumns = Object.keys(rows[0]);
        const columnsToCreate = columnNames.filter(
          (column) => !existingColumns.includes(column.name)
        );
        const newlyCreatedColumns = [];

        for (const column of columnsToCreate) {
          try {
            await addColumn(column.name, column.type, column.defaultValue);
            newlyCreatedColumns.push(column.name);
          } catch (error) {
            reject(error);
            return;
          }
        }

        resolve({
          success: true,
          data: rows[0],
          existingColumns: existingColumns,
          newlyCreatedColumns: newlyCreatedColumns,
        });
      });
    } catch (error) {}
  });
}

function addColumn(name, type, defaultValue) {
  return new Promise((resolve, reject) => {
    let sql = `ALTER TABLE shopify_sessions ADD COLUMN ${name} ${type}`;
    if (defaultValue) {
      sql += ` DEFAULT ${defaultValue}`;
    }

    db.run(sql, (err) => {
      if (err) {
        logger.info("ALTER TABLE shopify_sessions ADD COLUMN-error==", err);
        reject(err);
      } else {
        resolve("Column added successfully");
      }
    });
  });
}

function updateMerchantToken(merchantToken, merchantId, shop, resolve, reject) {
  db.run(
    "UPDATE shopify_sessions SET merchant_token = ?, merchant_id = ? WHERE shop = ?",
    [merchantToken, merchantId, shop],
    function (err) {
      if (err) {
        console.log("updateMerchantId=", err);
        reject(err);
        return;
      }
      // if (this.changes === 0) {
      //   reject(`No rows updated. AccessToken "${shop}" not found.`);
      //   return;
      // }
      resolve(
        `Merchant ID ${merchantToken} updated successfully for AccessToken "${shop}".`
      );
    }
  );
}
async function deleteMerchantTokenAndId(
  shop,
  resolve = (err) => {},
  reject = (data) => {}
) {
  db.run(
    "UPDATE shopify_sessions SET merchant_token = NULL, merchant_refresh_token = NULL, merchant_id = NULL WHERE shop = ?",
    [shop],
    function (err) {
      if (err) {
        console.log("deleteMerchantTokenAndId=", err);
        reject(err);
        return;
      }
      if (this.changes === 0) {
        reject(`No rows updated. Shop "${shop}" not found.`);
        return;
      }
      resolve(`Merchant token and ID deleted successfully for shop "${shop}".`);
    }
  );
}

function sumArray(array) {
  return array.reduce((total, currentValue) => total + currentValue, 0);
}

function ParseShippingBoxes(_value) {
  try {
    return JSON.parse(_value);
  } catch (error) {
    return "";
  }
}
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function groupByLocation(products) {
  const locationItems = {};

  products.forEach((product) => {
    const { location_id } = product;

    if (!locationItems[location_id]) {
      locationItems[location_id] = [];
    }

    locationItems[location_id].push(product);
  });

  return locationItems;
}
function packItems(_bins, _items, level = 0) {
 
  try {
    let packer = new Packer();
  let bin_itemsto_send = [];

  let bins = _bins.map(
    (bin) =>
      new Bin(
        `${bin?.name ?? "Box"}-${level}`,
        bin.width,
        bin.height,
        bin.length,
        1000000000000
      )
  );
  let items = _items.map(
    (item) =>
      new Item(item.name, item.width, item.height, item.length, item.weight)
  );
  bins.forEach((bin) => packer.addBin(bin));
  items.forEach((item) => packer.addItem(item));
  packer.pack();
  let packedItems = bins.map((bin) => ({
    ...bin,
    length: bin.depth,
    sub_packs: bin.items,
  }));

  packedItems.forEach((bin) => {
    if (bin.sub_packs.length > 0) {
      bin_itemsto_send.push(bin);
    }
  });
  if (packer.unfitItems.length > 0) {
    let updatedItems = packer.unfitItems.map((item) => ({
      ...item,
      width: item.height / 100000,
      height: item.width / 100000,
      length: item.depth / 100000,
      weight: item.weight / 100000,
    }));
    let newItems = packItems(_bins, updatedItems, level + 1);
    bin_itemsto_send = bin_itemsto_send.concat(newItems);
  }



  return processBoxes(
    JSON.parse(JSON.stringify(bin_itemsto_send))
  );

   
  } catch (error) {
    collection.insertOne({
      endPoint:"packItems  Function",
      data_in_string:JSON.stringify(error),
      data_in_Object:error,
      
      message:"packItems  Function-error"
    })
    return _items
  }
  
}
function processBoxes(boxes) {
  return boxes.map((box) => ({
    name: box.name,
    type: "box",
    quantity: 1,
    width: box.width ? box.width / 100000 : null,
    height: box.height ? box.height / 100000 : null,
    length: box.depth ? box.depth / 100000 : null,
    weight:
      box.items.reduce((acc, item) => acc + (item.weight || 0), 0) / 100000,
    sub_packs: box.items.map((pack) => ({
      name: pack.name,
      width: pack.width ? pack.width / 100000 : null,
      height: pack.height ? pack.height / 100000 : null,
      length: pack.depth ? pack.depth / 100000 : null,
      weight: pack.weight ? pack.weight / 100000 : null,
      type: "box",
      quantity: 1,
    })),
  }));
}

function isPostCodeIncludedInFlatRate(postCode, flatRatePostCodes = 
  "1000,2000,300-800"
) {
  const postCodes = flatRatePostCodes.split(",");
   
  for (let i = 0; i < postCodes.length; i++) {
    const postCodeRange = postCodes[i].split("-");
    
    if (postCodeRange.length === 1) {
      if (parseInt(postCode) === parseInt(postCodes[i])) {
        return true;
      }
    } else if (postCodeRange.length === 2) {
      const start = parseInt(postCodeRange[0]);
      const end = parseInt(postCodeRange[1]);
      if (parseInt(postCode) >= start && parseInt(postCode) <= end) {
        return true;
      }
    }
  }
  return false;
} 

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);


 
 