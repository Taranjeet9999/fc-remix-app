const { BillingInterval, LATEST_API_VERSION } = require("@shopify/shopify-api");
const { shopifyApp } = require("@shopify/shopify-app-express");
const { SQLiteSessionStorage } = require("@shopify/shopify-app-session-storage-sqlite");
const { restResources } = require("@shopify/shopify-api/rest/admin/2023-04");
require("dotenv/config");

const DB_PATH = `${process.cwd()}/database.sqlite`;

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    // apiKey: "48c11f190fe107153899a7f870f79215",
    // apiSecretKey: "76340c674fc34252622a40c916af1d2c",
    scopes: 'read_checkouts,read_orders,read_products,read_shipping,unauthenticated_read_checkouts,unauthenticated_write_checkouts,write_checkouts,write_orders,write_products,write_shipping',
    //  hostName: "https://webshots-charity-delta-sunny.trycloudflare.com",
    //  hostName: "https://maiden-internship-is-earthquake.trycloudflare.com/",
    //  hostName: "https://maiden-internship-is-earthquake.trycloudflare.com/",

    restResources,
    billing: undefined, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: new SQLiteSessionStorage(DB_PATH),
});

// export default shopify;
module.exports = shopify;