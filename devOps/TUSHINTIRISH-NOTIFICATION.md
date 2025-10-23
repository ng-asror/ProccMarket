# 🔔 Bildirishnomalar API Hujjatlari

## Umumiy Ma'lumot

Ushbu hujjat Bildirishnomalar API va WebSocket integratsiyasi uchun to'liq qo'llanma hisoblanadi. Tizim xabarlar, suhbatlar va buyurtma yangilanishlari uchun real vaqt rejimida bildirishnomalarni qo'llab-quvvatlaydi.

---

## 📡 WebSocket Integratsiyasi

### Ulanishni Sozlash

**Endpoint:** `https://ws.proccmarket.com`

**Autentifikatsiya:** Socket.io handshake orqali token asosida autentifikatsiya

```javascript
import io from 'socket.io-client';

const socket = io('https://ws.proccmarket.com', {
  auth: {
    token: 'USER_AUTH_TOKEN'
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io/'
});
```

### Ulanish Hodisalari

#### Ulandi (Connected)
Server bilan muvaffaqiyatli ulanilganda yuboriladi.

```javascript
socket.on('connected', (data) => {
  console.log('Ulandi:', data);
  // {
  //   message: "Socket.io serverga muvaffaqiyatli ulandi",
  //   userId: 123,
  //   rooms: ["user.123"]
  // }
});
```

#### Foydalanuvchi Onlayn/Offlayn
Boshqa foydalanuvchilar onlayn yoki offlayn bo'lganda bildirishnoma olish.

```javascript
socket.on('user-online', (data) => {
  console.log('Foydalanuvchi onlayn:', data);
  // { userId: 456, userName: "John Doe" }
});

socket.on('user-offline', (data) => {
  console.log('Foydalanuvchi offlayn:', data);
  // { userId: 456, userName: "John Doe" }
});
```

---

## 🔔 Real Vaqt Rejimida Bildirishnoma Hodisalari

### Bildirishnomalarni Tinglash

Barcha bildirishnomalar avtomatik ravishda foydalanuvchining shaxsiy kanaliga yuboriladi. Siz faqat hodisani tinglashingiz kerak:

```javascript
socket.on('notification.sent', (data) => {
  console.log('Yangi bildirishnoma:', data);
  
  // Foydalanuvchiga bildirishnoma ko'rsatish
  showNotification(data.notification);
  
  // O'qilmagan bildirishnomalar sonini yangilash
  updateUnreadCount();
});
```

### Bildirishnoma Hodisasi Tuzilmasi

```javascript
{
  notification: {
    id: 123,
    type: "new_message",
    title: "Yangi xabar",
    message: "John Doe sizga xabar yubordi.",
    data: {
      sender_id: 456,
      conversation_id: 789,
      message_id: 101112
    },
    is_read: false,
    read_at: null,
    created_at: "2025-10-23T10:30:00.000000Z",
    time_ago: "2 daqiqa oldin"
  },
  timestamp: "2025-10-23T10:30:00+00:00"
}
```

---

## 📝 Bildirishnoma Turlari

### Xabar Bildirishnomalari

#### Yangi Xabar (`new_message`)
Foydalanuvchi suhbatda yangi xabar olganida yuboriladi.

**Ma'lumot Tuzilmasi:**
```javascript
{
  sender_id: 456,           // Xabar yuboruvchi ID
  conversation_id: 789,     // Suhbat ID
  message_id: 101112,       // Xabar ID
  message_preview: "Salom, qalaysiz?" // Xabar ko'rinishi
}
```

#### Yangi Suhbat (`new_conversation`)
Kimdir foydalanuvchi bilan yangi suhbat boshlaganida yuboriladi.

**Ma'lumot Tuzilmasi:**
```javascript
{
  initiator_id: 456,        // Suhbatni boshlovchi ID
  conversation_id: 789      // Suhbat ID
}
```

---

### Buyurtma Bildirishnomalari

#### Buyurtma Yaratildi (`order_created`)
Yangi buyurtma yaratilganida yuboriladi.

