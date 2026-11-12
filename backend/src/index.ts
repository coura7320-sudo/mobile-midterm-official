import http from 'http';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import conversationRoutes from './routes/conversationRoutes';
import messageRoutes from './routes/messageRoutes';
import groupRoutes from './routes/groupRoutes';
import statusRoutes from './routes/statusRoutes';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware';
import { initSocketServer } from './sockets/socketHandler';

const app = express();
const server = http.createServer(app);
const io = initSocketServer(server);

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'whatsapp-clone-backend',
    socketEnabled: true,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/statuses', statusRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  server.listen(env.PORT, () => {
    console.log(
      `[Backend] Express + Socket.IO server listening on http://localhost:${env.PORT}`
    );
  });
}

export { app, server, io };
