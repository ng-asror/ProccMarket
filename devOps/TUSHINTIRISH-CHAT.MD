# Real-time Chat System - API Documentation

## 📋 Mundarija

1. [Kirish](#kirish)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [WebSocket Integration](#websocket-integration)
5. [Angular Implementation](#angular-implementation)
6. [Error Handling](#error-handling)

---

## Kirish

Bu real-time chat tizimi Laravel backend va Pusher WebSocket orqali ishlaydi. Tizim RESTful API va WebSocket kombinatsiyasidan foydalanadi.

### Asosiy Texnologiyalar
- **Backend**: Laravel 10+
- **WebSocket**: Pusher (Laravel Echo)
- **Database**: MySQL/PostgreSQL
- **Authentication**: Laravel Sanctum (Bearer Token)

### Base URL
```
https://admin.proccmarket.com/api/v1/chat
```

### Demo
```
https://admin.proccmarket.com/chat.html
```
*Ikki xil browserda ikki xil user bilan sinab ko'ring*

---

## Authentication

Barcha API so'rovlari uchun Bearer token talab qilinadi.

### Headers
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
Accept: application/json
Content-Type: application/json
```

### Token Olish
Token olish uchun asosiy authentication API ni ishlatishingiz kerak (bu chat API dan tashqarida).

---

## API Endpoints

### 1. User Management

#### 1.1 Joriy foydalanuvchini olish
```http
GET /users/me
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "is_admin": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### 1.2 Boshqa foydalanuvchini olish
```http
GET /users/{userId}
```

**Response:**
```json
{
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

---

### 2. Conversations (Suhbatlar)

#### 2.1 Barcha suhbatlarni olish
```http
GET /conversations?page=1
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Sahifa raqami |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "user_one": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "user_two": {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "latest_message": {
        "id": 100,
        "content": "Hello there!",
        "user": {
          "id": 1,
          "name": "John Doe"
        },
        "created_at": "2025-10-14T10:30:00Z"
      },
      "unread_count": 3,
      "last_message_at": "2025-10-14T10:30:00Z",
      "created_at": "2025-10-01T08:00:00Z"
    }
  ],
  "links": {
    "first": "https://admin.proccmarket.com/api/v1/chat/conversations?page=1",
    "last": "https://admin.proccmarket.com/api/v1/chat/conversations?page=5",
    "prev": null,
    "next": "https://admin.proccmarket.com/api/v1/chat/conversations?page=2"
  },
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 87
  }
}
```

**Izoh:**
- Admin foydalanuvchilar barcha suhbatlarni ko'radi
- Oddiy foydalanuvchilar faqat o'z suhbatlarini ko'radi
- Suhbatlar `last_message_at` bo'yicha tartiblangan

#### 2.2 Yangi suhbat boshlash
```http
POST /conversations
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": 2
}
```

**Response (201):**
```json
{
  "message": "Conversation created successfully",
  "data": {
    "id": 1,
    "user_one": {
      "id": 1,
      "name": "John Doe"
    },
    "user_two": {
      "id": 2,
      "name": "Jane Smith"
    },
    "latest_message": null,
    "last_message_at": null,
    "created_at": "2025-10-14T10:30:00Z"
  }
}
```

**Izoh:**
- Agar suhbat allaqachon mavjud bo'lsa, mavjud suhbat qaytariladi
- O'z-o'zingiz bilan suhbat boshlay olmaysiz

#### 2.3 Bitta suhbatni olish (xabarlar bilan)
```http
GET /conversations/{conversationId}?sort=asc&page=1
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| sort | string | asc | Tartiblash: `asc` yoki `desc` |
| page | integer | 1 | Sahifa raqami |

