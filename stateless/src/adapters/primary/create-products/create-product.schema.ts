export const createProductSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        price: {
          type: "number",
        },
      },
      required: ["name", "price"],
    },
  },
  required: ["body"],
};
