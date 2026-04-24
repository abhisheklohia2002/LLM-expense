import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import AuthController from "../controller/auth.controller";
import { registerValidator } from "../../validators/register";
import UserService from "../service/user.service";
import AuthService from "../../Service/common/Auth.service";

const auth = express.Router();
const userService = new UserService()
const authService = new AuthService()
const authController = new AuthController(userService,authService);
auth.get("/callback", (req: Request, res: Response, next: NextFunction) =>
  authController.googleAuth(req, res, next),
);

auth.post("/register",registerValidator,(req: Request, res: Response, next: NextFunction) =>
  authController.register(req, res, next),
);

export default auth;