**Response:**
```json
{
  "conversation": {
    "id": 1,
    "user_one": {
      "id": 1,
      "name": "John Doe"
    },
    "user_two": {
      "id": 2,
      "name": "Jane Smith"
    },
    "latest_message": {
      "id": 100,
      "content": "Hello!",
      "created_at": "2025-10-14T10:30:00Z"
    },
    "last_message_at": "2025-10-14T10:30:00Z"
  },
  "messages": {
    "data": [
      {
        "id": 1,
        "conversation_id": 1,
        "content": "Salom!",
        "user": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "reply_to": null,
        "file_path": null,
        "file_name": null,
        "file_type": null,
        "file_size": null,
        "read_at": "2025-10-14T10:35:00Z",
        "created_at": "2025-10-14T10:30:00Z",
        "updated_at": "2025-10-14T10:35:00Z"
      },
      {
        "id": 2,
        "conversation_id": 1,
        "content": "Qalaysiz?",
        "user": {
          "id": 2,
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "reply_to": {
          "id": 1,
          "content": "Salom!",
          "user": {
            "id": 1,
            "name": "John Doe"
          }
        },
        "file_path": "chat-files/example.jpg",
        "file_name": "photo.jpg",
        "file_type": "image/jpeg",
        "file_size": 102400,
        "read_at": null,
        "created_at": "2025-10-14T10:32:00Z",
        "updated_at": "2025-10-14T10:32:00Z"
      }
    ]
  },
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 50,
    "total": 234
  }
}
```

**Izoh:**
- Suhbatni ochish bilan barcha o'qilmagan xabarlar avtomatik `read_at` oladi
- Har bir sahifada 50 ta xabar
- Fayllar `https://admin.proccmarket.com/storage/{file_path}` orqali yuklanadi

#### 2.4 Suhbatni o'chirish
```http
DELETE /conversations/{conversationId}
```

**Response (200):**
```json
{
  "message": "Conversation deleted successfully"
}
```

**Izoh:**
- Faqat ishtirokchilar va adminlar o'chira oladi
- Soft delete ishlatiladi (ma'lumotlar bazadan o'chmaydiy)

---

### 3. Messages (Xabarlar)

#### 3.1 Xabar yuborish
```http
POST /conversations/{conversationId}/messages
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```javascript
// Faqat text
{
  "content": "Salom, qalaysiz?"
}

// Text + Reply
{
  "content": "Bu javob",
  "reply_to_message_id": 123
}

// Text + File
{
  "content": "Rasm yuboraman",
  "file": File
}

// Faqat File
{
  "file": File
}
```

**Validation Rules:**
- `content`: string, max 10000 belgi (optional agar file bo'lsa)
- `file`: file, max 10MB (optional)
- `reply_to_message_id`: integer, mavjud xabar ID si (optional)
- Kamida bittasi (content yoki file) bo'lishi kerak

**Response (201):**
```json
{
  "message": "Message sent successfully",
  "data": {
    "id": 1,
    "conversation_id": 1,
    "content": "Salom, qalaysiz?",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "reply_to": {
      "id": 123,
      "content": "Oldingi xabar",
      "user": {
        "id": 2,
        "name": "Jane Smith"
      }
    },
    "file_path": "chat-files/xyz.jpg",
    "file_name": "image.jpg",
    "file_type": "image/jpeg",
    "file_size": 102400,
    "read_at": null,
    "created_at": "2025-10-14T10:30:00Z",
    "updated_at": "2025-10-14T10:30:00Z"
  }
}
```

**Izoh:**
- Xabar yuborilgach WebSocket orqali barcha ishtirokchilarga yuboriladi
- Suhbatning `last_message_at` avtomatik yangilanadi
- Fayl turlar: rasm, video, pdf, doc, va boshqalar

#### 3.2 Bitta xabarni olish
```http
GET /messages/{messageId}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "conversation_id": 1,
    "content": "Salom!",
    "user": {
      "id": 1,
      "name": "John Doe"
    },
    "reply_to": null,
    "file_path": null,
    "read_at": "2025-10-14T10:35:00Z",
    "created_at": "2025-10-14T10:30:00Z"
  }
}
```

#### 3.3 Xabarni o'qilgan deb belgilash
```http
POST /messages/{messageId}/read
```

**Response:**
```json
{
  "message": "Message marked as read",
  "data": {
    "id": 1,
    "content": "Salom!",
    "read_at": "2025-10-14T10:35:00Z",
    ...
  }
}
```

**Izoh:**
- Faqat qabul qiluvchi o'z xabarini o'qilgan qilishi mumkin
- Yuboruvchi o'z xabarini o'qilgan qila olmaydi

#### 3.4 Xabarni tahrirlash
```http
PUT /messages/{messageId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Tahrirlangan xabar matni"
}
```

**Response:**
```json
{
  "message": "Message updated successfully",
  "data": {
    "id": 1,
    "content": "Tahrirlangan xabar matni",
    "updated_at": "2025-10-14T11:00:00Z",
    ...
  }
}
```

**Cheklovlar:**
- Faqat 24 soat ichida tahrirlash mumkin
- Faqat o'z xabaringizni tahrirlash mumkin (yoki admin)
- Faqat `content` tahrirlanadi (fayl o'zgarmaydi)

**Error (403):**
```json
{
  "message": "Messages can only be edited within 24 hours of creation"
}
```

#### 3.5 Xabarni o'chirish
```http
DELETE /messages/{messageId}
```

**Response (200):**
```json
{
  "message": "Message deleted successfully"
}
```

**Izoh:**
- Faqat o'z xabaringizni o'chirish mumkin (yoki admin)
- Agar fayl bo'lsa, fayl ham o'chiriladi
- Soft delete ishlatiladi

---

## WebSocket Integration

### 1. Pusher Configuration

```javascript
const echoConfig = {
  broadcaster: 'pusher',
  key: 'pfhvoct1m3qrpxulyis8',
  wsHost: 'ws.proccmarket.com',
  wsPort: 443,
  wssPort: 443,
  forceTLS: true,
  disableStats: true,
  enabledTransports: ['ws', 'wss'],
  cluster: 'mt1',
  authEndpoint: 'https://admin.proccmarket.com/api/v1/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${YOUR_TOKEN}`,
      Accept: 'application/json',
    },
  },
};
```

### 2. Private Channel Authorization

Suhbat kanallari private, shuning uchun authorization kerak.

**Authorization Endpoint:**
```http
POST https://admin.proccmarket.com/api/v1/broadcasting/auth
Content-Type: application/json

