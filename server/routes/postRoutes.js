import { Router } from "express";
import {
  createPost,
  deletePost,
  editPost,
  getAllposts,
  getPost,
  getPostByCategory,
  getPostByUser,
  getPostsByUserID,
} from "../controllers/postController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = new Router();
router.get("/", getAllposts);
router.get("/userPosts", protect, getPostByUser);
router.get("/users/:id", getPostsByUserID);
router.get("/:id", getPost);
router.get("/categories/:category", getPostByCategory);
router.post("/", protect, createPost);
router.patch("/:id", protect, editPost);
router.delete("/:id", protect, deletePost);
export default router;
