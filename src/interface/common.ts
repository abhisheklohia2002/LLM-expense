export interface IUser {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "user";
}



export interface AuthRequest extends Request {
  auth?: {
    sub: number;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
    iss?: string;
  };
}