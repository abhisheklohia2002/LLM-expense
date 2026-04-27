import mongoose from "mongoose";
import type { IUser } from "../../interface/common";

const userSchemma = new mongoose.Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "manager", "user"],
      default: "user",
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("users", userSchemma);
export default userModel;
