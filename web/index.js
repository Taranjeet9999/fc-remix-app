// @ts-check
import { join } from "path";
import { readFileSync } from "fs";

import express from "express";
import serveStatic from "serve-static";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import Bottleneck from "bottleneck";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import log4js from "log4js";
// import * as BinPacking3D from "binpackingjs";
// import  BP3D  from 'binpackingjs';
// const { Item, Bin, Packer } = BP3D;

// // import BinPacking3D from "binpackingjs";
// // // const BinPacking3D = require("binpackingjs").BP3D;
// const {  Bin, Packer } = BinPacking3D.BinPacking;

// Create a logger object
// const logger = log4js.getLogger();

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
  logger.info("getSession==", shop);
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

const url = "mongodb://localhost:27017";
const database = "local";
const client = new MongoClient(url);

async function getConnection() {
  let result = await client.connect();
  return result.db(database);
}
const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);
// const PORT = "8081";

console.log("PORT==", PORT);

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

const getCodes = (data) => {
  const item = data.find((obj) => obj.source === "Fast Courier");
  return item ? item.code : null;
};

function extractIds(input) {
  // Define the regular expression to match the pattern (quoteid, orderid)
  const regex = /\(([^,]+),([^,]+)\)/g;

  // Initialize arrays to store the quoteids and orderIds
  const quoteids = [];
  const orderIds = [];

  let match;
  // Use a loop to find all matches
  while ((match = regex.exec(input)) !== null) {
    // match[1] is the quoteid and match[2] is the orderid
    quoteids.push(match[1]);
    orderIds.push(match[2]);
  }

  // Convert the arrays to comma-separated strings
  const quoteidsStr = quoteids.join(',');
  const orderIdsStr = orderIds.join(',');

  return {
    quoteIds: quoteidsStr,
    orderIds: orderIdsStr
  };
}

const getCarrier = (data) => {
  const item = data.find((obj) => obj.source === "Fast Courier");
  const title = item ? item.title : null;
  const startIndex = title.indexOf("[");
  const endIndex = title.indexOf("]");
  // Extract the substring between '[' and ']'
  const carrierName = title.substring(startIndex + 1, endIndex);
  return carrierName;
};