{
  "channel_name": "private-conversation.1",
  "socket_id": "123456.78910"
}
```

**Response:**
```json
{
  "auth": "pfhvoct1m3qrpxulyis8:signature"
}
```

### 3. Events

#### MessageSent Event

Yangi xabar yuborilganda broadcast qilinadi.

**Channel:** `private-conversation.{conversationId}`  
**Event:** `.message.sent`

**Payload:**
```json
{
  "message": {
    "id": 1,
    "conversation_id": 1,
    "content": "Salom!",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "reply_to": null,
    "file_path": null,
    "read_at": null,
    "created_at": "2025-10-14T10:30:00Z"
  },
  "conversation_id": 1,
  "timestamp": "2025-10-14T10:30:00Z"
}
```

---

## Angular Implementation

### 1. Install Dependencies

```bash
npm install laravel-echo pusher-js
```

### 2. Create API Service

```typescript
// services/chat-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
  id: number;
  conversation_id: number;
  content: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  reply_to?: Message;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  user_one: any;
  user_two: any;
  latest_message?: Message;
  last_message_at?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatApiService {
  private baseUrl = 'https://admin.proccmarket.com/api/v1/chat';
  
  constructor(private http: HttpClient) {}

  // Headers with token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  // === USER ENDPOINTS ===
  
  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/me`, {
      headers: this.getHeaders()
    });
  }

  getUser(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${userId}`, {
      headers: this.getHeaders()
    });
  }

  // === CONVERSATION ENDPOINTS ===
  
  getConversations(page: number = 1): Observable<any> {
    return this.http.get(`${this.baseUrl}/conversations`, {
      headers: this.getHeaders(),
      params: { page: page.toString() }
    });
  }

  createConversation(userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/conversations`, 
      { user_id: userId },
      { headers: this.getHeaders() }
    );
  }

  getConversation(id: number, sort: 'asc' | 'desc' = 'asc', page: number = 1): Observable<any> {
    return this.http.get(`${this.baseUrl}/conversations/${id}`, {
      headers: this.getHeaders(),
      params: { 
        sort: sort,
        page: page.toString()
      }
    });
  }

  deleteConversation(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/conversations/${id}`, {
      headers: this.getHeaders()
    });
  }

  // === MESSAGE ENDPOINTS ===
  
  sendMessage(conversationId: number, data: {
    content?: string;
    file?: File;
    reply_to_message_id?: number;
  }): Observable<any> {
    const formData = new FormData();
    
    if (data.content) {
      formData.append('content', data.content);
    }
    if (data.file) {
      formData.append('file', data.file);
    }
    if (data.reply_to_message_id) {
      formData.append('reply_to_message_id', data.reply_to_message_id.toString());
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
      // 'Content-Type' ni qo'shmaslik kerak, browser o'zi qo'shadi multipart/form-data
    });

    return this.http.post(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      formData,
      { headers }
    );
  }

  getMessage(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/messages/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateMessage(id: number, content: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/messages/${id}`,
      { content },
      { headers: this.getHeaders() }
    );
  }

  deleteMessage(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/messages/${id}`, {
      headers: this.getHeaders()
    });
  }

  markAsRead(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/messages/${id}/read`, {},
      { headers: this.getHeaders() }
    );
  }

  // === HELPER METHODS ===
  
  getFileUrl(filePath: string): string {
    return `https://admin.proccmarket.com/storage/${filePath}`;
  }
}
```

### 3. Create WebSocket Service

```typescript
// services/chat-websocket.service.ts
import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: any;
    Echo: Echo;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ChatWebSocketService {
  private echo: Echo | null = null;
  private listeners = new Map<number, any>();

  constructor() {
    window.Pusher = Pusher;
  }

  connect(token: string): void {
    if (this.echo) {
      return;
    }

    this.echo = new Echo({
      broadcaster: 'pusher',
      key: 'pfhvoct1m3qrpxulyis8',
      wsHost: 'ws.proccmarket.com',
      wsPort: 443,
      wssPort: 443,
      forceTLS: true,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
      cluster: 'mt1',
      authEndpoint: 'https://admin.proccmarket.com/api/v1/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    });
  }

  joinConversation(conversationId: number, callback: (event: any) => void): void {
    if (!this.echo) {
      console.error('Echo not initialized. Call connect() first.');
      return;
    }

    const channel = this.echo.private(`conversation.${conversationId}`);
    
    channel.listen('.message.sent', (event: any) => {
      callback(event);
    });

    this.listeners.set(conversationId, channel);
  }

  leaveConversation(conversationId: number): void {
    if (this.listeners.has(conversationId)) {
      this.echo?.leave(`conversation.${conversationId}`);
      this.listeners.delete(conversationId);
    }
  }

  disconnect(): void {
    if (this.echo) {
      this.listeners.forEach((_, conversationId) => {
        this.leaveConversation(conversationId);
      });
      this.echo.disconnect();
      this.echo = null;
    }
  }
}
```

### 4. Chat Component

```typescript
// components/chat/chat.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatApiService, Conversation, Message } from '../../services/chat-api.service';
import { ChatWebSocketService } from '../../services/chat-websocket.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  messages: Message[] = [];
  activeConversation: number | null = null;
  currentUser: any = null;
  newMessage: string = '';
  selectedFile: File | null = null;
  replyingTo: Message | null = null;

  constructor(
    private chatApi: ChatApiService,
    private chatWs: ChatWebSocketService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadConversations();
    
    // WebSocket ga ulanish
    const token = localStorage.getItem('token');
    if (token) {
      this.chatWs.connect(token);
    }
  }

  ngOnDestroy(): void {
    if (this.activeConversation) {
      this.chatWs.leaveConversation(this.activeConversation);
    }
    this.chatWs.disconnect();
  }

  loadCurrentUser(): void {
    this.chatApi.getCurrentUser().subscribe({
      next: (response) => {
        this.currentUser = response.data;
      },
      error: (error) => {
        console.error('Failed to load user:', error);
      }
    });
  }

  loadConversations(): void {
    this.chatApi.getConversations().subscribe({
      next: (response) => {
        this.conversations = response.data;
      },
      error: (error) => {
        console.error('Failed to load conversations:', error);
      }
    });
  }

  selectConversation(id: number): void {
    // Eski suhbatdan chiqish
    if (this.activeConversation) {
      this.chatWs.leaveConversation(this.activeConversation);
    }

    this.activeConversation = id;
    this.loadMessages(id);
    
    // WebSocket ga ulanish
    this.chatWs.joinConversation(id, (event) => {
      this.handleNewMessage(event);
    });
  }

  loadMessages(conversationId: number): void {
    this.chatApi.getConversation(conversationId, 'asc').subscribe({
      next: (response) => {
        this.messages = response.messages.data;
      },
      error: (error) => {
        console.error('Failed to load messages:', error);
      }
    });
  }

  sendMessage(): void {
    if (!this.activeConversation) return;
    if (!this.newMessage.trim() && !this.selectedFile) return;

    const data: any = {};
    
    if (this.newMessage.trim()) {
      data.content = this.newMessage;
    }
    if (this.selectedFile) {
      data.file = this.selectedFile;
    }
    if (this.replyingTo) {
      data.reply_to_message_id = this.replyingTo.id;
    }

    this.chatApi.sendMessage(this.activeConversation, data).subscribe({
      next: (response) => {
        // Tozalash
        this.newMessage = '';
        this.selectedFile = null;
        this.replyingTo = null;
      },
      error: (error) => {
        console.error('Failed to send message:', error);
        alert('Xabar yuborishda xatolik yuz berdi');
      }
    });
  }

  handleNewMessage(event: any): void {
    this.messages.push(event.message);
    
    // Agar xabar boshqa foydalanuvchidan kelsa
    if (event.message.user.id !== this.currentUser?.id) {
      // O'qilgan deb belgilash
      this.chatApi.markAsRead(event.message.id).subscribe();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) { // 10MB
      this.selectedFile = file;
    } else {
      alert('Fayl hajmi 10MB dan kichik bo'lishi kerak');
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  replyToMessage(message: Message): void {
    this.replyingTo = message;
  }

  cancelReply(): void {
    this.replyingTo = null;
  }

  deleteMessage(id: number): void {
    if (!confirm('Xabarni o\'chirmoqchimisiz?')) return;

    this.chatApi.deleteMessage(id).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m.id !== id);
      },
      error: (error) => {
        console.error('Failed to delete message:', error);
      }
    });
  }

  canEditMessage(message: Message): boolean {
    if (!this.currentUser) return false;
    if (message.user.id !== this.currentUser.id) return false;
    
    // 24 soat tekshirish
    const createdAt = new Date(message.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff <= 24;
  }

  getFileUrl(filePath: string): string {
    return this.chatApi.getFileUrl(filePath);
  }

  getOtherUser(conversation: Conversation): any {
    if (!this.currentUser) return null;
    return conversation.user_one.id === this.currentUser.id 
      ? conversation.user_two 
      : conversation.user_one;
  }
}
```

### 5. Usage Example

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';
import { ChatApiService } from './services/chat-api.service';
import { ChatWebSocketService } from './services/chat-websocket.service';

@Component({
  selector: 'app-root',
  template: '<app-chat></app-chat>'
})
export class AppComponent implements OnInit {
  
  constructor(
    private chatApi: ChatApiService,
    private chatWs: ChatWebSocketService
  ) {}

  ngOnInit(): void {
    // Token bilan WebSocket ga ulanish
    const token = localStorage.getItem('token');
    if (token) {
      this.chatWs.connect(token);
    }
  }
}
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | So'rov muvaffaqiyatli |
| 201 | Created | Yangi resurs yaratildi |
| 400 | Bad Request | Noto'g'ri so'rov parametrlari |
| 401 | Unauthorized | Token yo'q yoki noto'g'ri |
| 403 | Forbidden | Ruxsat yo'q |
| 404 | Not Found | Resurs topilmadi |
| 422 | Unprocessable Entity | Validation xatolik |
| 500 | Server Error | Server xatoligi |

### Error Response Format

```json
{
  "message": "Xatolik tavsifi",
  "errors": {
    "field_name": [
      "Validation xatolik 1",
      "Validation xatolik 2"
    ]
  }
}
```

### Validation Errors Example

#### Xabar yuborishda xatolik
```json
{
  "message": "The content field is required when file is not present.",
  "errors": {
    "content": [
      "The content field is required when file is not present."
    ]
  }
}
```

#### Fayl hajmi katta
```json
{
  "message": "The file must not be greater than 10240 kilobytes.",
  "errors": {
    "file": [
      "The file must not be greater than 10240 kilobytes."
    ]
  }
}
```

### Angular Error Handling

```typescript
// services/chat-api.service.ts
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

sendMessage(conversationId: number, data: any): Observable<any> {
  // ... code ...
  
  return this.http.post(url, formData, { headers }).pipe(
    catchError((error) => {
      console.error('API Error:', error);
      
      if (error.status === 422) {
        // Validation error
        const validationErrors = error.error.errors;
        console.error('Validation errors:', validationErrors);
      } else if (error.status === 403) {
        // Forbidden
        console.error('Access denied:', error.error.message);
      } else if (error.status === 401) {
        // Unauthorized - token expired
        console.error('Token expired, redirect to login');
      }
      
      return throwError(() => error);
    })
  );
}
```

---

## Best Practices

### 1. Token Management

```typescript
// Token saqlash
localStorage.setItem('token', 'your-access-token');

// Token olish
const token = localStorage.getItem('token');

// Token o'chirish (logout)
localStorage.removeItem('token');
```

### 2. Real-time Updates

```typescript
// Suhbat ochilganda WebSocket ga ulanish
selectConversation(id: number): void {
  this.chatWs.joinConversation(id, (event) => {
    // Yangi xabar keldi
    this.messages.push(event.message);
    
    // Agar boshqa foydalanuvchidan bo'lsa
    if (event.message.user.id !== this.currentUser.id) {
      // O'qilgan deb belgilash
      this.chatApi.markAsRead(event.message.id).subscribe();
      
      // Notification ko'rsatish
      this.showNotification('Yangi xabar', event.message.content);
    }
  });
}

// Komponent destroy bo'lganda
ngOnDestroy(): void {
  if (this.activeConversation) {
    this.chatWs.leaveConversation(this.activeConversation);
  }
}
```

### 3. File Upload

```typescript
// HTML
<input 
  type="file" 
  (change)="onFileSelected($event)"
  accept="image/*,video/*,.pdf,.doc,.docx"
  #fileInput
/>

// TypeScript
onFileSelected(event: any): void {
  const file = event.target.files[0];
  
  if (!file) return;
  
  // Hajmni tekshirish (10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('Fayl hajmi 10MB dan oshmasligi kerak');
    return;
  }
  
  // Tur tekshirish
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'video/mp4', 'video/avi',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    alert('Fayl turi qo\'llab-quvvatlanmaydi');
    return;
  }
  
  this.selectedFile = file;
}
```

### 4. Message Pagination

```typescript
// Keyingi sahifani yuklash
loadMoreMessages(conversationId: number, page: number): void {
  this.chatApi.getConversation(conversationId, 'asc', page).subscribe({
    next: (response) => {
      // Eski xabarlarni boshiga qo'shish
      this.messages = [...response.messages.data, ...this.messages];
      this.currentPage = page;
      this.hasMoreMessages = page < response.pagination.last_page;
    }
  });
}

