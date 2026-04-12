import productsSource from "../data/products.json";

export const products = Array.isArray(productsSource)
  ? productsSource
  : productsSource.products ?? [];

export function getProductById(id) {
  return products.find((product) => product.id === id) ?? null;
}
