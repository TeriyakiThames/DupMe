import express from "express";
import cors from "cors";
import http from "http";
import sharedSession from "express-socket.io-session";
import session from "express-session";
import { ExtendedError, Server } from "socket.io";
import { ServerManager } from "./managers/serverManager";
import { SocketIOService } from "./io";
import type { Socket } from "socket.io";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger.json";
import dotenv from "dotenv";
import { testConnection, initializeDatabase } from "./config/database";
import apiRoutes from "./routes";

// Load environment variables
dotenv.config();
const allowedOrigins = ["https://192.168.1.104:3000", "http://192.168.1.104:3000",
                "https://localhost:3000", "http://localhost:3000"];
const app = express();

const expressSession = session({
  secret: 'super-secret-session-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(expressSession);
app.use('/api', apiRoutes);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 DupMe Backend API",
    version: "1.0.0",
    endpoints: {
      api: "/api",
      health: "/api/health",
    },
    timestamp: new Date().toISOString(),
  });
});

const serverManager = new ServerManager({
	cleanupInterval: '*/2 * * * *', // Every 2 minutes for more frequent cleanup
	maxInactiveTime: 60, // 60 minutes before inactive rooms are deleted
	maxRooms: 500, // Maximum 500 concurrent rooms
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
      origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});
io.use(sharedSession(expressSession, { autoSave: true }) as unknown as (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => void); 
new SocketIOService(io, serverManager);

// Initialize the server to listen to a port
const PORT = process.env.PORT;
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Server will not start.');
      process.exit(1);
    }

    // Initialize database schema
    await initializeDatabase();

    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API available at: http://localhost:${PORT}/api`);
      // console.log(`📚 Documentation: http://localhost:${PORT}/docs`);
      console.log(`🏠 Root endpoint: http://localhost:${PORT}/`);
      console.log(`🗄️ Database connected and initialized`);
      console.log(`🔌 Socket.IO enabled for real-time communication`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};
startServer();

// Graceful shutdown
process.on('SIGINT', () => {
	console.log('\n🛑 Shutting down server...');
	serverManager.shutdown();
	server.close(() => {
		console.log('✅ Server shutdown complete');
		process.exit(0);
	});
});

process.on('SIGTERM', () => {
	console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
	serverManager.shutdown();
	server.close(() => {
		console.log('✅ Server shutdown complete');
		process.exit(0);
	});
});
