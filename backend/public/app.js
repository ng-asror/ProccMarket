// app.js - Complete frontend application logic

const API_BASE_URL = window.location.origin + '/api/v1';
const SOCKET_URL = 'http://127.0.0.1:3001'; // Socket.io server URL

let state = {
    token: null,
    user: null,
    conversations: [],
    currentConversation: null,
    notifications: [],
    socket: null,
    wsConnected: false,
    reasonCallback: null,
    joinedConversations: new Set()
};

// =====================================
// Utility Functions
// =====================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAxiosConfig() {
    return state.token ? { headers: { 'Authorization': `Bearer ${state.token}` } } : {};
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function handleKeyPress(event) {
    if (event.key === 'Enter') sendMessage();
}

function updateWSStatus(connected) {
    state.wsConnected = connected;
    const statusEl = document.getElementById('ws-status');
    if (statusEl) {
        statusEl.className = `ws-status ${connected ? 'connected' : 'disconnected'}`;
    }
}

// =====================================
// Authentication
// =====================================

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showNotification('Please enter email and password', 'error');
        return;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
        const { token, user } = response.data;

        state.token = token;
        state.user = user;

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        document.getElementById('user-name').textContent = user.name || user.email;
        document.getElementById('user-balance').textContent = user.balance || 0;
        document.getElementById('user-avatar').textContent = (user.name || user.email).charAt(0).toUpperCase();

        showNotification('Logged in successfully! 🎉');
        
        // Initialize everything
        initializeWebSocket();
        await loadConversations();
        await loadNotifications();
        await updateNotificationCount();
    } catch (error) {
        showNotification(error.response?.data?.message || 'Login failed', 'error');
    }
}

function logout() {
    if (state.socket) {
        try { 
            state.socket.disconnect(); 
        } catch(e) {}
    }
    
    state = { 
        token: null, 
        user: null, 
        conversations: [], 
        currentConversation: null,
        notifications: [],
        socket: null, 
        wsConnected: false, 
        reasonCallback: null,
        joinedConversations: new Set()
    };
    
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    
    showNotification('Logged out successfully');
}

// =====================================
// WebSocket with Socket.io
// =====================================

function initializeWebSocket() {
    console.log('🔌 Connecting to Socket.io server...');
    
    try {
        state.socket = io(SOCKET_URL, {
            auth: {
                token: state.token
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        // Connection events
        state.socket.on('connect', () => {
            console.log('✅ Socket.io connected!', state.socket.id);
            updateWSStatus(true);
            showNotification('Real-time updates enabled! 🔔', 'success');
            
            // Rejoin conversations if any
            if (state.joinedConversations.size > 0) {
                const conversationIds = Array.from(state.joinedConversations);
                state.socket.emit('join-conversations', conversationIds);
                console.log('🔄 Rejoined conversations:', conversationIds);
            }
        });

        state.socket.on('disconnect', (reason) => {
            console.log('⚠️ Socket.io disconnected:', reason);
            updateWSStatus(false);
            if (reason === 'io server disconnect') {
                state.socket.connect();
            }
        });

        state.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
            updateWSStatus(false);
            showNotification('Connection error - retrying...', 'warning');
        });

        state.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            showNotification(error.message || 'Socket error', 'error');
        });

        state.socket.on('reconnect', (attemptNumber) => {
            console.log(`✅ Reconnected after ${attemptNumber} attempt(s)`);
            showNotification('Reconnected! 🎉', 'success');
        });

        // Listen for message events
        state.socket.on('message.sent', (data) => {
            console.log('📨 New message received:', data);
            handleNewMessage(data);
        });

        // Listen for notification events
        state.socket.on('notification.sent', (data) => {
            console.log('🔔 New notification received:', data);
            handleNewNotification(data);
        });

        // Listen for typing indicators
        state.socket.on('user-typing', (data) => {
            console.log('⌨️ User typing:', data);
            // You can show typing indicator here
        });

        state.socket.on('user-stopped-typing', (data) => {
            console.log('⌨️ User stopped typing:', data);
            // Hide typing indicator
        });

    } catch (error) {
        console.error('❌ WebSocket initialization error:', error);
        state.socket = null;
        updateWSStatus(false);
        showNotification('Using manual refresh mode', 'warning');
    }
}

