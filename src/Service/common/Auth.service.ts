import createHttpError from "http-errors";
import jwt, { type JwtPayload } from "jsonwebtoken";
import path from "node:path";
import fs from "fs";
import config from "../../config";
import RefreshToken from "../../users/model/refershToken";
import { Types } from "mongoose";
import { Redirect$ } from "@aws-sdk/client-s3";
class AuthService {
  getPrivateKey = () => {
    const keyPath = path.resolve(process.cwd(), "certs", "private.pem");
    if (!fs.existsSync(keyPath)) {
      throw createHttpError(500, `Private key not found at: ${keyPath}`);
    }

    return fs.readFileSync(keyPath, "utf8");
  };
  generateAccessToken(data: JwtPayload) {
    const privateKey = this.getPrivateKey();
    return jwt.sign(data, privateKey, { algorithm: "RS256", expiresIn: "1h" });
  }
  generateRefressToken(data: JwtPayload,id: string) {
    return jwt.sign(data, config.refreshTokenSecret, {
      algorithm: "HS256",
      expiresIn: "1y",
      jwtid: id,
    });
  }

  persistRefreshToken = async (
  token: string,
  userId: Types.ObjectId,
  type?: "create" | "update"
) => {
  const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;

  if (type === "update") {
    return await RefreshToken.findOneAndUpdate(
      { userId },
      {
        $set: {
          token,
          expiresAt: new Date(Date.now() + MS_IN_YEAR),
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  }

  return await RefreshToken.create({
    userId,
    token,
    expiresAt: new Date(Date.now() + MS_IN_YEAR),
  });
};
}

export default AuthService;