app.post("/api/webhook/order-create", bodyParser.json(), async (_req, res) => {
  try {
    const session = await getSession(
      `${new URL(_req.body.order_status_url).hostname}`.toLowerCase()
    );
    let orderDetails = _req.body;
    const codes = getCodes(orderDetails.shipping_lines);
    if (codes != null) {
      const valuesArray = codes.split("~"); // FORMAT=====YQOXXZXPVO~PAID~195.26

      // Trim the quotes from each value and assign them to variables
      const { quoteIds } = extractIds(valuesArray[0]);
      const { orderIds } = extractIds(valuesArray[0]);

      const carrierName = getCarrier(orderDetails.shipping_lines);
      console.log("carrierName", carrierName);

      const order = new shopify.api.rest.Order({
        session: session[0],
      });
      order.id = parseInt(orderDetails.id);
      order.metafields = [
        {
          key: "quote_id",
          value: quoteIds,
          type: "single_line_text_field",
          namespace: "Order",
        },
        {
          key: "order_hash_id",
          value: orderIds,
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
          value:
            valuesArray[valuesArray.length - 2] === "FALLBACK"
              ? "Fallback"
              : valuesArray[valuesArray.length - 2] === "FREESHIPPING"
              ? "Freeshipping"
              : "Paid",
          type: "single_line_text_field",
          namespace: "Order",
        },
        {
          key: "courier_charges",
          value: valuesArray[valuesArray.length - 1],
          type: "single_line_text_field",
          namespace: "Order",
        },
      ];

      await order.save({
        update: true,
      });
      res.status(200).send(order);
    }
  } catch (error) {
    logger.info("order-create-webhook-error==", error);
  }
});
app.post("/api/shipping-rates", bodyParser.json(), async (_req, res) => {
  try {
    const session = await getSession(
      `${_req.body.rate.origin.company_name}.myshopify.com`.toLowerCase()
    );

    if (session.length === 0 || !session[0].merchant_token) {
      res.status(200).json({ error: "Merchant not found" });
      return;
    }
    if (!session[0].merchant_locations) {
      res.status(200).json({ error: "Merchant not found" });
      return;
    }

    const merchant = JSON.parse(session[0].merchant);

    const destination = _req.body.rate.destination;
    const merchant_locations = JSON.parse(session[0].merchant_locations);
    const merchant_default_location = merchant_locations.find(
      (element) => element.is_default == 1
    );
    const merchant_tags = JSON.parse(session[0].merchant_tags);
    let courierData = await Promise.all(
      _req.body.rate.items.map(async (element) => {
        const productMetafields = await shopify.api.rest.Metafield.all({
          session: session[0],
          metafield: {
            owner_id: element.product_id,
            owner_resource: "product",
          },
        });

        const metaData = getKeyValueArray(productMetafields.data);

        let isFreeShipping =
          getValueByKey(metaData, "is_free_shipping") === "1";
        var locationData;
        var cal_locationData = JSON.parse(getValueByKey(metaData, "location"));
        if (cal_locationData.type === "tag") {
          const filteredLocations = merchant_locations.filter((location) => {
            if (location.tag && location.tag !== "[]") {
              const tags = location.tag.split(",").map(Number);
              return tags.includes(Number(cal_locationData.value.id));
            }
            return false;
          });

          if (filteredLocations.length === 0) {
            locationData = { ...merchant_default_location };
          } else {
            locationData = filteredLocations[0];

            if (destination.latitude && destination.longitude) {
              let minDistance = haversineDistance(
                parseFloat(destination.latitude),
                parseFloat(destination.longitude),
                parseFloat(locationData.latitude),
                parseFloat(locationData.longitude)
              );

              for (let i = 1; i < filteredLocations.length; i++) {
                const location = filteredLocations[i];
                const distance = haversineDistance(
                  parseFloat(destination.latitude),
                  parseFloat(destination.longitude),
                  parseFloat(location.latitude),
                  parseFloat(location.longitude)
                );

                if (distance < minDistance) {
                  minDistance = distance;
                  locationData = { ...location };
                }
              }
            } else {
              locationData = { ...merchant_default_location };
            }
          }
        } else {
          locationData = merchant_locations.find(
            (element) => element.id == cal_locationData.value.id
          );
          if (!locationData) {
            locationData = { ...merchant_default_location };
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
          // productDimentions: getValueByKey(metaData, "product_dimentions") ?? [],
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
          free: !element.requires_shipping,
          pickupLocation: locationData,
        };
      })
    );

    let courier_data_to_Show_end_user = { ...groupByLocation(courierData) };

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

    const quotes = await Promise.all(
      // Object.values(groupByLocation(courierData)).map(async (_items) => {
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
              courierName: "Fast Courier",
              totalPrice: 0,
            };
          }
          let itemsArray = [];
          items.forEach((entry) => {
            let product_parts = entry.productDimentions; 
            product_parts.forEach((__item) => {
              itemsArray.push({
                type: __item.packageType,
                weight: __item.weight,
                width: __item.width,
                height: __item.height,
                length: __item.length,
                isIndividual:__item.isIndividual,
                quantity:1
              });
            });
          });

          // SHipping Box Functionality START
          // let individual_items = itemsArray.filter((item) => item.isIndividual ==="Yes");
          // let non_individual_items = itemsArray.filter((item) => item.isIndividual ==="No");
          // const _bins = [
          //   {
          //     name: "Le petite box",
          //     width: 296,
          //     height: 296,
          //     length: 8,
          //   },
          // ];
          // let individual_items_packed = packItems(_bins,non_individual_items);
          // individual_items_packed = processBoxes(JSON.parse(JSON.stringify(individual_items_packed)))
          // let itemsArray_to_send_to_courier = [...individual_items_packed,...individual_items];
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
            request_type: "wp",
            pickupFirstName: items[0].pickupLocation?.first_name,
            pickupLastName: items[0].pickupLocation?.last_name,
            pickupCompanyName: "",
            pickupEmail: items[0].pickupLocation?.email,
            pickupAddress1: items[0].pickupLocation?.address1,
            pickupAddress2: items[0].pickupLocation?.address2,
            pickupPhone: items[0].pickupLocation?.phone,
            pickupSuburb: items[0].pickupLocation?.suburb,
            pickupState: items[0].pickupLocation?.state,
            pickupPostcode: items[0].pickupLocation?.postcode,
            pickupBuildingType: items[0].pickupLocation?.building_type,
            pickupTimeWindow: `${items[0].pickupLocation?.time_window}`,
            isPickupTailLift: `${
              merchant?.is_drop_off_tail_lift
                ? Number(totalWeightOfItems > merchant.weighht)
                : 0
            }`,
            destinationSuburb: destination.city,
            destinationState: destination.province,
            destinationPostcode: destination.postal_code,
            destinationBuildingType: destination.company
              ? "commercial"
              : "residential",
            destinationFirstName: destination.name,
            destinationLastName: "",
            destinationCompanyName: "NA",
            destinationEmail: destination.email,
            destinationAddress1: destination.address1,
            destinationAddress2: destination.address2 ?? "",
            destinationPhone: destination.phone,
            parcelContent: "Order from Main Hub",
            valueOfContent: `${totalPriceOfItems}`,
            items: JSON.stringify(itemsArray),
            isDropOffTailLift: merchant?.is_drop_off_tail_lift,
          };
          
          const quote = await fetch(
            `https://fctest-api.fastcourier.com.au/api/wp/quote?${new URLSearchParams(
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
              },
            }
          );
          const data = await quote.json();
          
          courier_data_to_Show_end_user[location] = items.map((xitem) => {
            return {
              ...xitem,
              quoteData: {
                id: xitem?.is_free_shipping ? 999 : index,
                amount: xitem?.is_free_shipping
                  ? 0
                  : data?.message === "No quote found"
                  ? `${merchant?.fallback_amount}`
                  : `${data?.data?.priceIncludingGst}`,
              },
            };
          });

          return {
            amount:
              data?.message === "No quote found"
                ? `${merchant?.fallback_amount}`
                : `${data?.data?.priceIncludingGst}`,
            description:
              data?.message === "No quote found"
                ? "Incl.Tax"
                : "Includes tracking and insurance",
            eta: data?.data?.eta,
            serviceCode:
              data?.message === "No quote found"
                ? "FALLBACK"
                : `(${data?.data?.id}-${data?.data?.orderHashId})`,
            courierName: data?.data?.courierName ?? "Shipping",
            totalPrice:
              data?.message === "No quote found"
                ? `${merchant?.fallback_amount}`
                : `${data?.data?.priceIncludingGst}`,
            quoteData: {
              ...data,
              ...payload,
            },
          };
        }
      )
    );

    // const totalPrice = quotes.reduce((acc, quote) => acc + parseFloat(String(quote.totalPrice)), 0);
    const totalPrice = getUniqueQuoteData(courier_data_to_Show_end_user).reduce(
      (sum, quote) => sum + parseFloat(quote.amount),
      0
    );

    const totalPriceOfItems = quotes.reduce(
      (acc, quote) => acc + parseFloat(String(quote.totalPrice)),
      0
    );

    const response = {
      rates: [
        {
          service_name: quotes.some((quote) => quote.serviceCode === "FALLBACK")
            ? "Shipping"
            : `Fast Courier [${quotes
                .map((quote) => quote.courierName)
                .join(",")}]`,
          service_code: `${quotes
            .map((quote) => quote.serviceCode)
            .join(",")}~${
            quotes.some((quote) => quote.serviceCode === "FALLBACK")
              ? "FALLBACK"
              : totalPrice === 0
              ? "FREESHIPPING"
              : "PAID"
          }~${totalPriceOfItems}`,
          // service_code: JSON.stringify(quotes),
          total_price: `${Number(totalPrice * 10 * 10)}`,
          description: quotes.map((quote) => quote.description).join(","),
          currency: "AUD",
        },
      ],
    };

    // const response = {
    //   rates: quotes.map((quote) => ({
    //     service_name: `Fast Courier [${quote.courierName}]`,
    //     service_code: quote.serviceCode,
    //     total_price: `${Number(parseFloat(String(quote.totalPrice)) * 10 * 10)}`,
    //     description: quote.description,
    //     currency: "AUD",
    //   })),
    // }

    res.status(200).json(response);
  } catch (error) {
    console.error("shipping-rates==", error);
    logger.info("shipping-rates-==", error);
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
        if (!quoteDataMap.has(quoteData.id)) {
          quoteDataMap.set(quoteData.id, quoteData);
        }
      });
    }
  }

  return Array.from(quoteDataMap.values());
}

async function getMerchantData(access_token) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "request-type": "shopify_development",
    version: "3.1.1",
    Authorization: "Bearer " + access_token,
  };
  const merchant = await fetch(
    `https://fctest-api.fastcourier.com.au/api/wp/get_merchant`,
    {
      method: "GET",
      credentials: "include",
      headers: headers,
    }
  );

  let merchant_details = await merchant.json();
  return merchant_details;
}
async function getMerchantDefaultLocation(access_token, merchant_id) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "request-type": "shopify_development",
    version: "3.1.1",
    Authorization: "Bearer " + access_token,
  };

  const pickupLocations = await fetch(
    `https://fctest-api.fastcourier.com.au/api/wp/merchant_domain/locations/${merchant_id}`,
    {
      method: "GET",
      credentials: "include",
      headers: headers,
    }
  );

  const locations = await pickupLocations.json();

  const defaultPickupLocation = locations?.data?.find(
    (element) => element.is_default == 1
  );

  return defaultPickupLocation;
}
async function getMerchantLocationDataFromTagId(
  access_token,
  merchant_id,
  tagId
) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "request-type": "shopify_development",
    version: "3.1.1",
    Authorization: "Bearer " + access_token,
  };
  const merchant_location = await fetch(
    `https://fctest-api.fastcourier.com.au/api/wp/merchant_locations/` +
      merchant_id +
      "/" +
      tagId,
    {
      method: "GET",
      credentials: "include",
      headers: headers,
    }
  );

  let merchant_location_details = await merchant_location.json();
  return merchant_location_details;
}
async function getMerchantLocationDataFromLocationId(
  access_token,
  merchant_id,
  locationId
) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "request-type": "shopify_development",
    version: "3.1.1",
    Authorization: "Bearer " + access_token,
  };
  const merchant_location = await fetch(
    `https://fctest-api.fastcourier.com.au/api/wp/merchant_domain/location/` +
      // merchant_id +
      // "/" +
      locationId,
    {
      method: "GET",
      credentials: "include",
      headers: headers,
    }
  );

  let merchant_location_details = await merchant_location.json();
  console.log(merchant_location_details, "merchant_location_details");
  return merchant_location_details;
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

