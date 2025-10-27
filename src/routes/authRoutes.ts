import express from 'express';
import {
  signupRequestOTP,
  verifySignup,
  login,
  requestForgotPasswordOTP,
  verifyForgotPasswordOTP,
  updateDeviceToken,
  getProfile
} from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';
const router = express.Router();

router.post('/signup/request-otp', signupRequestOTP);
router.post('/signup/verify', verifySignup);
router.get('/profile', requireAuth, getProfile);
router.post('/login', login);
router.put('/device-token', requireAuth, updateDeviceToken);
router.post('/forgot/request-otp', requestForgotPasswordOTP);
router.post('/forgot/verify', verifyForgotPasswordOTP);

export default router;
