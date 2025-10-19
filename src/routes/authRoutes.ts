import express from 'express';
import {
  signupRequestOTP,
  verifySignup,
  login,
  requestForgotPasswordOTP,
  verifyForgotPasswordOTP
} from '../controllers/authController';

const router = express.Router();

router.post('/signup/request-otp', signupRequestOTP);
router.post('/signup/verify', verifySignup);
router.post('/login', login);

router.post('/forgot/request-otp', requestForgotPasswordOTP);
router.post('/forgot/verify', verifyForgotPasswordOTP);

export default router;
