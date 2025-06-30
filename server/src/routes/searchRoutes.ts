import { Router } from "express";
import { search } from "../controller/searchController";

const router = Router();

// Search Routes
router.get("/", search);

export default router;