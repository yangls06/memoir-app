"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_1 = require("../utils/ai");
const router = (0, express_1.Router)();
// AI问答
router.post('/chat', async (req, res) => {
    try {
        const { question, noteIds } = req.body;
        if (!question?.trim()) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: '问题不能为空' } });
        }
        const result = await (0, ai_1.chatWithNotes)(question, noteIds);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'AI问答失败' } });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map