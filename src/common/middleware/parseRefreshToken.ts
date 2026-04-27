 
import { expressjwt } from "express-jwt";

import type { Request } from "express";
import config from "../../config";



if (!config?.refreshTokenSecret) {
  throw new Error("REFRESH_TOKEN_SECRET is not defined");
}

export default expressjwt({
  secret: config.refreshTokenSecret,
  algorithms: ["HS256"],
  getToken(req: Request) {
    const { refreshToken } = req.cookies;
    return refreshToken;
  },

});