// Scroll event
onScroll(event: any): void {
  const element = event.target;
  
  // Yuqoriga scroll qilganda
  if (element.scrollTop === 0 && this.hasMoreMessages) {
    this.loadMoreMessages(this.activeConversation!, this.currentPage + 1);
  }
}
```

### 5. Typing Indicator (Optional)

Agar typing indicator qo'shmoqchi bo'lsangiz, alohida event yaratish kerak.

```typescript
// Backend - yangi event
class UserTyping implements ShouldBroadcast {
  public function broadcastOn(): array {
    return [new PrivateChannel('conversation.' . $this->conversationId)];
  }
  
  public function broadcastAs(): string {
    return 'user.typing';
  }
}

// Frontend
let typingTimeout: any;

onMessageInput(): void {
  // Typing eventini yuborish
  clearTimeout(typingTimeout);
  
  // Typing ni broadcast qilish
  this.chatWs.broadcastTyping(this.activeConversation!);
  
  // 3 soniyadan keyin to'xtatish
  typingTimeout = setTimeout(() => {
    this.chatWs.stopTyping(this.activeConversation!);
  }, 3000);
}

// Typing ni tinglash
this.chatWs.listenTyping(conversationId, (event) => {
  this.showTypingIndicator(event.user.name);
});
```

### 6. Offline Handling

```typescript
// Online/Offline detection
window.addEventListener('online', () => {
  console.log('Internet tiklandi');
  this.reconnectWebSocket();
});

