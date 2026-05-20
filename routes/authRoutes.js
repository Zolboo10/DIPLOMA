const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'mongol_travel_secret_key_2025',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// REGISTER
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('Нэрээ оруулна уу'),
    body('lastName').trim().notEmpty().withMessage('Овогоо оруулна уу'),
    body('email').trim().isEmail().withMessage('Имэйл хаяг буруу байна'),
    body('password')
      .isLength({ min: 4 })
      .withMessage('Нууц үг хамгийн багадаа 4 тэмдэгт байх ёстой')
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    try {
      const firstName = req.body.firstName.trim();
      const lastName = req.body.lastName.trim();
      const email = req.body.email.trim().toLowerCase();
      const password = req.body.password;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Энэ имэйл хаяг бүртгэлтэй байна'
        });
      }

      const user = await User.create({
        firstName,
        lastName,
        email,
        password
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Амжилттай бүртгүүллээ',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({
        success: false,
        message: 'Серверийн алдаа гарлаа'
      });
    }
  }
);

// LOGIN
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Имэйл хаяг буруу байна'),
    body('password').notEmpty().withMessage('Нууц үгээ оруулна уу')
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    try {
      const email = req.body.email.trim().toLowerCase();
      const password = req.body.password;

      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Имэйл эсвэл нууц үг буруу байна'
        });
      }

      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Имэйл эсвэл нууц үг буруу байна'
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      return res.json({
        success: true,
        message: 'Амжилттай нэвтэрлээ',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Серверийн алдаа гарлаа'
      });
    }
  }
);

// FORGOT PASSWORD
router.post(
  '/forgot-password',
  [body('email').trim().isEmail().withMessage('Имэйл хаяг буруу байна')],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    try {
      const email = req.body.email.trim().toLowerCase();
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Энэ имэйлтэй хэрэглэгч олдсонгүй'
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

      await user.save();

      const resetURL = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Нууц үг сэргээх</h2>
          <p>Сайн байна уу, ${user.firstName}.</p>
          <p>Та нууц үгээ сэргээх хүсэлт илгээсэн байна.</p>
          <p>Доорх товч дээр дарж шинэ нууц үг үүсгэнэ үү.</p>

          <a href="${resetURL}"
             style="display:inline-block; padding:12px 18px; background:#C77A4A; color:white; text-decoration:none; border-radius:6px;">
            Нууц үг шинэчлэх
          </a>

          <p style="margin-top:20px;">Энэ холбоос 10 минутын хугацаанд хүчинтэй.</p>
          <p>Хэрэв та хүсэлт илгээгээгүй бол энэ имэйлийг үл тоомсорлоорой.</p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: 'Монголоор аялахуй - Нууц үг сэргээх',
        html
      });

      return res.json({
        success: true,
        message: 'Нууц үг сэргээх холбоос таны имэйл рүү илгээгдлээ'
      });
    } catch (error) {
      console.error('Forgot password error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Имэйл илгээхэд алдаа гарлаа'
      });
    }
  }
);

// RESET PASSWORD
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 4 })
      .withMessage('Шинэ нууц үг хамгийн багадаа 4 тэмдэгт байх ёстой')
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    try {
      const { token } = req.params;
      const { password } = req.body;

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Холбоос хүчингүй эсвэл хугацаа дууссан байна'
        });
      }

      const userWithPassword = await User.findById(user._id).select('+password');

      if (!userWithPassword) {
        return res.status(404).json({
          success: false,
          message: 'Хэрэглэгч олдсонгүй'
        });
      }

      const isSamePassword = await userWithPassword.comparePassword(password);

      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'Шинэ нууц үг хуучин нууц үгтэй ижил байж болохгүй'
        });
      }

      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return res.json({
        success: true,
        message: 'Нууц үг амжилттай шинэчлэгдлээ'
      });
    } catch (error) {
      console.error('Reset password error:', error);

      return res.status(500).json({
        success: false,
        message: 'Серверийн алдаа гарлаа'
      });
    }
  }
);

// ME
router.get('/me', protect, async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Me error:', error);

    return res.status(500).json({
      success: false,
      message: 'Серверийн алдаа гарлаа'
    });
  }
});

module.exports = router;