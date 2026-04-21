import React, { useEffect, useState } from "react";

const PRIMARY = "#ff6b81";

function formatVnd(v) { return `${v.toLocaleString("vi-VN")} đ`; }

/**
 * VoucherPopup — Popup hiển thị danh sách voucher có thể dùng
 * Props:
 *   show         : boolean
 *   onClose      : () => void
 *   onSelect     : (code: string) => void  — khi bấm "Dùng ngay"
 *   totalAmount  : number                  — để kiểm tra điều kiện tối thiểu
 */
export default function VoucherPopup({ show, onClose, onSelect, totalAmount = 0 }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    fetch("/api/hot-vouchers")
      .then(r => r.json())
      .then(data => setVouchers(Array.isArray(data) ? data : []))
      .catch(() => setVouchers([]))
      .finally(() => setLoading(false));
  }, [show]);

  if (!show) return null;

  // Kiểm tra voucher có đủ điều kiện không
  const isEligible = (v) => !v.minOrder || totalAmount >= v.minOrder;

  // Tính tiền giảm ước tính
  const calcDiscount = (v) => {
    if (!v.discountType) return null;
    if (v.discountType === "percent") {
      const d = Math.round(totalAmount * v.discountValue / 100);
      return v.maxDiscount ? Math.min(d, v.maxDiscount) : d;
    }
    return v.discountValue || 0;
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1060 }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#fff", borderRadius: 16,
        width: "100%", maxWidth: 480,
        maxHeight: "80vh", overflowY: "auto",
        zIndex: 1061,
        boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>🎟️ Mã giảm giá</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Chọn mã phù hợp với đơn hàng của bạn</div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888", lineHeight: 1 }}>
            ×
          </button>
        </div>

        {/* Nội dung */}
        <div style={{ padding: "16px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#aaa" }}>Đang tải...</div>
          ) : vouchers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#aaa" }}>Không có voucher nào</div>
          ) : (
            vouchers.map((v, i) => {
              const eligible = isEligible(v);
              const discount = calcDiscount(v);
              return (
                <div key={i} style={{
                  display: "flex", gap: 0,
                  borderRadius: 12, overflow: "hidden",
                  border: `1.5px solid ${eligible ? PRIMARY : "#e0e0e0"}`,
                  marginBottom: 12,
                  opacity: eligible ? 1 : 0.6,
                }}>
                  {/* Phần trái — màu accent */}
                  <div style={{
                    background: v.accent || `linear-gradient(135deg, #fff0f3, #ffd6e3)`,
                    padding: "16px 14px",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    minWidth: 90, flexShrink: 0,
                    borderRight: `1.5px dashed ${eligible ? PRIMARY : "#e0e0e0"}`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", marginBottom: 4 }}>VOUCHER</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a", textAlign: "center", letterSpacing: 1 }}>{v.code}</div>
                  </div>

                  {/* Phần phải — thông tin */}
                  <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 4 }}>{v.title}</div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{v.detail}</div>
                      {discount !== null && eligible && (
                        <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
                          Tiết kiệm: {formatVnd(discount)}
                        </div>
                      )}
                      {!eligible && v.minOrder && (
                        <div style={{ fontSize: 12, color: "#f59e0b" }}>
                          ⚠ Cần thêm {formatVnd(v.minOrder - totalAmount)} để dùng mã này
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                      <button
                        disabled={!eligible}
                        onClick={() => { onSelect(v.code); onClose(); }}
                        style={{
                          background: eligible ? PRIMARY : "#e0e0e0",
                          color: eligible ? "#fff" : "#aaa",
                          border: "none", borderRadius: 20,
                          padding: "6px 18px", fontSize: 13,
                          fontWeight: 700,
                          cursor: eligible ? "pointer" : "not-allowed",
                        }}
                      >
                        {eligible ? "Dùng ngay" : "Chưa đủ điều kiện"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}