import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "VND" },
    image: { type: String, default: "" },
    category: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    origin: { type: String, default: "" },
    ingredients: { type: String, default: "" },
    usage: { type: String, default: "" },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
