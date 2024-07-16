// Every Variable must be Lowercase

export const locationMetafields = {
  type: "name", //or tag
  value: {
    name: "Location",
    description: "The location of the store",
  },
};

export const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "request-type": "shopify_development",
  version: "3.1.1",
  Authorization: "Bearer " + localStorage.getItem("accessToken"),
  "shopify_domain": localStorage.getItem("userData") ?  getStore(localStorage.getItem("userData"))    :"",
};


function getStore(storeObj) {
try {
  const parsedValue = JSON.parse(storeObj)
  return parsedValue.id
  
} catch (error) {
  return ""
}
  
}