import { body, validationResult } from "express-validator";

export const validateEmail = [
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.'),
    body('password')
    .isLength({
        min: 8
    })
    .withMessage('Password must be 8 characters long.')
]