app.get("/api/get-merchant", async (_req, res) => {
  try {
    const db = await getConnection();
    let collection = db.collection("merchant_details");
    const response = await collection.find({}).toArray();
    res.status(200).send(response);
  } catch (error) {
    console.log("get-merchant=", error);
  }
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

    const session = await getSession(current_session.shop);

    await createColoumnIfNotExist();

    res.status(200).send({ data: session[0] });
  } catch (error) {
    console.log("get-merchant=", error);
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

// app.post("/api/save-merchant", async (_req, res) => {
//   try {
//     const db = await getConnection();
//     const body = _req.body;
//     let collection = db.collection("merchant_details");
//     const response = await collection.insertOne(body);
//     res.status(200).send(response);
//   } catch (error) {
//     console.log("save-merchant=", error);
//   }
// });

app.post("/api/save-merchant", async (_req, res) => {
  try {
    // return;
    // const db = await getConnection();
    // const body = _req.body;
    // const id = body.id; // Assuming the ID is present in the request body
    // const session = await getSession()
    // let collection = db.collection("merchant_details");
    // // Check if a record with the given ID exists
    // const existingRecord = await collection.findOne({ id: id });
    // if (existingRecord) {
    //   // If record exists, update it
    //   const response = await collection.updateOne({ id: id }, { $set: body });
    //   res.status(200).send(response);
    // } else {
    //   // If record does not exist, create a new one
    //   const response = await collection.insertOne(body);
    //   res.status(200).send(response);
    // }
  } catch (error) {
    console.log("save-merchant=", error);
    res.status(500).send("Internal Server Error"); // Sending a generic error response
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

app.post("/api/shipping-box/create", async (_req, res) => {
  try {
    const db = await getConnection();
    const body = _req.body;
    let collection = db.collection("shipping_boxes");
    const response = await collection.insertOne(body);
    res.status(200).send(response);
  } catch (error) {
    console.log("shipping-box/create=", error);
  }
});

app.delete("/api/shipping-box/delete", async (_req, res) => {
  try {
    const db = await getConnection();
    const id = _req.body._id;
    let collection = db.collection("shipping_boxes");
    const response = await collection.deleteOne({ _id: new ObjectId(id) });
    res.status(200).send(response);
  } catch (error) {
    console.log("shipping-box/delete=", error);
  }
});

app.get("/api/shipping-boxes", async (_req, res) => {
  try {
    const db = await getConnection();
    let collection = db.collection("shipping_boxes");
    const response = await collection.find({}).toArray();
    res.status(200).send(response);
  } catch (error) {
    console.log("shipping-box=", error);
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
            metafield.product_id = parseInt(productId);
            metafield.key = item.key;
             
            metafield.value = JSON.stringify(metaFields_list[index]);
            // metafield.type = "single_line_text_field";
            metafield.type = "json";
            metafield.namespace = "Product";
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
            // metafield.type = "json";
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

    console.log("location_name==", typeof location_name);

    //Process product_ids
    if (product_ids.length > 0) {
      productMetafieldsList = await Promise.all(
        product_ids.map(async (element) => {
          await limiter.schedule(async () => {
            const metafield = new shopify.api.rest.Metafield({
              session: session,
            });
            metafield.product_id = parseInt(element);
            metafield.namespace = "Product";
            metafield.key = "location";
            // metafield.type = "json";
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
            // metafield.type = "json";
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
    console.log("productId===", productId);
    console.log("isFreeShipping===", isFreeShipping);
    const value = isFreeShipping === true ? "1" : "0";
    console.log("value==", value);
    const metafield = new shopify.api.rest.Metafield({
      session: session,
    });
    metafield.product_id = productId;
    metafield.namespace = "Order";
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
      "https://work-hd-sapphire-powder.trycloudflare.com/api/shipping-rates";
    carrier_service.service_discovery = true;
    await carrier_service.save({
      update: true,
    });
    res.status(200).send(carrier_service);
  } catch (error) {
    console.log("carrier-create=", error);
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
      carrier_service.name = "Fast Courier";
      carrier_service.callback_url =
        "https://work-hd-sapphire-powder.trycloudflare.com/api/shipping-rates";
      await carrier_service.save({
        update: true,
      });

      // Dummy Test START
      const webhook = new shopify.api.rest.Webhook({session: res.locals.shopify.session});
      webhook.address = "https://work-hd-sapphire-powder.trycloudflare.com/api/webhook/order-create";
      webhook.topic = "orders/paid";
      webhook.format = "json";
      await webhook.save({
        update: true,
      });
     // Dummy Test STOP
      res.status(200).send(carrier_service);
    } catch (error) {
      console.log("carrier-update=", error);
      logger.info("carrier-update-==", error);
    }
  }
);

app.get("/api/orders", async (_req, res) => {
  try {
    console.log("res.locals.shopify.session==", res.locals.shopify.session);
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
    orders(first: 80) {
      edges {
        node {
          id
          metafields(first: 10) {
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

    const data = await client.query({
      data: queryString,
    });
    res.status(200).send(data);
  } catch (error) {
    console.log("order-metafields=", error);
  }
});

app.post("/api/hold-orders", async (_req, res) => {
  const { orderIds } = _req.body;
  const session = res.locals.shopify.session;
  var orders = [];
  orderIds.forEach(async (id) => {
    // const fulfillment_order = new shopify.api.rest.FulfillmentOrder({ session: res.locals.shopify.session });
    // fulfillment_order.id = parseInt(id);
    // await fulfillment_order.hold({
    //   body: { "fulfillment_hold": { "reason": "inventory_out_of_stock", "reason_notes": "Not enough inventory to complete this work.", "fulfillment_order_line_items": [{ "id": "", "quantity": 1 }] } },
    // });
    const metafield = new shopify.api.rest.Metafield({
      session: res.locals.shopify.session,
    });
    metafield.order_id = id;
    metafield.namespace = "Order";
    metafield.key = "fc_order_status";
    metafield.type = "single_line_text_field";
    metafield.value = "Hold";
    await metafield.save({
      update: true,
    });

    orders.push(metafield);
  });
  res.status(200).send(orders);
});

app.post("/api/book-orders", async (_req, res) => {
  try {
    const { orderIds, collectionDate } = _req.body;
    const session = res.locals.shopify.session;
    console.log("ress===", res);
    console.log("locals===", res.locals);
    console.log("shopify===", res.locals.shopify);
    var orders = [];
    let metaFields_list = ["Booked for collection", collectionDate];
    const metafields_Item = [
      {
        key: "fc_order_status",

        type: "single_line_text_field",
        namespace: "Order",
      },
      {
        key: "collection_date",

        type: "single_line_text_field",
        namespace: "Order",
      },
    ];

    if (orderIds.length > 0) {
      for (const productId of orderIds) {
        const metafieldPromises = metafields_Item.map(async (item, index) => {
          const metafield = new shopify.api.rest.Metafield({ session });
          metafield.order_id = parseInt(productId);
          metafield.key = item.key;
          metafield.value = metaFields_list[index];
          metafield.type = "single_line_text_field";
          metafield.namespace = "Order";
          // Assign value from metaFields_list
          await metafield.save({ update: true });
          return metafield;
        });

        const savedMetafields = await Promise.all(metafieldPromises);
        orders.push(...savedMetafields);
      }
    }
    res.status(200).send(orders);

    orderIds.forEach(async (id) => {
      const order = new shopify.api.rest.Order({ session: session });
      order.id = parseInt(id);
      order.metafields = [
        {
          key: "fc_order_status",
          value: "Booked for collection",
          type: "single_line_text_field",
          namespace: "Order",
        },
        {
          key: "collection_date",
          value: collectionDate,
          type: "single_line_text_field",
          namespace: "Order",
        },
      ];
      await order.save({
        update: true,
      });

      orders.push(order);
    });
    res.status(200).send(orders);
  } catch (error) {
    console.log("book-orders=", error);
  }
});

app.get("/api/products", async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });
    const queryString = `{
      products(first: 30) {
        edges {
          node {
            id
            title
            metafields(first: 10) {
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
                  metafields(first: 10) {
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
          }
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
    await shopify.api.rest.CarrierService.delete({
      session: res.locals.shopify.session,
      id: 66098495707,
    });
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
async function createColoumnIfNotExist() {
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
          addColumn("merchant_id", "TEXT"),
          addColumn("merchant_locations", "TEXT"), // Add other columns as needed
          addColumn("merchant_tags", "TEXT"),
          addColumn("merchant", "TEXT"),
          addColumn("is_production", "TEXT", "false"),
          // Add more columns here
        ])
          .then(() => {
            return {
              success: true,
            };
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        // If the column exists, directly insert the merchant ID
        return {
          success: true,
        };
      }
    });
  });
}

function addColumn(columnName, columnType, initialValue) {
  return new Promise((resolve, reject) => {
    const defaultClause = initialValue
      ? `DEFAULT ${initialValue}`
      : "DEFAULT NULL";
    const query = `
      ALTER TABLE shopify_sessions
      ADD COLUMN ${columnName} ${columnType} ${defaultClause}
    `;
    db.run(query, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
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
    "UPDATE shopify_sessions SET merchant_token = NULL, merchant_id = NULL WHERE shop = ?",
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
// function packItems(_bins, _items, level = 0) {
//   // logger.info("Packing items",BinPacking3D.BinPacking);
//   // logger.info("Packing items 2",BinPacking3D.BP3D);
// logger.info("dsvdsv",typeof Packer);
 
//   let packer = new Packer();
//   let bin_itemsto_send = [];

//   let bins = _bins.map(
//     (bin) =>
//       new Bin(
//         `${bin?.name ?? "Box"}-${level}`,
//         bin.width,
//         bin.height,
//         bin.length,
//         1000000000000
//       )
//   );
//   let items = _items.map(
//     (item) =>
//       new Item(item.name, item.width, item.height, item.length, item.weight)
//   );
//   bins.forEach((bin) => packer.addBin(bin));
//   items.forEach((item) => packer.addItem(item));
//   packer.pack();
//   let packedItems = bins.map((bin) => ({
//     ...bin,
//     length: bin.depth,
//     sub_packs: bin.items,
//   }));

//   packedItems.forEach((bin) => {
//     if (bin.sub_packs.length > 0) {
//       bin_itemsto_send.push(bin);
//     }
//   });
//   if (packer.unfitItems.length > 0) { 
//     let updatedItems = packer.unfitItems.map((item) => ({
//       ...item,
//       width: item.height / 100000,
//       height: item.width / 100000,
//       length: item.depth / 100000,
//       weight: item.weight / 100000,
//     }));
//     let newItems = packItems(_bins, updatedItems, level + 1);
//     bin_itemsto_send = bin_itemsto_send.concat(newItems);
//   }

//   return bin_itemsto_send;
// }
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

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