**Ma'lumot Tuzilmasi:**
```javascript
{
  creator_id: 456,          // Buyurtma yaratuvchi ID
  order_id: 789,            // Buyurtma ID
  order_title: "Logo dizayni" // Buyurtma nomi
}
```

#### Buyurtma Qabul Qilindi (`order_accepted`)
Buyurtma qabul qilinganida yuboriladi.

**Ma'lumot Tuzilmasi:**
```javascript
{
  acceptor_id: 456,         // Qabul qiluvchi ID
  order_id: 789,            // Buyurtma ID
  order_title: "Logo dizayni"
}
```

#### Ish Topshirildi (`order_delivered`)
Buyurtma bo'yicha ish topshirilganida yuboriladi.

**Ma'lumot Tuzilmasi:**
```javascript
{
  order_id: 789,            // Buyurtma ID
  order_title: "Logo dizayni",
  delivery_id: 555          // Yetkazib berish ID
}
```

#### Buyurtma Bajarildi (`order_completed`)
Buyurtma muvaffaqiyatli bajarilganida yuboriladi.

**Ma'lumot Tuzilmasi:**
```javascript
{
  order_id: 789,            // Buyurtma ID
  order_title: "Logo dizayni",
  completed_at: "2025-10-23T10:30:00Z"
}
```

#### Buyurtma Bekor Qilindi (`order_cancelled`)
Buyurtma bekor qilinganida yuboriladi.

**Ma'lumot Tuzilmasi:**
```javascript
{
  cancelled_by_id: 456,     // Bekor qiluvchi ID
  order_id: 789,            // Buyurtma ID
  order_title: "Logo dizayni",
  reason: "Mijoz so'rovi bo'yicha" // Sabab
}
```

#### Bekor Qilish So'rovi (`order_cancellation_requested`)
Buyurtmani bekor qilish so'rovi yuborilganida.

**Ma'lumot Tuzilmasi:**
```javascript
{
  requester_id: 456,        // So'rov yuboruvchi ID
  order_id: 789,            // Buyurtma ID
  order_title: "Logo dizayni",
  reason: "Vaqtim yo'q"     // Sabab
}
```

#### Bekor Qilish Tasdiqlandi (`order_cancellation_approved`)
Bekor qilish so'rovi tasdiqlanganida yuboriladi.

**Ma'lumot Tuzilmasi:**
```javascript
{
  order_id: 789,            // Buyurtma ID
  order_title: "Logo dizayni"
}
```

#### Bekor Qilish Rad Etildi (`order_cancellation_rejected`)
Bekor qilish so'rovi rad etilganida yuboriladi.

**Ma'lumot Tuzilmasi:**
```javascript
{
  order_id: 789,            // Buyurtma ID
  order_title: "Logo dizayni",
  rejection_reason: "Ish boshlangan" // Rad etish sababi
}
```

#### Qayta Ishlash So'rovi (`order_revision_requested`)
Buyurtma qayta ishlash uchun yuborilganida.

**Ma'lumot Tuzilmasi:**
```javascript
{
  order_id: 789,            // Buyurtma ID
  order_title: "Logo dizayni",
  revision_notes: "Rang o'zgartirish kerak" // Qayta ishlash izohlari
}
```

#### Nizo Yaratildi (`order_disputed`)
Buyurtma bo'yicha nizo yaratilganida yuboriladi.

**Ma'lumot Tuzilmasi:**
```javascript
{
  dispute_raised_by_id: 456, // Nizo yaratuvchi ID
  order_id: 789,             // Buyurtma ID
  order_title: "Logo dizayni",
  dispute_reason: "Sifat yomon" // Nizo sababi
}
```

---

## 🌐 REST API Endpoints

### Base URL
```
https://api.proccmarket.com/api/v1
```

Barcha so'rovlar `Authorization` header bilan yuborilishi kerak:
```
Authorization: Bearer YOUR_TOKEN
```

---

### 1. Barcha Bildirishnomalarni Olish

**Endpoint:** `GET /notifications`

