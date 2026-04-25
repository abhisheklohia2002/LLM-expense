import { expressjwt } from "express-jwt";
import config from "../../config";
import type { Request } from "express";
import createHttpError from "http-errors";
import RefreshToken from "../../users/model/refershToken";

export default expressjwt({
  secret: config.refreshTokenSecret,
  algorithms: ["HS256"],
  getToken: (req: Request) => {
    try {
      const token = req.headers.authorization;
    //   console.log('token.split(" ")?.[1]',token?.split(" ")?.[1])
      if (token?.startsWith("Bearer ")) return token.split(" ")?.[1];
      const { refreshToken } = req.cookies;
      return refreshToken;
    } catch (error) {
      const err = createHttpError(500, "refresh token error");
      return err;
    }
  },
  isRevoked: async (req, token) => {
    try {
      const payload = token?.payload;
      if (!payload || typeof payload === "string") {
        return true;
      }

      const { jti, sub } = payload;

      const dbToken = await RefreshToken.findOne({
        userId: sub,
      });

      if (!dbToken) return true;
      if (dbToken.expiresAt && dbToken.expiresAt.getTime() < Date.now()) {
        return true;
      }
      return false;
    } catch (error) {
      const err = createHttpError(500, "refresh token error");
      console.log(err);
      return true;
    }
  },
});
