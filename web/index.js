// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import log4js from "log4js";
 
// Create a logger object 
// const logger = log4js.getLogger();

log4js.configure({ 
  appenders: {  
      file: {  
          type: "file",  
          filename: "logs.log" 
      }  
  }, 
  categories: { 
      default: { 
          appenders: 
              ["file"], level: "info"
      } 
  }, 
}); 

// Create a logger object 
 const logger = log4js.getLogger(); 
 

const db = new sqlite3.Database(
  "./database.sqlite",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error(err.message, "eroroorro");
    }
    console.log("Connected to the database.");
  }
);

function getSession() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM shopify_sessions", [], (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
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

export const app = express();
app.use(bodyParser.json());

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

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js
app.use(express.json());

app.use("/api/*", shopify.validateAuthenticatedSession());


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



 


app.post("/api/shipping-rates", async (_req, res) => {
  try {

    
    logger.info("shipping ratessssssssssssssssssss");
logger.info("shipping ratessssssssssssssssssss");
logger.info("shipping ratessssssssssssssssssss");
logger.info("shipping ratessssssssssssssssssss");
logger.info("shipping ratessssssssssssssssssss");

    res.status(200).json({
      rates: [
        {
          service_name: "Fast Courier",
          description: "Free Shipping",
          service_code: "YFC",
          currency: "EUR",
          total_price: 500000,
        },
      ],
    });

    console.log("888888888888888888888888")
    logger.info("Cheese is Comté.");
logger.info("Cheese is Comté.");
logger.info("Cheese is Comté.");
logger.info("Cheese is Comté.");
logger.info("Cheese is Comté.");
    const session = await getSession();
    var items = [];
    var totalPrice = 0;
    var isFreeShipping = false;
    for (const element of _req.body.rate.items) {
      // _req.body.rate.items.map(async (element, i) => {

      const variantId = element.variant_id;
      const productId = element.product_id;
      
      const productMetafields = await shopify.api.rest.Metafield.all({
        session: session[1],
        metafield: { owner_id: productId, owner_resource: "product" },
      });
      console.log("element==", element);
      const metaData = productMetafields.data;

      isFreeShipping =
        getValueByKey(metaData, "is_free_shipping") == "1" ? true : false;

      if (isFreeShipping) {
        const freeResponse = {
          rates: [
            {
              service_name: `Fast Courier`,
              service_code: `FC`,
              total_price: "0000",
              description: "Free Shipping",
              currency: "AUD",
            },
          ],
        };
        res.status(200).json(freeResponse);
      }

      var item = {
        type: getValueByKey(metaData, "package_type"),
        height: getValueByKey(metaData, "height"),
        length: getValueByKey(metaData, "length"),
        width: getValueByKey(metaData, "width"),
        weight: getValueByKey(metaData, "weight"),
        quantity: element.quantity,
      };

      console.log("item===", item);
      const itemPrice = parseInt(element.price) / 100;
      totalPrice += itemPrice;

      if (!isFreeShipping) {
        items.push(item);
      }
      // })
    }

    console.log("items===", items);

    const db = await getConnection();
    let collection = db.collection("merchant_details");
    const merchant = await collection.find({}).toArray();

    console.log("total===", totalPrice);
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "request-type": "shopify_development",
      version: "3.1.1",
      Authorization: "Bearer " + merchant[0]?.access_token,
    };
    console.log("destination===", _req?.body?.rate?.destination);
    const destination = _req?.body?.rate?.destination;

    const pickupLocations = await fetch(
      `https://fctest-api.fastcourier.com.au/api/wp/merchant_domain/locations/${merchant[0]?.id}`,
      {
        method: "GET",
        credentials: "include",
        headers: headers,
      }
    );

    const locations = await pickupLocations.json();

    const pickupLocation = locations?.data?.find(
      (element) => element.is_default == 1
    );

    const payload = {
      request_type: "wp",
      pickupFirstName: pickupLocation?.first_name,
      pickupLastName: pickupLocation?.last_name,
      pickupCompanyName: "",
      pickupEmail: pickupLocation?.email,
      pickupAddress1: pickupLocation?.address1,
      pickupAddress2: pickupLocation?.address2,
      pickupPhone: pickupLocation?.phone,
      pickupSuburb: pickupLocation?.suburb,
      pickupState: pickupLocation?.state,
      pickupPostcode: pickupLocation?.postcode,
      pickupBuildingType: pickupLocation?.building_type,
      pickupTimeWindow: `${pickupLocation?.time_window}`,
      isPickupTailLift: `${pickupLocation?.tail_lift}`,
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
      destinationAddress2:
        destination.address2 != null ? destination.address2 : "",
      destinationPhone: destination.phone,
      parcelContent: "Order from Main Hub",
      valueOfContent: `${totalPrice}`,
      items: JSON.stringify(items),
      isDropOffTailLift: merchant[0]?.is_drop_off_tail_lift,
    };

    console.log("payload===", payload);

    const quote = await fetch(
      `https://fctest-api.fastcourier.com.au/api/wp/quote?${new URLSearchParams(
        payload
      )}`,
      {
        method: "GET",
        credentials: "include",
        headers: headers,
      }
    );

    const data = await quote.json();

    console.log("quote===", data);

    var amount = "";
    var description = "";
    var eta = "";
    var serviceCode = "";

    if (data?.message == "No quote found") {
      amount = `${merchant[0]?.fallback_amount}00`;
      description = "Default fallback amount";
      serviceCode = "FC";
    } else {
      amount = `${data?.data?.priceIncludingGst}`;
      description = "Includes tracking and insurance";
      eta = `${data?.data?.eta}`;
      serviceCode = `"${data?.data?.id}","${data?.data?.orderHashId}"`;
    }

    const response = {
      rates: [
        {
          service_name: `Fast Courier [${data?.data?.courierName}]`,
          service_code: `${serviceCode}`,
          total_price: amount,
          description: description,
          currency: "AUD",
        },
      ],
    };

    // const response = {
    //   "rates": [
    //     {
    //       "service_name": "Fast Courier [Courier Please]",
    //       "service_code": `"WVQXMGNYEO","GROREYQJYM"`,
    //       "total_price": "8500",
    //       "description": "Includes tracking and insurance",
    //       "currency": "AUD",
    //       "max_delivery_date": "3 working days"
    //     },
    //   ]
    // };

    console.log("response===", response);

    res.status(200).json(response);
  } catch (error) {
    console.log("shipping-rates==", error);
  }
});
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

