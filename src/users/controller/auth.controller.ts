import type { Request, Response, NextFunction } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import config from "../../config";

class AuthController {
  googleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.query.code as string;

      if (!code) {
        return res.status(400).json({
          message: "Google authorization code is missing",
        });
      }

      // 1. Exchange Google code for access token
      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          code,
          client_id:config.client_id,
          client_secret:config.client_secret,
          redirect_uri:config.redirect_uri,
          grant_type: "authorization_code",
        }
      );

      const { access_token } = tokenResponse.data;

      // 2. Get Google user profile
      const userResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

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
        }
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
}

export default AuthController;