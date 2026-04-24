export interface IUser {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "user";
}