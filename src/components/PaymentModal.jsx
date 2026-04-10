import React, { useState, useEffect } from "react";

// ────────────────────────────────────────────────
// ⚙️  CẤU HÌNH — chỉnh thông tin ngân hàng thật ở đây
// ────────────────────────────────────────────────
const BANK_INFO = {
  bankName: "Vietcombank",
  accountNo: "1234567890",
  accountName: "NGUYEN VAN A",
  branch: "Chi nhánh TP. Hồ Chí Minh",
};

// QR chuyển khoản dùng VietQR (free, không cần đăng ký)
// Định dạng: https://img.vietqr.io/image/{bank}-{stk}-{template}.png?amount={amount}&addInfo={note}&accountName={name}
const BANK_CODES = { Vietcombank: "VCB", Techcombank: "TCB", MBBank: "MB", VietinBank: "CTG", BIDV: "BIDV", Agribank: "AGR" };

function getQRUrl(amount, orderCode) {
  const bankCode = BANK_CODES[BANK_INFO.bankName] || "VCB";
  const info = encodeURIComponent(`Thanh toan don hang ${orderCode}`);
  const name = encodeURIComponent(BANK_INFO.accountName);
  return `https://img.vietqr.io/image/${bankCode}-${BANK_INFO.accountNo}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${name}`;
}

