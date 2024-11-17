const convict = require("convict");

export const config = convict({
  eCommerceAppTable: {
    doc: "The DDB table store for ecommerce app",
    format: String,
    default: "",
    env: "E_COMMERCE_APP_TABLE",
  },
  eCommerceAppBucket: {
    doc: "The S3 bucket store for ecommerce app",
    format: String,
    default: "",
    env: "E_COMMERCE_APP_BUCKET",
  },
  cognitoClientId: {
    doc: "The cognito client id",
    format: String,
    default: "jcl119vae8c7l80pkm6dqra82",
    env: "COGNITO_CLIENT_ID",
  },
}).validate({ allowed: "strict" });
