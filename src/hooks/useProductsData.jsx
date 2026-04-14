import { useEffect, useState } from "react";
import useFetch from "./useFetch";

// Từ khóa để định danh dữ liệu sản phẩm trong bộ nhớ trình duyệt
const KEY_PRODUCTS = "admin_products";

/**
 * Hàm hỗ trợ: Đọc danh sách sản phẩm đã lưu từ LocalStorage
 */
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
  // 1. Khởi tạo State sản phẩm: Ưu tiên lấy từ LocalStorage trước để hiển thị ngay lập tức
  const [products, setProducts] = useState(() => loadStoredProducts());

  // 2. Kiểm tra xem có cần nạp dữ liệu từ API không (Chỉ nạp nếu LocalStorage đang trống)
  const needsSeed = products.length === 0;

  // 3. Sử dụng Hook useFetch để gọi API lấy dữ liệu sản phẩm mẫu (Seed data)
  const { data, loading, error } = useFetch(needsSeed ? "/api/products" : null);

  // 4. Cập nhật dữ liệu vào LocalStorage khi API trả về kết quả thành công
  useEffect(() => {
    // Nếu máy đã có dữ liệu hoặc API chưa trả về data thì không làm gì cả
    if (!needsSeed) return;
    if (!Array.isArray(data) || data.length === 0) return;

    // Lưu vào bộ nhớ máy và cập nhật lại giao diện
    saveStoredProducts(data);
    setProducts(data);
  }, [data, needsSeed]);

  /**
   * Hàm cập nhật sản phẩm nâng cao:
   * Vừa cập nhật State của React để thay đổi giao diện,
   * Vừa lưu ngay vào LocalStorage để tránh mất dữ liệu khi F5.
   */
  const updateProducts = (nextValue) => {
    //  Tính toán giá trị mới (xử lý cả trường hợp truyền vào function hoặc giá trị)
    const nextProducts = typeof nextValue === "function"
      ? nextValue(products)
      : nextValue;
    //  Cập nhật vào State để hiển thị giao diện
    setProducts(nextProducts);
    // Lưu vào bộ nhớ LocalStorage
    saveStoredProducts(nextProducts);
  };
  // Trả về các giá trị cần thiết cho Component sử dụng
  return {
    products,              // Danh sách sản phẩm
    setProducts: updateProducts, // Hàm để thêm/sửa/xóa sản phẩm
    loading: needsSeed ? loading : false, // Trạng thái đang tải (chỉ đúng khi máy chưa có dữ liệu)
    error: needsSeed ? error : null,      // Lỗi phát sinh từ API (nếu có)
  };
}