// ────────────────────────────────────────────────
export default function PaymentModal({ show, onClose, onSuccess, paymentMethod, totalAmount }) {
  const [step, setStep] = useState("idle"); // idle | processing | success | failed
  const [countdown, setCountdown] = useState(300);  // 5 phút cho bank transfer
  const [copied, setCopied] = useState("");
  const orderCode = `DH${Date.now().toString().slice(-8)}`;

  // Reset khi mở modal
  useEffect(() => {
    if (show) { setStep("idle"); setCountdown(300); setCopied(""); }
  }, [show, paymentMethod]);

  // Countdown cho chuyển khoản
  useEffect(() => {
    if (!show || paymentMethod !== "bank" || step !== "idle") return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [show, paymentMethod, step]);

  if (!show) return null;

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const formatVnd = (v) => `${v.toLocaleString("vi-VN")} đ`;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  // Giả lập xử lý thanh toán (MoMo / VNPay)
  const simulatePayment = () => {
    setStep("processing");
    setTimeout(() => {
      const success = Math.random() > 0.15; // 85% thành công
      setStep(success ? "success" : "failed");
    }, 2500);
  };

  // Xác nhận đã chuyển khoản
  const confirmBankTransfer = () => {
    setStep("processing");
    setTimeout(() => setStep("success"), 2000);
  };

  const overlayStyle = {
    position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
  };
  const modalStyle = {
    background: "#fff", borderRadius: 16, width: "100%",
    maxWidth: paymentMethod === "bank" ? 480 : 400,
    maxHeight: "92vh", overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    position: "relative",
  };

  // ─── BƯỚC: PROCESSING ───
  if (step === "processing") return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, padding: "48px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {paymentMethod === "momo" ? "💜" : paymentMethod === "vnpay" ? "💳" : "🏦"}
        </div>
        <ProcessingSpinner />
        <div style={{ marginTop: 20, fontWeight: 600, fontSize: 16, color: "#333" }}>
          {paymentMethod === "bank" ? "Đang xác nhận thanh toán..." : "Đang xử lý thanh toán..."}
        </div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 8 }}>Vui lòng không đóng cửa sổ này</div>
      </div>
    </div>
  );

  // ─── BƯỚC: SUCCESS ───
  if (step === "success") return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, padding: "48px 32px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36 }}>✅</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: "#2e7d32", marginBottom: 8 }}>Thanh toán thành công!</div>
        <div style={{ fontSize: 14, color: "#555", marginBottom: 6 }}>Mã đơn hàng: <b style={{ color: "#ff6b81" }}>#{orderCode}</b></div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ff6b81", marginBottom: 24 }}>{formatVnd(totalAmount)}</div>
        <button onClick={() => { onSuccess(); onClose(); }}
          style={{ background: "#ff6b81", color: "#fff", border: "none", borderRadius: 25, padding: "12px 40px", fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%" }}>
          Về trang chủ
        </button>
      </div>
    </div>
  );

  // ─── BƯỚC: FAILED ───
  if (step === "failed") return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, padding: "48px 32px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fdecea", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36 }}>❌</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: "#c62828", marginBottom: 8 }}>Thanh toán thất bại</div>
        <div style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>Giao dịch không thành công. Vui lòng thử lại.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setStep("idle")} style={{ flex: 1, background: "#ff6b81", color: "#fff", border: "none", borderRadius: 25, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Thử lại</button>
          <button onClick={onClose} style={{ flex: 1, background: "#f0f0f0", color: "#555", border: "none", borderRadius: 25, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Hủy</button>
        </div>
      </div>
    </div>
  );

  // ─── BƯỚC: IDLE (nội dung chính) ───
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>

        {/* Header modal */}
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>
              {paymentMethod === "bank" ? "🏦" : paymentMethod === "momo" ? "💜" : "💳"}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#222" }}>
                {paymentMethod === "bank" && "Chuyển khoản ngân hàng"}
                {paymentMethod === "momo" && "Thanh toán MoMo"}
                {paymentMethod === "vnpay" && "Thanh toán VNPay"}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>Mã đơn: #{orderCode}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f5f5f5", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>

          {/* Số tiền cần thanh toán */}
          <div style={{ background: "#fff5f7", borderRadius: 10, padding: "14px 18px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Số tiền thanh toán</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#ff6b81" }}>{formatVnd(totalAmount)}</div>
          </div>

          {/* ═══ NỘI DUNG THEO PHƯƠNG THỨC ═══ */}

          {/* CHUYỂN KHOẢN NGÂN HÀNG */}
          {paymentMethod === "bank" && (
            <div>
              {/* QR Code */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 10 }}>Quét mã QR để chuyển khoản</div>
                <div style={{ display: "inline-block", padding: 10, border: "2px solid #ff6b81", borderRadius: 12, background: "#fff" }}>
                  <img
                    src={getQRUrl(totalAmount, orderCode)}
                    alt="QR chuyển khoản"
                    style={{ width: 180, height: 180, display: "block" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>Hỗ trợ tất cả ứng dụng ngân hàng</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "#eee" }} />
                <span style={{ fontSize: 12, color: "#aaa", whiteSpace: "nowrap" }}>hoặc chuyển khoản thủ công</span>
                <div style={{ flex: 1, height: 1, background: "#eee" }} />
              </div>

              {/* Thông tin tài khoản */}
              <div style={{ background: "#fafafa", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                {[
                  { label: "Ngân hàng", value: BANK_INFO.bankName, key: "bank" },
                  { label: "Số tài khoản", value: BANK_INFO.accountNo, key: "stk" },
                  { label: "Chủ tài khoản", value: BANK_INFO.accountName, key: "name" },
                  { label: "Chi nhánh", value: BANK_INFO.branch, key: "branch" },
                  { label: "Nội dung CK", value: `Thanh toan don hang ${orderCode}`, key: "note" },
                ].map(row => (
                  <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: "#888", flexShrink: 0, marginRight: 8 }}>{row.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: row.key === "stk" || row.key === "note" ? 700 : 500, color: "#222", textAlign: "right" }}>{row.value}</span>
                      {(row.key === "stk" || row.key === "note") && (
                        <button onClick={() => copyToClipboard(row.value, row.key)}
                          style={{ background: copied === row.key ? "#e8f5e9" : "#f0f0f0", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", color: copied === row.key ? "#2e7d32" : "#555", whiteSpace: "nowrap" }}>
                          {copied === row.key ? "✓ Đã sao chép" : "Sao chép"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Countdown */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, fontSize: 13, color: countdown < 60 ? "#e53935" : "#888" }}>
                ⏱ Giao dịch hết hạn sau: <b style={{ fontFamily: "monospace", fontSize: 15 }}>{fmtTime(countdown)}</b>
              </div>

              {/* Cảnh báo */}
              <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#795548", marginBottom: 16, display: "flex", gap: 8 }}>
                ⚠️ Nhập đúng nội dung chuyển khoản để đơn hàng được xác nhận tự động.
              </div>

              <button onClick={confirmBankTransfer}
                style={{ width: "100%", background: "#ff6b81", color: "#fff", border: "none", borderRadius: 25, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                ✅ Tôi đã chuyển khoản xong
              </button>
            </div>
          )}

          {/* MOMO */}
          {paymentMethod === "momo" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #d63384, #a50064)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 40 }}>💜</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Ví MoMo</div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 24, lineHeight: 1.6 }}>
                Bấm nút bên dưới để chuyển sang ứng dụng MoMo và hoàn tất thanh toán.
              </div>

              {/* Giả lập màn hình MoMo */}
              <div style={{ background: "#f9f0ff", border: "1px solid #e1bee7", borderRadius: 12, padding: "16px", marginBottom: 20, textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "#7b1fa2", fontWeight: 700, marginBottom: 10 }}>📱 Thông tin thanh toán MoMo</div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>🏪 Người nhận: <b>PinkyCloud Shop</b></div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>💰 Số tiền: <b style={{ color: "#d63384" }}>{formatVnd(totalAmount)}</b></div>
                <div style={{ fontSize: 13, color: "#555" }}>📝 Nội dung: <b>#{orderCode}</b></div>
              </div>

              <button onClick={simulatePayment}
                style={{ width: "100%", background: "linear-gradient(135deg, #d63384, #a50064)", color: "#fff", border: "none", borderRadius: 25, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
                💜 Thanh toán qua MoMo
              </button>
              <button onClick={onClose} style={{ width: "100%", background: "#f0f0f0", color: "#555", border: "none", borderRadius: 25, padding: "11px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Hủy
              </button>

              <div style={{ fontSize: 11, color: "#aaa", marginTop: 12 }}>
                * Đây là demo — không thực hiện giao dịch thật
              </div>
            </div>
          )}

          {/* VNPAY */}
          {paymentMethod === "vnpay" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: 16, background: "linear-gradient(135deg, #005bac, #00a3e0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 40 }}>💳</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Cổng thanh toán VNPay</div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.6 }}>
                Thanh toán an toàn qua cổng VNPay. Hỗ trợ tất cả thẻ ATM nội địa, thẻ quốc tế Visa/Mastercard.
              </div>

              {/* Các loại thẻ hỗ trợ */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {["🏧 ATM nội địa", "💳 Visa", "💳 Mastercard", "📱 QR Code"].map(card => (
                  <span key={card} style={{ background: "#e3f2fd", color: "#1565c0", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>{card}</span>
                ))}
              </div>

              {/* Giả lập thông tin đơn */}
              <div style={{ background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 12, padding: "16px", marginBottom: 20, textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "#1565c0", fontWeight: 700, marginBottom: 10 }}>🔒 Thông tin giao dịch VNPay</div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>🏪 Merchant: <b>PinkyCloud</b></div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>💰 Số tiền: <b style={{ color: "#005bac" }}>{formatVnd(totalAmount)}</b></div>
                <div style={{ fontSize: 13, color: "#555" }}>🔑 Mã GD: <b>#{orderCode}</b></div>
              </div>

              <button onClick={simulatePayment}
                style={{ width: "100%", background: "linear-gradient(135deg, #005bac, #00a3e0)", color: "#fff", border: "none", borderRadius: 25, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
                💳 Tiến hành thanh toán
              </button>
              <button onClick={onClose} style={{ width: "100%", background: "#f0f0f0", color: "#555", border: "none", borderRadius: 25, padding: "11px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Hủy
              </button>

              <div style={{ fontSize: 11, color: "#aaa", marginTop: 12 }}>
                * Đây là demo — không thực hiện giao dịch thật
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProcessingSpinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
      <div style={{
        width: 48, height: 48,
        border: "4px solid #ffe8ec",
        borderTopColor: "#ff6b81",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

const s = document.createElement("style");
s.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
if (!document.head.querySelector("[data-payment-spin]")) {
  s.setAttribute("data-payment-spin", "1");
  document.head.appendChild(s);
}