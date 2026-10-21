import express from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoriesController.js";
import { authenticateToken, requireAdmin, requireViewer } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, requireViewer, getCategories);
router.get("/:id", authenticateToken, requireViewer, getCategoryById);
router.post("/", authenticateToken, requireAdmin, createCategory);
router.patch("/:id", authenticateToken, requireAdmin, updateCategory);
router.delete("/:id", authenticateToken, requireAdmin, deleteCategory);

export default router;