**Parametrlar:**
- `page` (optional) - Sahifa raqami (default: 1)
- `per_page` (optional) - Sahifada elementlar soni (default: 20)

**Javob:**
```json
{
  "data": [
    {
      "id": 123,
      "type": "new_message",
      "title": "Yangi xabar",
      "message": "John Doe sizga xabar yubordi.",
      "data": {
        "sender_id": 456,
        "conversation_id": 789
      },
      "is_read": false,
      "read_at": null,
      "created_at": "2025-10-23T10:30:00.000000Z",
      "time_ago": "2 daqiqa oldin"
    }
  ],
  "links": {
    "first": "https://api.proccmarket.com/api/v1/notifications?page=1",
    "last": "https://api.proccmarket.com/api/v1/notifications?page=5",
    "prev": null,
    "next": "https://api.proccmarket.com/api/v1/notifications?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 20,
    "to": 20,
    "total": 95
  }
}
```

---

### 2. O'qilmagan Bildirishnomalar Sonini Olish

**Endpoint:** `GET /notifications/unread-count`

**Javob:**
```json
{
  "unread_count": 12
}
```

**Misol (JavaScript):**
```javascript
const getUnreadCount = async () => {
  const response = await fetch('/api/v1/notifications/unread-count', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(`O'qilmagan: ${data.unread_count}`);
};
```

---

### 3. O'qilmagan Bildirishnomalarni Olish

**Endpoint:** `GET /notifications/unread`

**Parametrlar:**
- `page` (optional) - Sahifa raqami

**Javob:**
```json
{
  "data": [
    {
      "id": 123,
      "type": "new_message",
      "title": "Yangi xabar",
      "message": "John Doe sizga xabar yubordi.",
      "is_read": false,
      "read_at": null,
      "created_at": "2025-10-23T10:30:00.000000Z",
      "time_ago": "2 daqiqa oldin"
    }
  ]
}
```

---

### 4. Bildirishnomani O'qilgan Deb Belgilash

**Endpoint:** `POST /notifications/{id}/read`

**Javob:**
```json
{
  "message": "Bildirishnoma o'qilgan deb belgilandi",
  "data": {
    "id": 123,
    "is_read": true,
    "read_at": "2025-10-23T10:35:00.000000Z"
  }
}
```

**Misol (JavaScript):**
```javascript
const markAsRead = async (notificationId) => {
  const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(data.message);
};
```

---

### 5. Barcha Bildirishnomalarni O'qilgan Deb Belgilash

**Endpoint:** `POST /notifications/mark-all-read`

**Javob:**
```json
{
  "message": "Barcha bildirishnomalar o'qilgan deb belgilandi",
  "updated_count": 12
}
```

**Misol (JavaScript):**
```javascript
const markAllAsRead = async () => {
  const response = await fetch('/api/v1/notifications/mark-all-read', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(`${data.updated_count} ta bildirishnoma o'qildi`);
};
```

---

### 6. Bildirishnomani O'chirish

**Endpoint:** `DELETE /notifications/{id}`

**Javob:**
```json
{
  "message": "Bildirishnoma muvaffaqiyatli o'chirildi"
}
```

---

### 7. Barcha O'qilgan Bildirishnomalarni O'chirish

**Endpoint:** `DELETE /notifications/read/all`

**Javob:**
```json
{
  "message": "Barcha o'qilgan bildirishnomalar o'chirildi",
  "deleted_count": 25
}
```

---

## 🔧 To'liq Frontend Integratsiya Misoli

### React + Socket.io

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const NotificationSystem = () => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const token = localStorage.getItem('auth_token');

  // Socket ulanishini o'rnatish
  useEffect(() => {
    const socketInstance = io('ws://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connected', (data) => {
      console.log('Ulandi:', data);
    });

    // Yangi bildirishnomani tinglash
    socketInstance.on('notification.sent', (data) => {
      const newNotification = data.notification;
      
      // Bildirishnomalar ro'yxatiga qo'shish
      setNotifications(prev => [newNotification, ...prev]);
      
      // O'qilmaganlar sonini oshirish
      setUnreadCount(prev => prev + 1);
      
      // Brauzer bildirishnomasi ko'rsatish
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/notification-icon.png'
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  // Dastlabki bildirishnomalarni yuklash
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await axios.get('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Bildirishnomalarni yuklashda xatolik:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await axios.get('/api/v1/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('O\'qilmaganlar sonini yuklashda xatolik:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(
        `/api/v1/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Bildirishnomani o'qilgan deb yangilash
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date() }
            : notif
        )
      );
      
      // O'qilmaganlar sonini kamaytirish
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('O\'qilgan deb belgilashda xatolik:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(
        '/api/v1/notifications/mark-all-read',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Barcha bildirishnomalarni o'qilgan deb yangilash
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date() }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Barchasini o\'qilgan deb belgilashda xatolik:', error);
    }
  };

  return (
    <div className="notification-system">
      <div className="notification-header">
        <h2>Bildirishnomalar</h2>
        <span className="badge">{unreadCount}</span>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead}>
            Barchasini o'qilgan deb belgilash
          </button>
        )}
      </div>
      
      <div className="notification-list">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
            onClick={() => !notif.is_read && markAsRead(notif.id)}
          >
            <h4>{notif.title}</h4>
            <p>{notif.message}</p>
            <span className="time">{notif.time_ago}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSystem;