function subscribeToConversation(conversationId) {
    if (!state.socket || !state.wsConnected) {
        console.log('⚠️ Socket.io not available, skipping subscription');
        return;
    }

    try {
        console.log(`📡 Joining conversation room: ${conversationId}`);
        state.socket.emit('join-conversations', [conversationId]);
        state.joinedConversations.add(conversationId);
        console.log('✅ Successfully joined conversation room');
    } catch (error) {
        console.error('❌ Failed to join conversation:', error);
    }
}

function unsubscribeFromConversation(conversationId) {
    if (!state.socket) return;
    
    try {
        console.log(`📡 Leaving conversation room: ${conversationId}`);
        state.socket.emit('leave-conversation', conversationId);
        state.joinedConversations.delete(conversationId);
    } catch (error) {
        console.error('❌ Failed to leave conversation:', error);
    }
}

// =====================================
// Event Handlers
// =====================================

function handleNewMessage(event) {
    console.log('📥 Processing new message:', event);
    
    const message = event.message || event;
    const conversationId = event.conversation_id || message.conversation_id;
    
    // Update current conversation if it matches
    if (state.currentConversation?.id === conversationId) {
        appendMessage(message);
    }
    
    // Refresh conversations list to update unread counts
    if (!state.conversationsRefreshTimeout) {
        state.conversationsRefreshTimeout = setTimeout(() => {
            loadConversations();
            state.conversationsRefreshTimeout = null;
        }, 1000);
    }
    
    // Show notification if message is not from current user
    if (message.user_id !== state.user.id) {
        showNotification('💬 New message received!', 'info');
    }
}

function handleNewNotification(event) {
    console.log('🔔 Processing new notification:', event);
    
    const notification = event.notification || event;
    
    // Add to notifications list
    state.notifications.unshift(notification);
    
    // Update notification count
    updateNotificationCount();
    
    // Show toast notification
    showNotification(`${notification.title}: ${notification.message}`, 'info');
    
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
            body: notification.message,
            icon: '/notification-icon.png',
            badge: '/badge-icon.png'
        });
    }
    
    // Refresh notifications panel if open
    const panel = document.getElementById('notification-panel');
    if (panel.classList.contains('active')) {
        renderNotifications();
    }
    
    // Handle notification actions based on type
    handleNotificationAction(notification);
}

function handleNotificationAction(notification) {
    const data = notification.data || {};
    
    switch (notification.type) {
        case 'new_message':
            // Refresh conversation list to show new message
            loadConversations();
            break;
            
        case 'new_conversation':
            // Reload conversations
            loadConversations();
            break;
            
        case 'order_created':
        case 'order_accepted':
        case 'order_delivered':
        case 'order_completed':
        case 'order_cancelled':
        case 'order_cancellation_requested':
        case 'order_revision_requested':
        case 'order_disputed':
            // Refresh orders if we're viewing that conversation
            if (state.currentConversation?.id === data.conversation_id) {
                loadOrders();
            }
            // Refresh conversations to show order update
            loadConversations();
            break;
    }
}

