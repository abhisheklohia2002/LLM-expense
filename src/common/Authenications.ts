import config from "../config";
import { expressjwt, type GetVerificationKey } from "express-jwt";
import jwksRsa from "jwks-rsa";
import type { Request } from "express";
if (!config.jwks_URL) {
  throw new Error("JWKS_URI is not defined");
}

export const authMiddleware = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: config.jwks_URL,
    cache: true,
    rateLimit: true,
  }) as GetVerificationKey,
   algorithms: ["RS256"],
   getToken:(req:Request)=>{
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) return auth.split(" ")[1];
    const {accessToken} = req.cookies ;
    return accessToken;
   }
});
