const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = new Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "https://proccmarket.com",
            "https://www.proccmarket.com",
            "http://proccmarket.com",
            /\.proccmarket\.com$/
        ],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Authorization", "Content-Type"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    path: '/socket.io/'
});

// Redis subscriber
const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
});

// Laravel API base URL
const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000';

// Middleware: Authenticate socket connection
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error('Authentication token required'));
        }

        // Verify token with Laravel backend
        const response = await axios.get(`${LARAVEL_API_URL}/api/v1/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.data && response.data.success) {
            socket.user = response.data.user;
            next();
        } else {
            next(new Error('Invalid token'));
        }
    } catch (error) {
        console.error('Authentication error:', error.message);
        next(new Error('Authentication failed'));
    }
});

// Handle socket connections
io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (ID: ${socket.user.id})`);

    // Join user's personal room (for notifications)
    const userRoom = `user.${socket.user.id}`;
    socket.join(userRoom);
    console.log(`👤 User ${socket.user.id} joined personal room: ${userRoom}`);

    // Send connection confirmation
    socket.emit('connected', {
        message: 'Successfully connected to Socket.io server',
        userId: socket.user.id,
        rooms: Array.from(socket.rooms)
    });

    // Join user's conversations
    socket.on('join-conversations', async (conversationIds) => {
        if (!Array.isArray(conversationIds)) {
            return socket.emit('error', { message: 'Invalid conversation IDs' });
        }

        const joinedConversations = [];
        const failedConversations = [];

        for (const conversationId of conversationIds) {
            try {
                // Verify user has access to this conversation
                const hasAccess = await verifyConversationAccess(
                    socket.user.id, 
                    conversationId, 
                    socket.handshake.auth.token
                );
                
                if (hasAccess) {
                    const roomName = `conversation.${conversationId}`;
                    socket.join(roomName);
                    joinedConversations.push(conversationId);
                    console.log(`💬 User ${socket.user.id} joined conversation ${conversationId}`);
                } else {
                    failedConversations.push({ 
                        conversationId, 
                        reason: 'Access denied' 
                    });
                }
            } catch (error) {
                console.error(`❌ Error joining conversation ${conversationId}:`, error.message);
                failedConversations.push({ 
                    conversationId, 
                    reason: error.message 
                });
            }
        }

        // Send response back to client
        socket.emit('conversations-joined', {
            joined: joinedConversations,
            failed: failedConversations,
            totalRooms: Array.from(socket.rooms)
        });
    });

    // Join single conversation
    socket.on('join-conversation', async (conversationId) => {
        try {
            const hasAccess = await verifyConversationAccess(
                socket.user.id,
                conversationId,
                socket.handshake.auth.token
            );

            if (hasAccess) {
                const roomName = `conversation.${conversationId}`;
                socket.join(roomName);
                console.log(`💬 User ${socket.user.id} joined conversation ${conversationId}`);
                
                socket.emit('conversation-joined', {
                    conversationId,
                    success: true
                });
            } else {
                socket.emit('conversation-join-failed', {
                    conversationId,
                    reason: 'Access denied'
                });
            }
        } catch (error) {
            console.error(`❌ Error joining conversation ${conversationId}:`, error.message);
            socket.emit('conversation-join-failed', {
                conversationId,
                reason: error.message
            });
        }
    });

    // Leave conversation
    socket.on('leave-conversation', (conversationId) => {
        const roomName = `conversation.${conversationId}`;
        socket.leave(roomName);
        console.log(`👋 User ${socket.user.id} left conversation ${conversationId}`);
        
        socket.emit('conversation-left', {
            conversationId,
            success: true
        });
    });

    // Typing indicator
    socket.on('typing-start', (conversationId) => {
        socket.to(`conversation.${conversationId}`).emit('user-typing', {
            userId: socket.user.id,
            userName: socket.user.name,
            conversationId
        });
    });

    socket.on('typing-stop', (conversationId) => {
        socket.to(`conversation.${conversationId}`).emit('user-stopped-typing', {
            userId: socket.user.id,
            conversationId
        });
    });

    // Online status
    socket.on('online', () => {
        socket.broadcast.emit('user-online', {
            userId: socket.user.id,
            userName: socket.user.name
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`👋 User disconnected: ${socket.user.name} (ID: ${socket.user.id})`);
        
        // Broadcast offline status
        socket.broadcast.emit('user-offline', {
            userId: socket.user.id,
            userName: socket.user.name
        });
    });

    // Error handling
    socket.on('error', (error) => {
        console.error(`❌ Socket error for user ${socket.user.id}:`, error);
    });
});

