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
import { loginValidator } from "../../validators/login";
import Authenications from "../../common/middleware/Authenications";

import validateRefreshToken from "../../common/middleware/validateRefreshToken";

const auth = express.Router();
const userService = new UserService();
const authService = new AuthService();
const authController = new AuthController(userService, authService);
auth.get("/callback", (req: Request, res: Response, next: NextFunction) =>
  authController.googleAuth(req, res, next),
);

auth.post(
  "/register",
  registerValidator,
  (req: Request, res: Response, next: NextFunction) =>
    authController.register(req, res, next),
);

auth.post(
  "/login",
  loginValidator,
  (req: Request, res: Response, next: NextFunction) =>
    authController.login(req, res, next),
);

auth.get(
  "/self",Authenications as RequestHandler,
  (req: Request, res: Response, next: NextFunction) =>
    authController.self(req as any, res, next)
);

auth.post('/refreshToken',validateRefreshToken ,(req: Request, res: Response,next:NextFunction) =>
    authController.refreshToken(req as any, res,next))
export default auth;