window.addEventListener('offline', () => {
  console.log('Internet uzildi');
  this.showOfflineMessage();
});

reconnectWebSocket(): void {
  const token = localStorage.getItem('token');
  if (token && this.activeConversation) {
    this.chatWs.disconnect();
    this.chatWs.connect(token);
    this.chatWs.joinConversation(this.activeConversation, (event) => {
      this.handleNewMessage(event);
    });
  }
}
```

### 7. Message Status Icons

```typescript
getMessageStatus(message: Message): string {
  if (message.user.id !== this.currentUser?.id) {
    return ''; // Boshqa foydalanuvchi xabari
  }
  
  if (message.read_at) {
    return '✓✓'; // O'qilgan
  }
  
  return '✓'; // Yuborilgan
}
```

---

## Testing

### 1. Postman Collection

API ni test qilish uchun Postman ishlatishingiz mumkin.

**Environment Variables:**
```json
{
  "base_url": "https://admin.proccmarket.com/api/v1/chat",
  "token": "your-access-token"
}
```

**Sample Request:**
```http
GET {{base_url}}/conversations
Authorization: Bearer {{token}}
```

### 2. Browser Console Testing

```javascript
// Token bilan test
const token = 'your-token';

// Suhbatlarni olish
fetch('https://admin.proccmarket.com/api/v1/chat/conversations', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));

