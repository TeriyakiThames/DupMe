import express from "express";
import cors, { CorsOptions} from "cors";
import http from "http";
import session from "express-session";
import {  Server } from "socket.io";
import { ServerManager } from "./managers/serverManager";
import { SocketIOService } from "./io";
import dotenv from "dotenv";
import { testConnection, initializeDatabase } from "./config/database";
import apiRoutes from "./routes";
import { corsMiddleware } from "./middleware/cors";

// Load environment variables
dotenv.config();
const app = express();
// app.use(corsMiddleware);

// Accept single or comma-separated FRONTEND env var
const allowedOrigins = (process.env.FRONTEND || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

console.log("ALLOWED ORIGINS:", allowedOrigins);

const corsOptions : CorsOptions = {
  origin: (origin, callback) => {
    console.log("CORS check origin:", origin);

    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
app.use(cors(corsOptions)); 

const expressSession = session({
  secret: process.env.SESSION_SECRET || 'default-secret',
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
app.use(expressSession);
app.use('/', apiRoutes);

const serverManager = new ServerManager({
	cleanupInterval: '*/2 * * * *', // Every 2 minutes for more frequent cleanup
	maxInactiveTime: 60, // 60 minutes before inactive rooms are deleted
	maxRooms: 500, // Maximum 500 concurrent rooms
});
const server = http.createServer(app);
const io = new Server(server);

// Integrate session with Socket.IO
io.engine.use(expressSession);
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
      console.log(`🏠 Root endpoint: http://localhost:${PORT}/`);
      console.log(`🌐 API available at: http://localhost:${PORT}/api`);

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