function appendMessage(msg) {
    const container = document.getElementById('messages-container');
    
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Check if message already exists to prevent duplicates
    const existingMessage = container.querySelector(`[data-message-id="${msg.id}"]`);
    if (existingMessage) {
        console.log('Message already exists, skipping');
        return;
    }
    
    const isSent = msg.user_id === state.user.id;
    const initial = (msg.user?.name || msg.user?.email || '?').charAt(0).toUpperCase();
    
    const messageHTML = `
        <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${msg.id}">
            <div class="message-avatar">${initial}</div>
            <div class="message-content">
                <div class="message-bubble">
                    ${msg.content || '[File message]'}
                </div>
                <div class="message-time">${formatTime(msg.created_at || new Date().toISOString())}</div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', messageHTML);
    container.scrollTop = container.scrollHeight;
}

// =====================================
// Notifications
// =====================================

async function loadNotifications() {
    try {
        const response = await axios.get(`${API_BASE_URL}/chat/notifications`, getAxiosConfig());
        state.notifications = response.data.data || [];
        renderNotifications();
        await updateNotificationCount();
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

async function updateNotificationCount() {
    try {
        const response = await axios.get(`${API_BASE_URL}/chat/notifications/unread-count`, getAxiosConfig());
        const count = response.data.unread_count || 0;
        
        const badge = document.getElementById('notification-count');
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to update notification count:', error);
    }
}

function renderNotifications() {
    const container = document.getElementById('notifications-list');
    
    if (state.notifications.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding: 40px 20px;"><p>No notifications</p></div>';
        return;
    }
    
    container.innerHTML = state.notifications.map(notif => `
        <div class="notification-item ${notif.is_read ? '' : 'unread'}" 
             onclick="handleNotificationClick(${notif.id}, '${notif.type}', ${JSON.stringify(notif.data).replace(/"/g, '&quot;')})">
            <div class="notification-title">${notif.title}</div>
            <div class="notification-message">${notif.message}</div>
            <div class="notification-time">${notif.time_ago || formatTime(notif.created_at)}</div>
        </div>
    `).join('');
}

async function handleNotificationClick(notificationId, type, data) {
    try {
        // Mark as read
        await axios.post(`${API_BASE_URL}/chat/notifications/${notificationId}/read`, {}, getAxiosConfig());
        
        // Update UI
        await loadNotifications();
        await updateNotificationCount();
        
        // Navigate based on notification type
        if (data.conversation_id) {
            // Close notification panel
            document.getElementById('notification-panel').classList.remove('active');
            
            // Open conversation
            await selectConversation(data.conversation_id);
        }
    } catch (error) {
        console.error('Failed to handle notification click:', error);
    }
}

async function markAllNotificationsRead() {
    try {
        await axios.post(`${API_BASE_URL}/chat/notifications/mark-all-read`, {}, getAxiosConfig());
        await loadNotifications();
        await updateNotificationCount();
        showNotification('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Failed to mark all as read:', error);
        showNotification('Failed to mark all as read', 'error');
    }
}

function toggleNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    panel.classList.toggle('active');
    
    // Load notifications if opening
    if (panel.classList.contains('active')) {
        loadNotifications();
    }
}

// Close notification panel when clicking outside
document.addEventListener('click', (e) => {
    const panel = document.getElementById('notification-panel');
    const bell = document.querySelector('.notification-bell');
    
    if (panel && bell && !panel.contains(e.target) && !bell.contains(e.target)) {
        panel.classList.remove('active');
    }
});

// =====================================
// Conversations
// =====================================

async function loadConversations() {
    try {
        const response = await axios.get(`${API_BASE_URL}/chat/conversations`, getAxiosConfig());
        state.conversations = response.data.data || [];
        renderConversations();
    } catch (error) {
        console.error('Failed to load conversations:', error);
    }
}

function renderConversations() {
    const container = document.getElementById('conversations-list');

    if (state.conversations.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No conversations yet<br>Click "+ New" to start</p></div>';
        return;
    }

    container.innerHTML = state.conversations.map(conv => {
        const otherUser = conv.other_participant;
        const initial = (otherUser.name || otherUser.email).charAt(0).toUpperCase();
        const isActive = state.currentConversation?.id === conv.id;
        const unreadCount = conv.unread_count || 0;

        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" onclick="selectConversation(${conv.id})">
                <div class="conversation-avatar">${initial}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${otherUser.name || otherUser.email}</div>
                    <div class="conversation-preview">
                        ${conv.last_message?.content || 'No messages yet'}
                    </div>
                </div>
                ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
            </div>
        `;
    }).join('');
}

async function selectConversation(conversationId) {
    try {
        // Unsubscribe from previous conversation
        if (state.currentConversation) {
            unsubscribeFromConversation(state.currentConversation.id);
        }

        const response = await axios.get(`${API_BASE_URL}/chat/conversations/${conversationId}`, getAxiosConfig());

        state.currentConversation = response.data.conversation;
        const messages = response.data.messages || [];

        document.getElementById('chat-header').style.display = 'block';
        document.getElementById('message-input-area').style.display = 'block';
        document.getElementById('create-order-btn').style.display = 'block';

        const otherUser = state.currentConversation.other_participant;
        document.getElementById('chat-name').textContent = otherUser.name || otherUser.email;
        document.getElementById('chat-info').textContent = otherUser.email;

        renderConversations();
        renderMessages(messages);
        subscribeToConversation(conversationId);
        loadOrders();
    } catch (error) {
        console.error('Failed to load conversation:', error);
        showNotification('Failed to load conversation', 'error');
    }
}

