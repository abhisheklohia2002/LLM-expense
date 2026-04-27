import type { JwtPayload } from "jsonwebtoken";

export interface IUser {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "user";
  googleId?:string | number;

}

export interface RefreshTokenPayload extends JwtPayload {
  email: string;
  role: "admin" | "manager" | "user";
  fullName: string;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface RefreshTokenRequest extends Request {
  auth?: RefreshTokenPayload;
}



export interface AccessTokenPayload extends JwtPayload {
  email: string;
  role: "admin" | "manager" | "user";
  fullName: string;
  sub: string;
  iat: number;
  exp: number;
}


export interface AuthRequest extends Request {
  auth?: AccessTokenPayload;
}