```

---

## 🎨 Bildirishnoma Turlari Bo'yicha UI Ko'rsatish

```javascript
const getNotificationIcon = (type) => {
  const icons = {
    'new_message': '💬',
    'new_conversation': '💭',
    'order_created': '📝',
    'order_accepted': '✅',
    'order_delivered': '📦',
    'order_completed': '🎉',
    'order_cancelled': '❌',
    'order_cancellation_requested': '⚠️',
    'order_cancellation_approved': '✔️',
    'order_cancellation_rejected': '❎',
    'order_revision_requested': '🔄',
    'order_disputed': '⚡'
  };
  
  return icons[type] || '🔔';
};

const getNotificationColor = (type) => {
  const colors = {
    'new_message': '#3b82f6',
    'new_conversation': '#8b5cf6',
    'order_created': '#10b981',
    'order_accepted': '#22c55e',
    'order_delivered': '#06b6d4',
    'order_completed': '#eab308',
    'order_cancelled': '#ef4444',
    'order_cancellation_requested': '#f97316',
    'order_cancellation_approved': '#84cc16',
    'order_cancellation_rejected': '#dc2626',
    'order_revision_requested': '#6366f1',
    'order_disputed': '#f59e0b'
  };
  
  return colors[type] || '#6b7280';
};
```

---

## ⚡ Best Practices

### 1. Socket Ulanishini Boshqarish
```javascript
// Qayta ulanish logikasi
socket.on('disconnect', (reason) => {
  console.log('Ulanish uzildi:', reason);
  
  if (reason === 'io server disconnect') {
    // Server tomonidan uzilgan, qayta ulaning
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  console.error('Ulanish xatosi:', error);
  // Token yangilanishini ko'rib chiqing
});
```

### 2. Bildirishnomalarni Keshlash
```javascript
// LocalStorage ga saqlash
const cacheNotifications = (notifications) => {
  localStorage.setItem('notifications_cache', JSON.stringify(notifications));
};

const getCachedNotifications = () => {
  const cached = localStorage.getItem('notifications_cache');
  return cached ? JSON.parse(cached) : [];
};
```

### 3. Brauzer Bildirishnomalari
```javascript
// Ruxsat so'rash
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Bildirishnoma ko'rsatish
const showBrowserNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: 'notification',
      requireInteraction: false
    });
  }
};
```

### 4. Xatoliklarni Boshqarish
```javascript
// Umumiy xato handler
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token muddati tugagan
      logout();
    } else if (error.response?.status === 403) {
      // Ruxsat yo'q
      showError('Ruxsat berilmagan');
    } else {
      showError('Xatolik yuz berdi');
    }
    return Promise.reject(error);
  }
);
```
