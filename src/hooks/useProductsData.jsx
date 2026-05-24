import { useEffect, useState } from "react";
import useFetch from "./useFetch";

// Từ khóa để định danh dữ liệu sản phẩm trong bộ nhớ trình duyệt
const KEY_PRODUCTS = "admin_products";


export function loadStoredProducts() {
  try {
    const storedProducts = JSON.parse(localStorage.getItem(KEY_PRODUCTS));
    // Kiểm tra nếu là mảng thì trả về, nếu không thì trả về mảng rỗng
    return Array.isArray(storedProducts) ? storedProducts : [];
  } catch (error) {
    console.error("Lỗi khi đọc dữ liệu sản phẩm từ LocalStorage:", error);
    return [];
  }
}

/**
 * Hàm hỗ trợ: Lưu danh sách sản phẩm hiện tại vào LocalStorage
 */
export function saveStoredProducts(products) {
  localStorage.setItem(KEY_PRODUCTS, JSON.stringify(products));
}

/**
 * Custom Hook: Quản lý toàn bộ dữ liệu sản phẩm cho ứng dụng
 */
export default function useProductsData() {
  const [products, setProducts] = useState(() => loadStoredProducts());

  const needsSeed = products.length === 0;

  // 3. Sử dụng Hook useFetch để gọi API lấy dữ liệu sản phẩm mẫu (Seed data)
  const { data, loading, error } = useFetch(needsSeed ? "/api/products" : null);

  useEffect(() => {
    if (!needsSeed) return;
    if (!Array.isArray(data) || data.length === 0) return;

    // Lưu vào bộ nhớ máy và cập nhật lại giao diện
    saveStoredProducts(data);
    setProducts(data);
  }, [data, needsSeed]);

 
  const updateProducts = (nextValue) => {
    //  Tính toán giá trị mới (xử lý cả trường hợp truyền vào function hoặc giá trị)
    const nextProducts = typeof nextValue === "function"
      ? nextValue(products)
      : nextValue;
    //  Cập nhật vào State để hiển thị giao diện
    setProducts(nextProducts);
    saveStoredProducts(nextProducts);
  };
  // Trả về các giá trị cần thiết cho Component sử dụng
  return {
    products,
    setProducts: updateProducts, // Hàm để thêm/sửa/xóa sản phẩm
    loading: needsSeed ? loading : false,
    error: needsSeed ? error : null,
  };
}