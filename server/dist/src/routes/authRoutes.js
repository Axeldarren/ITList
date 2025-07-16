"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controller/authController");
const router = (0, express_1.Router)();
router.post('/login', (req, res, next) => {
    (0, authController_1.login)(req, res, next);
});
router.get('/logout', (req, res, next) => {
    (0, authController_1.logout)(req, res);
});
exports.default = router;
