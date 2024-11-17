export const createProductSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  description: "Schema for creating a product",
  properties: {
    id: {
      type: "string",
      description: "Unique identifier for the product",
    },
    productName: { type: "string", description: "The name of the product" },
    price: { type: "number", description: "Price of the product" },
    stockQuantity: {
      type: "integer",
      description: "Number of units available in stock",
    },
    imageUrls: {
      type: "array",
      description: "Array of objects containing details about product images",
      items: {
        type: "object",
        properties: {
          content: {
            type: "string",
            format: "uri",
            description: "URL of the product image",
          },
          contentType: {
            type: "string",
            description: "MIME type of the image (e.g., image/jpeg, image/png)",
          },
          filename: {
            type: "string",
            description: "Name of the image file",
          },
        },
        required: ["content", "contentType", "filename"],
      },
    },

    sku: {
      type: "string",
      description:
        "Stock Keeping Unit - unique identifier for the product variant",
    },
    status: {
      type: "string",
      enum: ["inStock", "outOfStock", "preOrder"],
      description: "Product availability status",
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Timestamp when the product was created",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      description: "Timestamp when the product was last updated",
    },
    discountPrice: {
      type: "number",
      description: "Discounted price of the product, if applicable",
    },
    ratings: {
      type: "number",
      minimum: 0,
      maximum: 5,
      description: "Average user rating for the product",
    },
    reviewsCount: {
      type: "integer",
      description: "Number of user reviews",
    },
    tags: {
      type: "array",
      description: "List of keywords associated with the product",
      items: {
        type: "string",
      },
    },
    dimensions: {
      type: "object",
      description: "Product dimensions",
      properties: {
        height: { type: "number" },
        width: { type: "number" },
        depth: { type: "number" },
      },
      required: ["height", "width", "depth"],
    },
    weight: {
      type: "number",
      description: "Product weight",
    },
    color: {
      type: "string",
      description: "Color of the product",
    },
    variants: {
      type: "array",
      description:
        "Different variants of the product, such as different colors or models",
      items: {
        type: "object",
        properties: {
          color: { type: "string" },
          model: { type: "string" },
          size: { type: "string" },
          stockQuantity: { type: "integer" },
        },
        required: ["color", "model"],
      },
    },
    // supplierId: {
    //   type: "string",
    //   description: "Unique identifier of the product's supplier",
    // },
    warrantyInfo: {
      type: "string",
      description: "Warranty details of the product",
    },
    category: {
      type: "string",
      description: "Category of the product",
    },
    shippingCost: {
      type: "number",
      description: "Shipping cost for the product",
    },
    featured: {
      type: "boolean",
      description: "Flag indicating whether the product is featured",
    },
    relatedProducts: {
      type: "array",
      description: "Array of related product IDs",
      items: {
        type: "string",
      },
    },
    videoUrls: {
      type: "array",
      description: "Array of objects containing details about product images",
      items: {
        type: "object",
        properties: {
          content: {
            type: "string",
            format: "uri",
            description: "URL of the product image",
          },
          contentType: {
            type: "string",
            description: "MIME type of the image (e.g., image/jpeg, image/png)",
          },
          filename: {
            type: "string",
            description: "Name of the image file",
          },
        },
        required: ["content", "contentType", "filename"],
      },
    },

    isReturnable: {
      type: "boolean",
      description: "Indicates if the product is returnable",
    },
  },
  required: [
    "id",
    "productName",
    "price",
    "category",
    "stockQuantity",
    "createdAt",
    "updatedAt",
    "imageUrls",
    "videoUrls",
  ],
};
