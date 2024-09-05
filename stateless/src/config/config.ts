const convict = require("convict");

export const config = convict({
  eCommerceAppTable: {
    doc: "The DDB table store for ecommerce app",
    format: String,
    default: "",
    env: "E_COMMERCE_APP_TABLE",
  },
}).validate({ allowed: "strict" });
