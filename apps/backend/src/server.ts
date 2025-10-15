import express from "express";
import http from "http";
import { Server } from "socket.io";
import { RoomManager } from "./services/roomService";
import { SocketService } from "./services/socketService";
import { initializeRoomRoutes } from "./routes/rooms";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger.json";
import session from "express-session";
import dotenv from "dotenv";
import { testConnection, initializeDatabase } from "./config/database";
import apiRoutes from "./routes";
import gameRoutes from "./routes/game";

// Initialize room manager with custom options
const roomManager = new RoomManager({
	cleanupInterval: '*/2 * * * *', // Every 2 minutes for more frequent cleanup
	maxInactiveTime: 60, // 60 minutes before inactive rooms are deleted
	maxRooms: 500, // Maximum 500 concurrent rooms
});

// load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize socket service
new SocketService(io, roomManager);

// middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// cors middleware 
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3001", // alternative frontend port
  ];
  
  if (allowedOrigins.includes(origin as string)) {
    res.setHeader('Access-Control-Allow-Origin', origin as string);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-session-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true, // prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
  name: 'dupme.sid', // custom session name
}));

// API routes
app.use('/api', apiRoutes);
app.use('/api/game', gameRoutes);

// Room routes
app.use('/', initializeRoomRoutes(roomManager));

// Swagger documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 DupMe Backend API",
    version: "1.0.0",
    endpoints: {
      api: "/api",
      health: "/api/health",
      docs: "/docs",
      rooms: "/rooms"
    },
    timestamp: new Date().toISOString(),
  });
});

// Server startup and configuration
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Server will not start.');
      process.exit(1);
    }

    // initialize database schema
    await initializeDatabase();

    // start the server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API available at: http://localhost:${PORT}/api`);
      console.log(`📚 Documentation: http://localhost:${PORT}/docs`);
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
	roomManager.shutdown();
	server.close(() => {
		console.log('✅ Server shutdown complete');
		process.exit(0);
	});
});

process.on('SIGTERM', () => {
	console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
	roomManager.shutdown();
	server.close(() => {
		console.log('✅ Server shutdown complete');
		process.exit(0);
	});
});
