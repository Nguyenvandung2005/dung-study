import React, { useState, useEffect } from "react";
import { provinces, getDistricts, getWards } from "../data/vietnamAddress";

// editData: truyền vào khi muốn chỉnh sửa địa chỉ đã có (không truyền = thêm mới)
export default function AddressModal({ show, onClose, onSave, editData = null }) {
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [street, setStreet] = useState("");
  const [addressType, setAddressType] = useState("Nhà riêng");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Khi mở modal chỉnh sửa → điền sẵn dữ liệu cũ vào form
  useEffect(() => {
    if (show && editData) {
      setPhone(editData.phone || "");
      setFullName(editData.fullName || "");
      setProvince(editData.province || "");
      setDistrict(editData.district || "");
      setWard(editData.ward || "");
      setStreet(editData.street || "");
      setAddressType(editData.addressType || "Nhà riêng");
      setIsDefault(editData.isDefault || false);
    }
    if (show && !editData) {
      // Reset form khi thêm mới
      setPhone(""); setFullName(""); setProvince(""); setDistrict("");
      setWard(""); setStreet(""); setAddressType("Nhà riêng"); setIsDefault(false);
    }
    setError(""); setPhoneError("");
  }, [show, editData]);

  if (!show) return null;

  const handleProvinceChange = (e) => { setProvince(e.target.value); setDistrict(""); setWard(""); };
  const handleDistrictChange = (e) => { setDistrict(e.target.value); setWard(""); };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setPhone(value);
    if (value.length === 0) setPhoneError("");
    else if (!/^0/.test(value)) setPhoneError("Số điện thoại phải bắt đầu bằng số 0.");
    else if (value.length < 10) setPhoneError(`Còn thiếu ${10 - value.length} chữ số.`);
    else setPhoneError("");
  };

  const validatePhone = (value) => {
    if (!value) return "Vui lòng nhập số điện thoại.";
    if (!/^0/.test(value)) return "Số điện thoại phải bắt đầu bằng số 0.";
    if (value.length !== 10) return "Số điện thoại phải có đúng 10 chữ số.";
    return "";
  };

  const handleSave = () => {
    const pErr = validatePhone(phone);
    if (pErr) { setPhoneError(pErr); return; }
    if (!fullName || !province || !district || !ward || !street) {
      setError("Vui lòng điền đầy đủ tất cả thông tin địa chỉ."); return;
    }
    setError(""); setPhoneError("");
    onSave({ phone, fullName, province, district, ward, street, addressType, isDefault });
  };

  const inputBase = {
    width: "100%", padding: "13px 16px",
    background: "#f2f2f2", border: "1.5px solid transparent",
    borderRadius: "10px", fontSize: "14px", color: "#333",
    outline: "none", boxSizing: "border-box", appearance: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "580px", padding: "28px 32px 24px", position: "relative", boxShadow: "0 16px 48px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>

        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", width: 30, height: 30, borderRadius: "50%", background: "#f0f0f0", border: "none", cursor: "pointer", fontSize: "16px", color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        <h5 style={{ fontWeight: 700, fontSize: "18px", marginBottom: "22px", color: "#1a1a1a" }}>
          {editData ? "✏️ Chỉnh sửa địa chỉ" : "📍 Thêm địa chỉ mới"}
        </h5>

        {/* Hàng 1: SĐT + Họ tên */}
        <div style={{ display: "flex", gap: "12px", marginBottom: phoneError ? "4px" : "12px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input type="tel" placeholder="Số điện thoại" value={phone} onChange={handlePhoneChange}
              maxLength={10} inputMode="numeric"
              style={{ ...inputBase, paddingRight: "42px", border: phoneError ? "1.5px solid #e53935" : phone.length === 10 ? "1.5px solid #ff6b81" : "1.5px solid transparent", background: phoneError ? "#fff5f5" : "#f2f2f2" }}
            />
            <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "15px" }}>
              {phone.length === 10 && !phoneError ? "✅" : phoneError ? "❌" : "📋"}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <input type="text" placeholder="Họ và tên" value={fullName} onChange={e => setFullName(e.target.value)} style={inputBase} />
          </div>
        </div>
        {phoneError && <div style={{ fontSize: "12px", color: "#e53935", marginBottom: "10px", paddingLeft: "2px" }}>⚠️ {phoneError}</div>}
        {!phoneError && phone.length > 0 && phone.length < 10 && (
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "10px", paddingLeft: "2px" }}>Đã nhập {phone.length}/10 số</div>
        )}

        {/* Hàng 2: Tỉnh/TP + Quận/Huyện */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <select value={province} onChange={handleProvinceChange} style={{ ...inputBase, paddingRight: "36px", color: province ? "#333" : "#aaa", cursor: "pointer" }}>
              <option value="">Chọn Tỉnh/ TP</option>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#888", pointerEvents: "none", fontSize: "12px" }}>▼</span>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <select value={district} onChange={handleDistrictChange} disabled={!province} style={{ ...inputBase, paddingRight: "36px", color: district ? "#333" : "#aaa", cursor: province ? "pointer" : "not-allowed", opacity: province ? 1 : 0.6 }}>
              <option value="">Chọn Quận/ Huyện</option>
              {getDistricts(province).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#888", pointerEvents: "none", fontSize: "12px" }}>▼</span>
          </div>
        </div>

        {/* Phường/Xã */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <select value={ward} onChange={e => setWard(e.target.value)} disabled={!district} style={{ ...inputBase, paddingRight: "36px", color: ward ? "#333" : "#aaa", cursor: district ? "pointer" : "not-allowed", opacity: district ? 1 : 0.6 }}>
            <option value="">Chọn Phường/ Xã</option>
            {getWards(province, district).map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#888", pointerEvents: "none", fontSize: "12px" }}>▼</span>
        </div>

        {/* Số nhà + Tên đường */}
        <div style={{ marginBottom: "4px" }}>
          <input type="text" placeholder="Số nhà + Tên đường" value={street} onChange={e => setStreet(e.target.value)} disabled={!ward}
            style={{ ...inputBase, opacity: ward ? 1 : 0.6, cursor: ward ? "text" : "not-allowed" }} />
        </div>
        {!ward
          ? <p style={{ fontSize: "12px", color: "#e07b39", margin: "6px 0 12px" }}>Vui lòng chọn Tỉnh/TP, Quận/Huyện và Phường/Xã trước khi nhập Số nhà + Tên Đường</p>
          : <div style={{ marginBottom: "12px" }} />
        }

        {error && <div style={{ background: "#fdecea", color: "#c62828", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px" }}>{error}</div>}

        {/* Loại địa chỉ */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <span style={{ fontSize: "14px", color: "#444", marginRight: "4px" }}>Chọn loại địa chỉ</span>
          {["Nhà riêng", "Công ty"].map(type => (
            <button key={type} onClick={() => setAddressType(type)} style={{ padding: "8px 22px", borderRadius: "25px", border: addressType === type ? "none" : "1.5px solid #ccc", background: addressType === type ? "#ff6b81" : "#fff", color: addressType === type ? "#fff" : "#555", fontWeight: addressType === type ? 700 : 400, fontSize: "14px", cursor: "pointer", transition: "all 0.2s" }}>
              {type}
            </button>
          ))}
        </div>

        {/* Toggle mặc định */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <span style={{ fontSize: "14px", color: "#444" }}>Đặt làm địa chỉ mặc định</span>
          <div onClick={() => setIsDefault(!isDefault)} style={{ width: 44, height: 24, borderRadius: 12, background: isDefault ? "#ff6b81" : "#ddd", position: "relative", cursor: "pointer", transition: "background 0.25s" }}>
            <div style={{ position: "absolute", top: 3, left: isDefault ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.25s" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button onClick={onClose} style={{ padding: "12px 32px", borderRadius: "25px", background: "#ffe8ec", border: "none", color: "#ff6b81", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>Hủy</button>
          <button onClick={handleSave} style={{ padding: "12px 32px", borderRadius: "25px", background: "#ff6b81", border: "none", color: "#fff", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 12px rgba(45,106,79,0.3)" }}>
            {editData ? "Cập nhật" : "Tiếp tục"}
          </button>
        </div>
      </div>
    </div>
  );
}