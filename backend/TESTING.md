# Chat & Order Transaction Testing Guide

## 🚀 Quick Start

### 1. Start Laravel Reverb (WebSocket Server)
```bash
php artisan reverb:start
```

Leave this running in a terminal. You should see:
```
Reverb server started on http://localhost:8080
```

### 2. Start Laravel Application
In another terminal:
```bash
php artisan serve
```

### 3. Create Test Users
```bash
php artisan tinker
```

Then run:
```php
User::create([
    'name' => 'Alice Johnson',
    'email' => 'alice@example.com',
    'password' => bcrypt('password'),
    'balance' => 1000.00
]);

User::create([
    'name' => 'Bob Smith',
    'email' => 'bob@example.com',
    'password' => bcrypt('password'),
    'balance' => 1000.00
]);

// Note the user IDs that were created
User::where('email', 'alice@example.com')->first()->id;
User::where('email', 'bob@example.com')->first()->id;
```

### 4. Open Chat Interface in Two Windows

**Window 1 (Alice):**
- Open: http://localhost:8000/chat.html
- Login: `alice@example.com` / `password`

**Window 2 (Bob):**
- Open: http://localhost:8000/chat.html in a different browser or incognito mode
- Login: `bob@example.com` / `password`

## 📝 Testing Scenarios

### A. Create Conversation & Send Messages

**In Alice's window:**
1. Click "+ New" button
2. Enter Bob's user ID (e.g., `2`)
3. Click "Start Chat"
4. Type "Hello Bob!" and press Enter

**In Bob's window:**
5. You should see the conversation appear automatically
6. Click on Alice's conversation
7. See the message "Hello Bob!" (real-time with WebSocket!)
8. Reply: "Hi Alice, how are you?"

**In Alice's window:**
9. Message appears automatically - no refresh needed!

### B. Create Order Transaction (Escrow System)

**In Alice's window (Client/Creator):**
1. Select Bob's conversation
2. Click "+ Create Order"
3. Fill in:
   - Title: "Build Landing Page"
   - Description: "Need a responsive landing page with contact form"
   - Amount: 500
   - Deadline: (optional)
4. Click "Create Order"
5. Notice: Order appears in right panel with status "PENDING"
6. Also appears as a message in chat

**In Bob's window (Freelancer/Executor):**
7. Refresh or check - see the order in right panel
8. Click "✓ Accept Order"
9. ✅ **Money deducted from Alice's balance and held in escrow**
10. Status changes to "ACCEPTED"

**In Bob's window:**
11. Click "📦 Mark Delivered"
12. Status changes to "DELIVERED"

**In Alice's window:**
13. Click "✓ Complete & Pay"
14. ✅ **Money released from escrow to Bob's balance**
15. Status changes to "RELEASED"
16. Check balance in header - Alice: $500, Bob: $1500

### C. Order Cancellation (Refund)

**Create another order:**
1. Alice creates order for $200
2. Bob accepts (money escrowed)
3. Bob clicks "✗ Cancel"
4. Enters reason: "Cannot complete in time"
5. ✅ **Money refunded to Alice automatically**
6. Status: "REFUNDED"

### D. Raise Dispute

**Create another order:**
1. Alice creates order for $300
2. Bob accepts and delivers
3. Alice is not satisfied
4. Alice clicks "⚠ Dispute"
5. Enters reason: "Delivered work doesn't match requirements"
6. Status: "DISPUTE"
7. Admin can now resolve via admin panel

## 🎯 Features to Test

### Chat System
- ✅ Create conversations
- ✅ Send text messages
- ✅ Real-time message delivery (WebSocket)
- ✅ Message history
- ✅ Unread message marking
- ✅ Auto-scroll to latest
- ✅ Manual refresh option

### Order Transaction System
- ✅ Create order (appears as message)
- ✅ Accept order (escrow funds)
- ✅ Deliver work
- ✅ Complete & release payment
- ✅ Cancel with refund
- ✅ Raise dispute
- ✅ Balance tracking
- ✅ Transaction status flow
- ✅ Permission-based actions

### Admin Panel (Web Interface)
Navigate to admin panel to review all transactions:
```
http://localhost:8000/order-transactions
```

Features:
- View all order transactions
- Filter by status
- Search by title/user
- View disputes
- Resolve disputes (refund or release)
- Force cancel transactions

## 🔧 Troubleshooting

### WebSocket Not Working?
- Make sure Reverb is running: `php artisan reverb:start`
- Check browser console for connection errors
- WebSocket connects to: `ws://localhost:8080`
- If fails, app still works with manual refresh (↻ button)

### "Failed to create conversation"?
- Make sure you're using the correct user ID
- Users must exist in database
- Check that both users are logged in

### Balance not updating?
- Click refresh or reload page
- Check database: `User::find(1)->balance`
- Make sure transaction completed successfully

### Orders not showing?
- Select a conversation first
- Click refresh button
- Check browser console for errors

## 📊 Database Check

You can verify everything in database:
```bash
php artisan tinker
```

```php
// Check users
User::all();

// Check conversations
Conversation::with('userOne', 'userTwo')->get();

// Check messages
Message::with('user')->latest()->get();

// Check orders
OrderTransaction::with('creator', 'executor')->get();

// Check a user's balance
User::find(1)->balance;
```

## 🎨 UI Features

- Gradient header with user info
- Conversation list with avatars
- Message bubbles (WhatsApp style)
- Order cards with status badges
- Real-time notifications
- Smooth animations
- Responsive design

## ⚡ Performance

- Automatic WebSocket reconnection
- Efficient message rendering
- Lazy loading of conversations
- Cached user data
- Optimized API calls

## 🔐 Security

- Sanctum token authentication
- Authorization checks on all endpoints
- Escrow system with database transactions
- Admin-only dispute resolution
- CSRF protection

---

## Need Help?

Check the browser console (F12) for detailed error messages and WebSocket status.

Happy testing! 🎉
