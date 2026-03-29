import { Router } from "express";
import { body } from "express-validator";
import { login, me, register } from "../controllers/authController.js";
import { deleteAvatar, uploadAvatar } from "../controllers/profileController.js";
import { avatarUpload } from "../middleware/avatarUpload.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerRules, register);
router.post("/login", loginRules, login);
router.get("/me", requireAuth, me);

router.post(
  "/avatar",
  requireAuth,
  (req, res, next) => {
    avatarUpload.single("photo")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      next();
    });
  },
  uploadAvatar
);
router.delete("/avatar", requireAuth, deleteAvatar);

export default router;
