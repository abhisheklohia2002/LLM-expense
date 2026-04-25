import type { Request, Response, NextFunction } from "express";
import axios from "axios";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import userModel from "../model/user.models";
import type UserService from "../service/user.service";
import type AuthService from "../../Service/common/Auth.service";
import { Types } from "mongoose";
import type { AuthRequest, RefreshTokenPayload } from "../../interface/common";

class AuthController {
  constructor(
    private userService: UserService,
    private tokenService: AuthService,
  ) {}
  googleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.query.code as string;

      if (!code) {
        return res.status(400).json({
          message: "Google authorization code is missing",
        });
      }

      // 1. Exchange Google code for access token
      const tokenResponse = await axios.post(config.oAuthGoogleToken, {
        code,
        client_id: config.client_id,
        client_secret: config.client_secret,
        redirect_uri: config.redirect_uri,
        grant_type: "authorization_code",
      });

      const { access_token } = tokenResponse.data;

      // 2. Get Google user profile
      const userResponse = await axios.get(config.scopes, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const googleUser = userResponse.data;

      /*
              googleUser example:
              {
                id: "123456789",
                email: "test@gmail.com",
                name: "Abhishek",
                picture: "https://...",
                verified_email: true
              }
            */

      // 3. Find or create user in your DB
      // Example only:
      const user = {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      };

      // 4. Generate your app JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        config.jwtSecret as string,
        {
          expiresIn: "7d",
        },
      );

      // 5. Send token in HTTP-only cookie
      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: false, // true in production with HTTPS
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // 6. Redirect user back to frontend
      return res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ error: result.array() });
    }
    const { fullName, email, password, role } = req.body;
    if (!email) {
      const error = createHttpError(400, "Email is required");
      next(error);
      return;
    }

    const isExisted = await userModel.findOne({ email });
    if (isExisted) {
      const error = createHttpError(400, "user is already exist");
      next(error);
      return;
    }
    try {
      const createUser = await this.userService.register(req.body);
      const payload: JwtPayload = {
        email,
        role,
        fullName,
        sub: createUser._id.toString(),
      };

      const generateAccessToken =
        this.tokenService.generateAccessToken(payload);
      const generateRefreshToken = this.tokenService.generateRefressToken(
        payload,
        createUser._id.toString(),
      );
      const persistToken = await this.tokenService.persistRefreshToken(
        generateRefreshToken,
        createUser._id as Types.ObjectId,
      );
      res.cookie("accessToken", generateAccessToken, {
        domain: "localhost",
        sameSite: "strict",
        httpOnly: true,
        maxAge: 1000 * 60 * 60, // one hour
      });
      res.cookie("refreshToken", generateRefreshToken, {
        domain: "localhost",
        sameSite: "strict",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365, // one Year
      });
      res.status(201).json({
        message: "User registered successfully",
        data: { fullName, email, role },
      });
    } catch (error) {
      const err = createHttpError(500, "user server error");
      next(err);
      return;
    }
  };
  login = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ error: result.array() });
    }
    const { email, password } = req.body;
    if (!email) {
      const error = createHttpError(400, "Email is required");
      next(error);
      return;
    }

    const isExisted = await userModel.findOne({ email });
    if (!isExisted) {
      const error = createHttpError(400, "user is not existed");
      next(error);
      return;
    }

    try {
      const payload: JwtPayload = {
        email,
        role: isExisted.role,
        fullName: isExisted.fullName,
        sub: isExisted._id.toString(),
      };
      const accessToken = this.tokenService.generateAccessToken(payload);
      const generateRefreshToken = this.tokenService.generateRefressToken(
        payload,
        isExisted._id.toString(),
      );
      const persistToken = await this.tokenService.persistRefreshToken(
        generateRefreshToken,
        isExisted._id as Types.ObjectId,
        "update",
      );

      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        httpOnly: true,
        maxAge: 1000 * 60 * 60, // one hour
      });
      res.cookie("refreshToken", generateRefreshToken, {
        domain: "localhost",
        sameSite: "strict",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365, // one Year
      });
      res.status(200).json({ message: "login successfully" });
    } catch (error) {
      const err = createHttpError(500, "user server error");
      next(err);
      return;
    }
  };

  self = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.auth?.sub;
    if (!userId) {
      return next(createHttpError(401, "Unauthorized"));
    }
    try {
      const isExisted = await userModel.findById({ _id: userId });
      if (!isExisted) {
        return next(createHttpError(404, "User not found"));
      }
      return res.status(200).json({ user: isExisted });
    } catch (error) {
      const err = createHttpError(500, "user server error");
      next(err);
      return;
    }
  };

  refreshToken = async (
    req: RefreshTokenPayload,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const auth = req?.auth;
      const userId = auth?.sub;
      const email = auth?.email;
      const jti = auth?.jti;
      if (!userId || !jti) {
        throw createHttpError(401, "Invalid refresh token payload");
      }
      const isExisted = await userModel.findById({ _id: userId });
      const deleteToken = await this.tokenService.deleteRefreshToken(userId);
      // console.log(isExisted,deleteToken)
      if (isExisted) {
        const payload: JwtPayload = {
          email,
          role: isExisted.role,
          fullName: isExisted.fullName,
          sub: isExisted._id.toString(),
        };

        const accessToken = this.tokenService.generateAccessToken(payload);
        const generateRefreshToken = this.tokenService.generateRefressToken(
          payload,
          isExisted._id.toString(),
        );
        const persistToken = await this.tokenService.persistRefreshToken(
          generateRefreshToken,
          isExisted._id as Types.ObjectId,
          "create",
        );

        res.cookie("accessToken", accessToken, {
          domain: "localhost",
          sameSite: "strict",
          httpOnly: true,
          maxAge: 1000 * 60 * 60, // one hour
        });
        res.cookie("refreshToken", generateRefreshToken, {
          domain: "localhost",
          sameSite: "strict",
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 365, // one Year
        });
        res.status(200).json({ message: "Refresh Token and Access Token Generate successfully" });
      }
    } catch (error) {
      const err = createHttpError(500, "user server error");
      next(err);
      return;
    }
  };
}

export default AuthController;
