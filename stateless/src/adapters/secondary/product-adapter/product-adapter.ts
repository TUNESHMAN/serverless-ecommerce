export type ProductRecord = {
  id: string;
  productName: string;
  price: number;
  stockQuantity: number;
  imageUrls: {
    content: string;
    contentType: string;
    filename: string;
  }[];
  sku: string;
  status: "inStock" | "outOfStock" | "preOrder";
  createdAt: string;
  updatedAt: string;
  discountPrice?: number;
  ratings?: number;
  reviewsCount?: number;
  tags?: string[];
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  weight?: number;
  color?: string;
  variants?: {
    size: string;
    color: string;
    model: string;
    stockQuantity: number;
  };
  warrantyInfo?: string;
  shippingCost: number;
  featured: boolean;
  relatedProducts: string[];
  videoUrls: {
    content: string;
    contentType: string;
    filename: string;
  }[];
  isReturnable: boolean;
  category: string;
};