app.post("/api/save-merchant", async (_req, res) => {
  try {
    const db = await getConnection();
    const body = _req.body;
    let collection = db.collection("merchant_details");
    const response = await collection.insertOne(body);
    res.status(200).send(response);
  } catch (error) {
    console.log("save-merchant=", error);
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
      package_type,
      height,
      width,
      length,
      weight,
      isIndividual,
      product_ids,
      variant_ids,
    } = _req.body;
    const session = res.locals.shopify.session;

    let metaFields_list = [
      package_type,
      height,
      width,
      length,
      weight,
      isIndividual,
    ];

    let products = [];

    const metafields_Item = [
      {
        key: "package_type",
        type: "single_line_text_field",
        namespace: "Product",
      },
      {
        key: "height",
        type: "single_line_text_field",
        namespace: "Product",
      },
      {
        key: "width",
        type: "single_line_text_field",
        namespace: "Product",
      },
      {
        key: "length",
        type: "single_line_text_field",
        namespace: "Product",
      },
      {
        key: "weight",
        type: "single_line_text_field",
        namespace: "Product",
      },
      {
        key: "is_individaul", // Corrected key name
        type: "single_line_text_field",
        namespace: "Product",
      },
    ];

    if (product_ids.length > 0) {
      for (const productId of product_ids) {
        const metafieldPromises = metafields_Item.map(async (item, index) => {
          const metafield = new shopify.api.rest.Metafield({ session });
          metafield.product_id = parseInt(productId);
          metafield.key = item.key;
          metafield.value = metaFields_list[index];
          metafield.type = "single_line_text_field";
          metafield.namespace = "Product";
          // Assign value from metaFields_list
          await metafield.save({ update: true });
          return metafield;
        });

        const savedMetafields = await Promise.all(metafieldPromises);
        products.push(...savedMetafields);
      }
    }

    if (variant_ids.length > 0) {
      for (const variantId of variant_ids) {
        const metafieldPromises = metafields_Item.map(async (item, index) => {
          const metafield = new shopify.api.rest.Metafield({ session });
          metafield.variant_id = parseInt(variantId);
          metafield.key = item.key;
          metafield.value = metaFields_list[index];
          metafield.type = "single_line_text_field";
          metafield.namespace = "Product Variant";
          await metafield.save({ update: true });
          return metafield;
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

app.post("/api/product/add-location", async (_req, res) => {
  try {
    const { location_name, product_ids, variant_ids } = _req.body;
    const session = res.locals.shopify.session;
    var products = [];
    if (product_ids.length > 0) {
      product_ids.forEach(async (element) => {
        // const product = new shopify.api.rest.Product({ session: session });
        // product.id = parseInt(element);
        // product.metafields = [
        //   {
        //     key: "location",
        //     value: location_name,
        //     type: "single_line_text_field",
        //     namespace: "Product",
        //     // namespace: "global",
        //   },
        // ];

        // await product.save({
        //   update: true,
        // });

        // products.push(product);
        const metafield = new shopify.api.rest.Metafield({
          session: session,
        });
        metafield.product_id = parseInt(element);
        metafield.namespace = "Product";
        metafield.key = "location";
        metafield.type = "single_line_text_field";
        metafield.value = location_name;
        await metafield.save({
          update: true,
        });
      });
    }

    console.log(variant_ids, "variant_ids");
    if (variant_ids.length > 0) {
      variant_ids.forEach(async (element) => {
        // const variant = new shopify.api.rest.Variant({ session: session });
        // variant.id = parseInt(element);

        // variant.metafields = [
        //   {
        //     key: "location",
        //     value: location_name,
        //     type: "single_line_text_field",
        //     namespace: "Product Variant",
        //   },
        // ];

        // await variant.save({
        //   update: true,
        // });

        const metafield = new shopify.api.rest.Metafield({
          session: session,
        });
        metafield.variant_id = parseInt(element);
        metafield.namespace = "Product Variant";
        metafield.key = "location";
        metafield.type = "single_line_text_field";
        metafield.value = location_name;
        await metafield.save({
          update: true,
        });
      });
    }
    res.status(200).send(products);
  } catch (error) {
    console.log("add-location==", error);
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
      "https://fc-app.vuwork.com/api/shipping-rates";
    carrier_service.service_discovery = true;
    await carrier_service.save({
      update: true,
    });
    res.status(200).send(carrier_service);
  } catch (error) {
    console.log("carrier-create=", error);
  }
});

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
    let metaFields_list = [
      "Booked for collection",
      collectionDate
    ];
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
    const { quoteId, orderHashId, orderId, carrierName } = _req.body;
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

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
