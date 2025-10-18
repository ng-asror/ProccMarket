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
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
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
    console.log(`User connected: ${socket.user.email} (ID: ${socket.user.id})`);

    // Join user's personal room
    socket.join(`user.${socket.user.id}`);

    // Join user's conversations
    socket.on('join-conversations', async (conversationIds) => {
        if (!Array.isArray(conversationIds)) {
            return socket.emit('error', { message: 'Invalid conversation IDs' });
        }

        for (const conversationId of conversationIds) {
            try {
                // Verify user has access to this conversation
                const hasAccess = await verifyConversationAccess(socket.user.id, conversationId, socket.handshake.auth.token);
                
                if (hasAccess) {
                    socket.join(`conversation.${conversationId}`);
                    console.log(`User ${socket.user.id} joined conversation ${conversationId}`);
                }
            } catch (error) {
                console.error(`Error joining conversation ${conversationId}:`, error.message);
            }
        }
    });

    // Leave conversation
    socket.on('leave-conversation', (conversationId) => {
        socket.leave(`conversation.${conversationId}`);
        console.log(`User ${socket.user.id} left conversation ${conversationId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.name} (ID: ${socket.user.id})`);
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
  if (err) console.error('Redis psubscribe error:', err);
  else console.log(`✅ Pattern subscribed to ${count} channels`);
});

redis.on('pmessage', (pattern, channel, message) => {
  try {
    console.log(`📡 Redis pattern: ${pattern}`);
    console.log(`📨 Redis channel: ${channel}`);
    console.log(`📦 Redis raw message: ${message}`);

    const data = JSON.parse(message);
    const event = data.event;
    const payload = data.data;

    console.log(`Received event: ${event} on channel: ${channel}`);

    // Parse channel name, e.g. laravel_database_private-conversation.1
    const cleanChannel = channel.replace('laravel_database_private-', '');
    const [channelType, channelId] = cleanChannel.split('.');
    const roomName = `${channelType}.${channelId}`;

    // Emit event to the right Socket.io room
    io.to(roomName).emit(event, payload);

    console.log(`🚀 Emitted "${event}" to room "${roomName}"`);
  } catch (error) {
    console.error('❌ Error processing Redis message:', error.message);
  }
});


// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});