function refreshConversation() {
    if (state.currentConversation) {
        selectConversation(state.currentConversation.id);
        showNotification('Refreshed!', 'info');
    }
}

async function showNewChatModal() {
    document.getElementById('new-chat-modal').classList.add('active');
}

async function createConversation() {
    const otherUserId = document.getElementById('new-chat-user-id')?.value;

    if (!otherUserId) {
        showNotification('Please enter a user ID', 'error');
        return;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/chat/conversations`,
            { user_id: parseInt(otherUserId) },
            getAxiosConfig()
        );

        closeModal('new-chat-modal');
        showNotification('Conversation created! 🎉');
        loadConversations();
        selectConversation(response.data.data.id);
    } catch (error) {
        showNotification(error.response?.data?.message || 'Failed to create conversation', 'error');
    }
}

// =====================================
// Messages
// =====================================

function renderMessages(messages) {
    console.log('Rendering messages:', messages);
    const container = document.getElementById('messages-container');

    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No messages yet<br>Start the conversation!</p></div>';
        return;
    }


    container.innerHTML = messages.map(msg => {
        const isSent = msg.user_id === state.user.id;
        const initial = (msg.user.name || msg.user.email).charAt(0).toUpperCase();

        return `
            <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${msg.id}">
                <div class="message-avatar">${initial}</div>
                <div class="message-content">
                    <div class="message-bubble">
                        ${msg.content || '[File message]'}
                    </div>
                    <div class="message-time">${formatTime(msg.created_at)}</div>
                </div>
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();

    if (!content || !state.currentConversation) return;

    try {
        await axios.post(
            `${API_BASE_URL}/chat/conversations/${state.currentConversation.id}/messages`,
            { content },
            getAxiosConfig()
        );

        input.value = '';
    } catch (error) {
        showNotification('Failed to send message', 'error');
    }
}

// =====================================
// Orders
// =====================================

async function loadOrders() {
    if (!state.currentConversation) return;

    try {
        const response = await axios.get(
            `${API_BASE_URL}/chat/conversations/${state.currentConversation.id}/orders`,
            getAxiosConfig()
        );

        renderOrders(response.data.data || []);
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

function renderOrders(orders) {
    const container = document.getElementById('orders-list');

    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding: 40px 20px;"><p>No orders yet<br>Create one to get started!</p></div>';
        return;
    }

    container.innerHTML = orders.map(order => {
        let roleInfo = '';
        if (order.is_client) {
            roleInfo = '<span class="role-badge client">Client</span>';
        } else if (order.is_freelancer) {
            roleInfo = '<span class="role-badge freelancer">Freelancer</span>';
        }

        let revisionBadge = '';
        if (order.has_revisions && order.revision_count > 0) {
            revisionBadge = `<span class="revision-badge">🔄 ${order.revision_count}x revised</span>`;
        }

        let cancellationNotice = '';
        if (order.waiting_for_my_approval) {
            cancellationNotice = `
                <div class="cancellation-notice">
                    ⚠️ <strong>Cancellation Request</strong><br>
                    Other party wants to cancel this order.
                    ${order.cancellation_reason ? `<br>Reason: ${order.cancellation_reason}` : ''}
                </div>
            `;
        } else if (order.i_requested_cancellation) {
            cancellationNotice = `
                <div class="cancellation-notice">
                    ⏳ <strong>Waiting for Approval</strong><br>
                    Your cancellation request is pending approval.
                    ${order.cancellation_reason ? `<br>Reason: ${order.cancellation_reason}` : ''}
                </div>
            `;
        }

        let revisionNotice = '';
        if (order.revision_reason && order.status === 'in_progress') {
            revisionNotice = `
                <div class="revision-notice">
                    🔄 <strong>Revision Requested</strong><br>
                    ${order.revision_reason}
                    ${order.revision_requested_at ? `<br><small>Requested: ${formatTime(order.revision_requested_at)}</small>` : ''}
                </div>
            `;
        }

        return `
            <div class="order-card">
                <span class="order-status ${order.status}">${order.status.replace(/_/g, ' ')}</span>
                ${roleInfo}
                ${revisionBadge}
                <div class="order-title">${order.title}</div>
                <div class="order-amount">$${parseFloat(order.amount).toFixed(2)}</div>
                <div class="order-description">${order.description}</div>
                ${order.deadline ? `<div class="order-meta"><strong>Deadline:</strong> ${new Date(order.deadline).toLocaleDateString()}</div>` : ''}
                ${revisionNotice}
                ${cancellationNotice}
                <div class="order-actions">
                    ${order.can_accept ? `<button class="btn-success" onclick="acceptOrder(${order.id})">✓ Accept Order</button>` : ''}
                    ${order.can_deliver ? `<button class="btn-primary" onclick="deliverOrder(${order.id})">📦 Mark Delivered</button>` : ''}
                    ${order.can_request_revision ? `<button class="btn-warning" onclick="requestRevision(${order.id})">🔄 Request Changes</button>` : ''}
                    ${order.can_complete ? `<button class="btn-success" onclick="completeOrder(${order.id})">✓ Complete & Pay</button>` : ''}
                    ${order.can_cancel ? `<button class="btn-danger" onclick="cancelOrder(${order.id})">✗ Cancel</button>` : ''}
                    ${order.can_request_cancellation ? `<button class="btn-warning" onclick="requestCancellation(${order.id})">🚫 Request Cancellation</button>` : ''}
                    ${order.can_approve_cancellation ? `<button class="btn-success" onclick="approveCancellation(${order.id})">✓ Approve Cancellation</button>` : ''}
                    ${order.can_reject_cancellation ? `<button class="btn-danger" onclick="rejectCancellation(${order.id})">✗ Reject Cancellation</button>` : ''}
                    ${order.can_dispute ? `<button class="btn-danger" onclick="disputeOrder(${order.id})">⚠ Open Dispute</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function showCreateOrderModal() {
    if (!state.currentConversation) {
        showNotification('Please select a conversation first', 'error');
        return;
    }
    document.getElementById('create-order-modal').classList.add('active');
}

async function createOrder() {
    const title = document.getElementById('order-title').value.trim();
    const description = document.getElementById('order-description').value.trim();
    const amount = document.getElementById('order-amount').value;
    const deadline = document.getElementById('order-deadline').value;
    const isClientOrder = document.getElementById('order-type').value === 'true';

    if (!title || !description || !amount) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    try {
        const data = {
            conversation_id: state.currentConversation.id,
            title,
            description,
            amount: parseFloat(amount),
            is_client_order: isClientOrder
        };

        if (deadline) data.deadline = deadline;

        await axios.post(
            `${API_BASE_URL}/chat/conversations/${state.currentConversation.id}/orders`,
            data,
            getAxiosConfig()
        );

        closeModal('create-order-modal');
        showNotification('Order created successfully! 🎉');

        document.getElementById('order-title').value = '';
        document.getElementById('order-description').value = '';
        document.getElementById('order-amount').value = '';
        document.getElementById('order-deadline').value = '';

        loadOrders();
        selectConversation(state.currentConversation.id);
    } catch (error) {
        showNotification(error.response?.data?.message || 'Failed to create order', 'error');
    }
}

async function acceptOrder(orderId) {
    try {
        await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/accept`, {}, getAxiosConfig());
        showNotification('Order accepted! Funds escrowed. 💰');
        loadOrders();
        selectConversation(state.currentConversation.id);
        
        const response = await axios.get(`${API_BASE_URL}/auth/me`, getAxiosConfig());
        if (response.data.user) {
            document.getElementById('user-balance').textContent = response.data.user.balance || 0;
        }
    } catch (error) {
        showNotification(error.response?.data?.message || 'Failed to accept order', 'error');
    }
}

async function deliverOrder(orderId) {
    try {
        await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/deliver`, {}, getAxiosConfig());
        showNotification('Work marked as delivered! ✅');
        loadOrders();
    } catch (error) {
        showNotification(error.response?.data?.message || 'Failed', 'error');
    }
}

async function completeOrder(orderId) {
    if (!confirm('This will release payment to the freelancer. Continue?')) return;

    try {
        await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/complete`, {}, getAxiosConfig());
        showNotification('Order completed! Payment released. 💸');
        loadOrders();
        
        const response = await axios.get(`${API_BASE_URL}/auth/me`, getAxiosConfig());
        if (response.data.user) {
            document.getElementById('user-balance').textContent = response.data.user.balance || 0;
        }
    } catch (error) {
        showNotification(error.response?.data?.message || 'Failed', 'error');
    }
}

async function cancelOrder(orderId) {
    showReasonModal(
        'Cancel Order',
        'Enter cancellation reason (optional):',
        async (reason) => {
            try {
                await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/cancel`, 
                    reason ? { reason } : {}, 
                    getAxiosConfig()
                );
                showNotification('Order cancelled. ❌');
                loadOrders();
            } catch (error) {
                showNotification(error.response?.data?.message || 'Failed', 'error');
            }
        }
    );
}

async function requestCancellation(orderId) {
    showReasonModal(
        'Request Cancellation',
        'Why do you want to cancel? (optional):',
        async (reason) => {
            try {
                await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/request-cancellation`, 
                    reason ? { reason } : {}, 
                    getAxiosConfig()
                );
                showNotification('Cancellation request sent. Waiting for approval... ⏳', 'info');
                loadOrders();
            } catch (error) {
                showNotification(error.response?.data?.message || 'Failed', 'error');
            }
        }
    );
}

async function requestRevision(orderId) {
    showReasonModal(
        '🔄 Request Revision',
        'What needs to be changed? (minimum 10 characters):',
        async (reason) => {
            if (!reason || reason.length < 10) {
                showNotification('Reason must be at least 10 characters', 'error');
                return;
            }

            try {
                await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/request-revision`, 
                    { reason }, 
                    getAxiosConfig()
                );
                showNotification('Work sent back for revision! 🔄', 'info');
                loadOrders();
            } catch (error) {
                showNotification(error.response?.data?.message || 'Failed', 'error');
            }
        }
    );
}

