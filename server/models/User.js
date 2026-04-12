import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: undefined },
    phone: { type: String, trim: true, default: undefined },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    gender: { type: String, default: "khong_xac_dinh" },
    dob: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
