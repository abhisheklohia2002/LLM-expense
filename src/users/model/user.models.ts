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
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "manager", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("users", userSchemma);
export default userModel;
