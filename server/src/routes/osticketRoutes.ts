import { Router } from "express";
import { getTicketsWithStatusCR, getTicketsWithStatusOpen } from "../controller/osticketController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

// Route to fetch tickets with status 'CR'
router.get("/tickets/status-cr", getTicketsWithStatusCR);

// Route to fetch tickets with status 'Open'
router.get("/tickets/status-open", getTicketsWithStatusOpen);

export default router;