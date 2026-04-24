import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import AuthController from "../controller/auth.controller";

const auth = express.Router();
const authController = new AuthController();
auth.get("/callback", (req: Request, res: Response, next: NextFunction) =>
  authController.googleAuth(req, res, next),
);
export default auth;

