"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const notes_1 = __importDefault(require("./routes/notes"));
const tags_1 = __importDefault(require("./routes/tags"));
const ai_1 = __importDefault(require("./routes/ai"));
// 加载环境变量
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// 中间件
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'http://localhost:5173'
        : 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API路由
app.use('/api/notes', notes_1.default);
app.use('/api/tags', tags_1.default);
app.use('/api/ai', ai_1.default);
// 404处理
app.use((req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } });
});
// 错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
        }
    });
});
// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API endpoints:`);
    console.log(`   - GET    /api/notes`);
    console.log(`   - POST   /api/notes`);
    console.log(`   - GET    /api/notes/:id`);
    console.log(`   - PUT    /api/notes/:id`);
    console.log(`   - DELETE /api/notes/:id`);
    console.log(`   - POST   /api/notes/:id/summarize`);
    console.log(`   - GET    /api/tags`);
    console.log(`   - POST   /api/tags`);
    console.log(`   - DELETE /api/tags/:id`);
    console.log(`   - POST   /api/ai/chat`);
});
exports.default = app;
//# sourceMappingURL=app.js.map