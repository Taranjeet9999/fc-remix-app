import {
  reactExtension,
  Banner,
  useApi,
  useSessionToken,
} from "@shopify/ui-extensions-react/customer-account";
import { useEffect } from "react";

export default reactExtension("purchase.thank-you.block.render", () => (
  <Extension />
));
// export default reactExtension("purchase.thank-you.header.render-after", () => (
//   <Extension />
// ));

function Extension() {
  const test = useApi();
  const  {orderConfirmation}  = useApi();
  const sessionToken = useSessionToken();
  
console.log("orderConfirmation", orderConfirmation);
console.log("orderConfirmation", 'orderConfirmation');
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
  getOrderDetails = async () => {
    const token = await sessionToken.get();
    const orderId = getOrderId(orderConfirmation.current.order.id);
    const result = await fetch(
      `https://work-hd-sapphire-powder.trycloudflare.com/api/get-order/${orderId}`,
      {
        method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const orderDetails = await result.json();
    console.log("orderDetails", orderDetails);
    const codes = getCodes(orderDetails.shipping_lines);
     
    if (codes != null) {
      const valuesArray = codes.split("~"); // FORMAT=====YQOXXZXPVO~PAID~195.26

      // Trim the quotes from each value and assign them to variables
      const {quoteIds} = extractIds(valuesArray[0]);
      const {orderIds} = extractIds(valuesArray[0]);
     

      const carrierName = getCarrier(orderDetails.shipping_lines);
      console.log("carrierName", carrierName);

      const setMetafields = await fetch(
        `https://work-hd-sapphire-powder.trycloudflare.com/api/set-order-metafields`,
        {
          method: "POST",
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quoteId: quoteIds,
            orderHashId: orderIds,
            orderId: orderId,
            carrierName: carrierName,
            orderStatus:
              valuesArray[valuesArray.length - 2] === "FALLBACK"
                ? "Fallback"
                : valuesArray[valuesArray.length - 2] === "FREESHIPPING"
                ? "Freeshipping"
                : "Paid",
            courierCharges: valuesArray[valuesArray.length - 1],
          }),
        }
      );
    } else {
      const result = await fetch(
        `https://work-hd-sapphire-powder.trycloudflare.com/api/process-order/${orderId}`,
        {
          method: "GET",
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const orderDetails = await result.json();
      console.log("orderDetails", orderDetails);
    }
  };

  useEffect(() => {
    getOrderDetails();
  }, [orderConfirmation]);

  return <Banner>Please include your order ID in support requests</Banner>;
}