// Verify if user has access to conversation
async function verifyConversationAccess(userId, conversationId, token) {
    try {
        const response = await axios.get(
            `${LARAVEL_API_URL}/api/v1/chat/conversations/${conversationId}/verify-access`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );
        return response.data.hasAccess === true;
    } catch (error) {
        console.error('Access verification error:', error.message);
        return false;
    }
}

// Listen to Redis for Laravel broadcasts
redis.psubscribe('laravel_database_*', (err, count) => {
    if (err) {
        console.error('❌ Redis psubscribe error:', err);
    } else {
        console.log(`✅ Subscribed to ${count} Redis pattern(s)`);
    }
});

redis.on('pmessage', (pattern, channel, message) => {
    try {
        console.log(`\n📡 ===== NEW REDIS MESSAGE =====`);
        console.log(`📨 Channel: ${channel}`);
        console.log(`📦 Message: ${message.substring(0, 200)}...`);

        const data = JSON.parse(message);
        const event = data.event;
        const payload = data.data;

        console.log(`🎯 Event: ${event}`);

        // Parse channel name
        // Examples:
        // - laravel_database_private-user.1 -> user.1
        // - laravel_database_private-conversation.5 -> conversation.5
        let roomName = channel
            .replace('laravel_database_', '')
            .replace('private-', '')
            .replace('presence-', '');

        console.log(`🚪 Target room: ${roomName}`);

        // Get connected clients in this room
        const room = io.sockets.adapter.rooms.get(roomName);
        const clientCount = room ? room.size : 0;
        console.log(`👥 Clients in room: ${clientCount}`);

        if (clientCount > 0) {
            // Emit to the room
            io.to(roomName).emit(event, payload);
            console.log(`✅ Emitted "${event}" to ${clientCount} client(s) in room "${roomName}"`);
        } else {
            console.log(`⚠️  No clients in room "${roomName}" - message not delivered`);
        }

        console.log(`===== END MESSAGE =====\n`);
    } catch (error) {
        console.error('❌ Error processing Redis message:', error.message);
        console.error('Stack:', error.stack);
    }
});

// Redis connection events
redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

redis.on('ready', () => {
    console.log('✅ Redis ready to accept commands');
});

// Health check endpoint
app.get('/health', (req, res) => {
    const rooms = [];
    io.sockets.adapter.rooms.forEach((sockets, room) => {
        // Only show custom rooms (not socket IDs)
        if (!sockets.has(room)) {
            rooms.push({
                room,
                clients: sockets.size
            });
        }
    });

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        connections: io.engine.clientsCount,
        rooms: rooms,
        redis: redis.status
    });
});

// Debug endpoint - list all active rooms
app.get('/debug/rooms', (req, res) => {
    const rooms = [];
    io.sockets.adapter.rooms.forEach((sockets, room) => {
        const socketIds = Array.from(sockets);
        rooms.push({
            room,
            clientCount: sockets.size,
            socketIds: socketIds
        });
    });

    res.json({
        totalRooms: rooms.length,
        rooms: rooms
    });
});

// Debug endpoint - emit test event
app.post('/debug/emit', express.json(), (req, res) => {
    const { room, event, data } = req.body;
    
    if (!room || !event) {
        return res.status(400).json({ error: 'room and event are required' });
    }

    io.to(room).emit(event, data || { test: true });
    
    res.json({
        success: true,
        emitted: { room, event, data }
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        redis.quit();
        process.exit(0);
    });
});

const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
    console.log(`\n🚀 ===================================`);
    console.log(`🚀 Socket.io Server Started`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🚀 Laravel API: ${LARAVEL_API_URL}`);
    console.log(`🚀 Redis: ${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`);
    console.log(`🚀 ===================================\n`);
});