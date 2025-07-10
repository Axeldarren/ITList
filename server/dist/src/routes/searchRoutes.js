"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const searchController_1 = require("../controller/searchController");
const router = (0, express_1.Router)();
// Search Routes
router.get("/", searchController_1.search);
router.get("/suggestions", searchController_1.getSuggestions);
exports.default = router;
