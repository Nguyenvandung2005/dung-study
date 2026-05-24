import "dotenv/config"; // Nạp các biến môi trường từ file .env
import express from "express"; // Framework để tạo web server và API
import cors from "cors";
import mongoose from "mongoose"; // Thư viện kết nối và thao tác với MongoDB

const app = express();
const PORT = Number.parseInt(process.env.PORT, 10) || 4000; // Cổng chạy server, mặc định là 4000
const PORT_RETRY_COUNT = Number.parseInt(process.env.PORT_RETRY_COUNT, 10) || 10;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pinkycloud";

// --- MIDDLEWARE ---
app.use(cors()); // Kích hoạt CORS để React gọi được API
app.use(express.json()); // Cho phép Server đọc dữ liệu JSON từ request body

/**
 * Hàm hỗ trợ: Loại bỏ các trường mặc định của MongoDB (_id, __v)
 */
function removeMongoFields(document = {}) {
  if (!document) return document;
  const { _id, __v, ...safeDocument } = document;
  return safeDocument;
}

/**
 * Hàm hỗ trợ: Lấy danh sách dữ liệu từ một Collection (Bảng) bất kỳ
 */
async function getCollectionItems(collectionName, query = {}) {
  const documents = await mongoose.connection.db
    .collection(collectionName)
    .find(query)
    .toArray();

  return documents.map(removeMongoFields);
}

/**
 * Hàm hỗ trợ: Chuẩn hóa thông tin người dùng trước khi trả về frontend
 */
function sanitizeUser(user = {}) {
  const { _id, __v, password, ...safeUser } = user;
  return {
    ...safeUser,
    id: user.id || _id?.toString?.() || "",
  };
}

/**
 * Hàm hỗ trợ: Xác định loại liên hệ là email hay số điện thoại
 */
