import { Router } from "express";
import { getSuggestions, search } from "../controller/searchController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);
    
// Search Routes
router.get("/", search);
router.get("/suggestions", getSuggestions);

export default router;