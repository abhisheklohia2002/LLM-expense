import { body } from "express-validator";

export const messageValidator = [
     body("chatId")
    .notEmpty()
    .withMessage("chatId name is required"),
    body('role')
    .notEmpty()
    .withMessage("role is user or assistant required"),
     body('status')
    .notEmpty()
    .withMessage("status is completed | streaming | failed required"),
]