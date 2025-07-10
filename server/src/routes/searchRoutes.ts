import { Router } from "express";
import { getSuggestions, search } from "../controller/searchController";

const router = Router();

// Search Routes
router.get("/", search);
router.get("/suggestions", getSuggestions);

export default router;