function getContactType(contact = "") {
  return String(contact).includes("@") ? "email" : "phone";
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Tương thích dữ liệu voucher cũ và mới:
 * - Mới: discountType + discountValue
 * - Cũ: discountPercent / discountAmount / amount / percent ...
 */
function normalizeVoucherDiscount(voucher = {}) {
  const explicitType = String(voucher.discountType || "").trim().toLowerCase();
  const explicitValue = parseNumber(voucher.discountValue);

  if (explicitType && explicitValue !== null) {
    return { discountType: explicitType, discountValue: explicitValue };
  }

  const percentLike = [
    voucher.discountPercent,
    voucher.percent,
    voucher.percentage,
  ];
  for (const value of percentLike) {
    const parsed = parseNumber(value);
    if (parsed !== null) {
      return { discountType: "percent", discountValue: parsed };
    }
  }

  const fixedLike = [
    voucher.discountAmount,
    voucher.amount,
    voucher.fixedAmount,
  ];
  for (const value of fixedLike) {
    const parsed = parseNumber(value);
    if (parsed !== null) {
      return { discountType: "fixed", discountValue: parsed };
    }
  }

  return { discountType: "", discountValue: 0 };
}

// --- CÁC ĐƯỜNG DẪN API (ENDPOINTS) ---

// 1. Kiểm tra tình trạng server
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// 1.1 Kiểm tra Email/SĐT đã tồn tại chưa (Dùng cho validation lúc gõ form)
app.post("/api/auth/check-contact", async (req, res) => {
  const contact = String(req.body?.contact || "").trim().toLowerCase();

  if (!contact) {
    return res.status(400).json({ message: "Thiếu email hoặc số điện thoại." });
  }

  const exists = await mongoose.connection.db
    .collection("users")
    .findOne({ contact });

  return res.json({ exists: Boolean(exists) });
});

// 1.2 Đăng ký tài khoản mới và lưu vào MongoDB
app.post("/api/auth/register", async (req, res) => {
  const {
    contact = "",
    password = "",
    name = "",
    gender = "khong_xac_dinh",
    dob = "",
  } = req.body || {};

  const normalizedContact = String(contact).trim().toLowerCase();

  // Kiểm tra các trường bắt buộc
  if (!normalizedContact || !password || !String(name).trim()) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
  }

  const usersCollection = mongoose.connection.db.collection("users");

  // Kiểm tra trùng lặp tài khoản
  const exists = await usersCollection.findOne({ contact: normalizedContact });
  if (exists) {
    return res.status(409).json({ message: "Email hoặc số điện thoại này đã được đăng ký." });
  }

  const contactType = getContactType(normalizedContact);
  const newUser = {
    id: `user-${Date.now()}`,
    contact: normalizedContact,
    email: contactType === "email" ? normalizedContact : "",
    phone: contactType === "phone" ? normalizedContact : "",
    password, // Lưu ý: Thực tế nên mã hóa mật khẩu bằng bcrypt
    name: String(name).trim(),
    gender,
    dob,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  await usersCollection.insertOne(newUser);
  return res.status(201).json({ user: sanitizeUser(newUser) });
});

// 1.3 Đăng nhập: Kiểm tra thông tin từ MongoDB
app.post("/api/auth/login", async (req, res) => {
  const { contact = "", password = "" } = req.body || {};
  const normalizedContact = String(contact).trim().toLowerCase();

  const user = await mongoose.connection.db
    .collection("users")
    .findOne({ contact: normalizedContact, password });

  if (!user) {
    return res.status(401).json({ message: "Email/SĐT hoặc mật khẩu không đúng." });
  }

  return res.json({ user: sanitizeUser(user) });
});

// 2. Lấy danh sách tất cả sản phẩm
app.get("/api/products", async (_req, res) => {
  const products = await getCollectionItems("products");
  res.json(products);
});

// 3. Lấy thông tin chi tiết sản phẩm theo ID
app.get("/api/products/:id", async (req, res) => {
  const product = await mongoose.connection.db
    .collection("products")
    .findOne({ id: req.params.id });

  if (!product) {
    return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
  }

  return res.json(removeMongoFields(product));
});

// 4. Lấy danh sách tin tức
app.get("/api/news-items", async (_req, res) => {
  const newsItems = await getCollectionItems("news_items");
  res.json(newsItems);
});

// 5. Lấy danh sách Voucher hot
app.get("/api/hot-vouchers", async (_req, res) => {
  const hotVouchers = await getCollectionItems("hot_vouchers");
  res.json(hotVouchers);
});

// 6. Lấy cấu trúc Mega Menu
app.get("/api/mega-menu", async (_req, res) => {
  const megaMenu = await getCollectionItems("mega_menu");
  res.json(megaMenu);
});

// 7. Lấy địa chỉ văn phòng
app.get("/api/office-locations", async (_req, res) => {
  const officeLocations = await getCollectionItems("office_locations");
  res.json(officeLocations);
});

// 8. Lấy URL thương hiệu
app.get("/api/brand-urls", async (_req, res) => {
  const brandUrlItems = await getCollectionItems("brand_urls");
  const brandUrls = brandUrlItems.reduce((result, item) => {//Chuyển mảng thành object để đọc nhanh
    result[item.brand] = item.url;
    return result;
  }, {});

  res.json(brandUrls);
});

// 9. Lấy danh sách địa chỉ Việt Nam
app.get("/api/vietnam-addresses", async (_req, res) => {
  const addressItems = await getCollectionItems("vietnam_addresses");
  const addressMap = addressItems.reduce((result, item) => {
    result[item.province] = item.districts || {};
    return result;
  }, {});

  res.json(addressMap);
});
// 10. Validate mã voucher
app.post("/api/vouchers/validate", async (req, res) => {
  const { code = "", totalAmount = 0 } = req.body || {};
  const normalizedCode = String(code).trim().toUpperCase();

  if (!normalizedCode) {
    return res.status(400).json({ message: "Vui lòng nhập mã voucher." });
  }

  const voucher = await mongoose.connection.db
    .collection("hot_vouchers")
    .findOne({ code: normalizedCode });

  if (!voucher) {
    return res.status(404).json({ message: "Mã voucher không hợp lệ." });
  }

  const { discountType, discountValue } = normalizeVoucherDiscount(voucher);
  if (!discountType || discountValue <= 0) {
    return res.status(400).json({
      message: "Mã voucher chưa được cấu hình giảm giá. Vui lòng chọn mã khác.",
    });
  }

  // Kiểm tra đơn tối thiểu
  if (voucher.minOrder && totalAmount < voucher.minOrder) {
    return res.status(400).json({
      message: `Đơn hàng tối thiểu ${voucher.minOrder.toLocaleString("vi-VN")}đ để dùng mã này.`,
    });
  }

  // Tính tiền giảm
  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = Math.round((totalAmount * discountValue) / 100);
    if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
      discountAmount = voucher.maxDiscount;
    }
  } else {
    discountAmount = discountValue;
  }

  return res.json({
    success: true,
    voucher: {
      code: voucher.code,
      title: voucher.title,
      discountType,
      discountValue,
      discountAmount,
    },
  });
});
// 10. Tạo đơn hàng mới
app.post("/api/orders", async (req, res) => {
  const { userId, userContact, items, address, paymentMethod, totalAmount, discountAmount, finalAmount, voucherCode, note } = req.body || {};

  if (!items?.length || !address) {
    return res.status(400).json({ message: "Thiếu thông tin đơn hàng." });
  }

  const newOrder = {
    id: `DH${Date.now()}`,
    userId,
    userContact,
    items,
    address,
    paymentMethod,
    totalAmount,
    discountAmount: discountAmount || 0,
    finalAmount,
    voucherCode: voucherCode || null,
    note: note || "",
    status: "processing",
    createdAt: new Date().toISOString(),
  };

  await mongoose.connection.db.collection("orders").insertOne(newOrder);
  return res.status(201).json({ order: newOrder });
});

// 11. Lấy danh sách đơn hàng theo userId
app.get("/api/orders/:userId", async (req, res) => {
  const orders = await mongoose.connection.db
    .collection("orders")
    .find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .toArray();

  return res.json(orders.map(removeMongoFields));
});
/**
 * Khởi động Server
 */
function listenOnAvailablePort(startPort, retryCount) {
  return new Promise((resolve, reject) => {
    const tryListen = (port, retriesLeft) => {
      const server = app.listen(port, () => {
        resolve({ server, port });
      });

      server.on("error", (error) => {
        if (error.code === "EADDRINUSE" && retriesLeft > 0) {
          console.warn(`Cổng ${port} đang được sử dụng, thử chuyển sang cổng ${port + 1}...`);
          tryListen(port + 1, retriesLeft - 1);
          return;
        }

        reject(error);
      });
    };

    tryListen(startPort, retryCount);
  });
}

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Đã kết nối cơ sở dữ liệu:", MONGODB_URI);

    const { port } = await listenOnAvailablePort(PORT, PORT_RETRY_COUNT);
    console.log(`Server API đang chạy tại: http://localhost:${port}`);
  } catch (err) {
    console.error("Không thể khởi động server:", err);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error("Không thể khởi động server:", error);
  process.exit(1);
});
