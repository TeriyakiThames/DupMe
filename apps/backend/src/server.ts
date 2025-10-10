// ChatGPT generated test, delete after too!
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (_, res) => {
	res.send("Hello from Express + Socket.IO backend!");
});

io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);
	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
	});
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