// Xabar yuborish
const formData = new FormData();
formData.append('content', 'Test message');

fetch('https://admin.proccmarket.com/api/v1/chat/conversations/1/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## Troubleshooting

### 1. WebSocket ulanmayapti

**Muammo:** Echo ulanmayapti yoki authorization muvaffaqiyatsiz

**Yechim:**
```typescript
// 1. Token to'g'riligini tekshiring
console.log('Token:', localStorage.getItem('token'));

// 2. Broadcasting auth endpoint tekshirish
// Browser Network tab da /broadcasting/auth so'rovini tekshiring

// 3. Pusher console da ulanishlarni monitoring qiling
// https://dashboard.pusher.com/

// 4. CORS muammosi bo'lishi mumkin
// Backend da CORS sozlamalarini tekshiring
```

### 2. Xabarlar real-time kelmayapti

**Muammo:** WebSocket ishlamayapti

**Yechim:**
```typescript
// Channel ga to'g'ri ulanganligini tekshiring
echo.private('conversation.1')
  .listen('.message.sent', (e) => {
    console.log('Event received:', e);
  })
  .error((error) => {
    console.error('Channel error:', error);
  });
```

### 3. File upload ishlamayapti

**Muammo:** Fayl yuborilmayapti

**Yechim:**
```typescript
// Content-Type ni qo'shmaslik kerak
// Browser o'zi multipart/form-data qo'yadi

const headers = new HttpHeaders({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/json'
  // 'Content-Type' ni qo'shmang!
});
```

### 4. 403 Forbidden

**Muammo:** Suhbatga kirish ruxsati yo'q

**Yechim:**
```typescript
// 1. Siz suhbat ishtirokchisimisiz?
// 2. Token to'g'rimi?
// 3. Admin huquqlaringiz bormi?

// Conversation ma'lumotlarini tekshiring
this.chatApi.getConversation(1).subscribe({
  next: (data) => console.log(data),
  error: (err) => console.error('Error:', err.error.message)
});
```

---

## Support

### Qo'shimcha yordam kerak bo'lsa:

1. **Backend Logs:** Laravel logs ni tekshiring
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Frontend Console:** Browser console da xatolarni ko'ring
   ```javascript
   // Debug mode
   localStorage.setItem('debug', 'true');
   ```

3. **Network Tab:** HTTP so'rovlarni monitoring qiling

4. **Pusher Dashboard:** WebSocket connection larni ko'ring

---

## Changelog

### Version 1.0.0 (2025-10-14)
- ✅ Basic chat functionality
- ✅ File upload/download
- ✅ Message replies
- ✅ Real-time messaging
- ✅ Read receipts
- ✅ Message editing (24h limit)
- ✅ Message deletion
- ✅ Admin controls

---

**Demo URL:** https://admin.proccmarket.com/chat.html  
**API Base URL:** https://admin.proccmarket.com/api/v1/chat  
**WebSocket:** wss://ws.proccmarket.com