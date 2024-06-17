import { Router } from "express";
import {
  authUser,
  changeAvatar,
  getAllAuthors,
  getUserProfile,
  logOutUser,
  registerUser,
  updateUserProfile,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = new Router();

router.post("/auth", authUser);
router.post("/change-avatar", protect, changeAvatar);

router.post("/", registerUser);

router.post("/logout", logOutUser);
router.put("/profile", protect, updateUserProfile);

router.get("/profile", protect, getUserProfile);
router.get("/authors", getAllAuthors);

export default router;