async function approveCancellation(orderId) {
    if (!confirm('Are you sure you want to approve this cancellation? Funds will be refunded.')) return;

    try {
        await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/approve-cancellation`, {}, getAxiosConfig());
        showNotification('Cancellation approved. Funds refunded. 🔄');
        loadOrders();
        
        const response = await axios.get(`${API_BASE_URL}/auth/me`, getAxiosConfig());
        if (response.data.user) {
            document.getElementById('user-balance').textContent = response.data.user.balance || 0;
        }
    } catch (error) {
        showNotification(error.response?.data?.message || 'Failed', 'error');
    }
}

async function rejectCancellation(orderId) {
    if (!confirm('Are you sure you want to reject this cancellation request?')) return;

    try {
        await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/reject-cancellation`, {}, getAxiosConfig());
        showNotification('Cancellation request rejected. Order continues. ▶️', 'info');
        loadOrders();
    } catch (error) {
        showNotification(error.response?.data?.message || 'Failed', 'error');
    }
}

async function disputeOrder(orderId) {
    showReasonModal(
        'Open Dispute',
        'Describe the issue (minimum 10 characters):',
        async (reason) => {
            if (!reason || reason.length < 10) {
                showNotification('Dispute reason must be at least 10 characters', 'error');
                return;
            }

            try {
                await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/dispute`, { reason }, getAxiosConfig());
                showNotification('Dispute opened. Admin will review. ⚠️', 'warning');
                loadOrders();
            } catch (error) {
                showNotification(error.response?.data?.message || 'Failed', 'error');
            }
        }
    );
}

// =====================================
// Reason Modal Helper
// =====================================

function showReasonModal(title, label, callback) {
    document.getElementById('reason-modal-title').textContent = title;
    document.getElementById('reason-modal-label').textContent = label;
    document.getElementById('reason-modal-input').value = '';
    state.reasonCallback = callback;
    document.getElementById('reason-modal').classList.add('active');
}

function submitReason() {
    const reason = document.getElementById('reason-modal-input').value.trim();
    if (state.reasonCallback) {
        state.reasonCallback(reason);
        state.reasonCallback = null;
    }
    closeModal('reason-modal');
}

// =====================================
// Request Browser Notification Permission
// =====================================

if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('✅ Browser notifications enabled');
        }
    });
}

// =====================================
// Initialize
// =====================================

console.log('💬 ProccMarket Chat Ready! (Socket.io Version)');
console.log('🔌 Socket.io server URL:', SOCKET_URL);
console.log('🔔 Notification system enabled');
console.log('✨ Real-time updates via Socket.io');