# Order Transaction API Documentation

## Umumiy Ma'lumot

Bu API escrow tizimi bilan ishlaydigan order (buyurtma) tizimini boshqaradi. Ikkala tomon (mijoz va freelancer) ham order yaratishi, qabul qilishi va boshqarishi mumkin.

---

## Asosiy Tushunchalar

### Rollar
- **Client (Mijoz)** - To'lovchi tomon, ish buyurtma beruvchi
- **Freelancer** - Ishni bajaruvchi tomon, to'lov oluvchi
- **Creator** - Orderni yaratgan odam (mijoz yoki freelancer bo'lishi mumkin)
- **Executor** - Orderni qabul qilishi kerak bo'lgan odam (creator emas, ikkinchi tomon)

### Order Statuslari

| Status | Tavsif |
|--------|--------|
| `pending` | Order yaratildi, qabul qilinishi kutilmoqda |
| `accepted` | Order qabul qilindi, pul escrow qilindi, ish boshlandi |
| `in_progress` | Ish jarayonda (accepted bilan bir xil) |
| `delivered` | Freelancer ishni topshirdi, mijoz tekshirayapti |
| `completed` | Mijoz ishni tasdiqladi |
| `released` | To'lov freelancerga o'tkazildi (yakuniy holat) |
| `cancellation_requested` | Bir tomon bekor qilishni so'radi, ikkinchi tomon javobi kutilmoqda |
| `cancelled` | Order bekor qilindi (pending holatda) |
| `refunded` | Order bekor qilindi va pul qaytarildi (accepted holatda) |
| `dispute` | Nizo ochilgan, admin ko'rib chiqmoqda |

---

## API Endpoints

### 1. Order Yaratish

**Endpoint:** `POST /api/conversations/{conversation_id}/orders`

**Maqsad:** Yangi order yaratish (mijoz yoki freelancer tomonidan)

**Request Body:**
```json
{
  "conversation_id": 123,
  "title": "Website Development",
  "description": "Create a responsive website with...",
  "amount": 500.00,
  "deadline": "2025-12-31 23:59:59",
  "is_client_order": true
}
```

**Parametrlar:**

| Maydon | Tip | Majburiy | Tavsif |
|--------|-----|----------|--------|
| `conversation_id` | integer | Ha | Chat ID |
| `title` | string | Ha | Order sarlavhasi (max 255 ta belgi) |
| `description` | string | Ha | To'liq tavsif (max 10,000 ta belgi) |
| `amount` | decimal | Ha | Narx (0.01 dan 999,999.99 gacha) |
| `deadline` | datetime | Yo'q | Tugash sanasi (kelajakda bo'lishi kerak) |
| `is_client_order` | boolean | Yo'q | `true` = mijoz yaratdi, `false` = freelancer yaratdi (default: `true`) |

**Qanday ishlaydi:**
- Agar `is_client_order = true` bo'lsa:
  - Order yaratuvchi = Client
  - Qabul qiluvchi = Freelancer
  - Freelancer qabul qilganda mijozdan pul yechiladi
  
- Agar `is_client_order = false` bo'lsa:
  - Order yaratuvchi = Freelancer  
  - Qabul qiluvchi = Client
  - Mijoz qabul qilganda uning hisobidan pul yechiladi

---

### 2. Conversationdagi Barcha Orderlarni Olish

**Endpoint:** `GET /api/conversations/{conversation_id}/orders`

**Query Params:**
- `page` - Sahifa raqami (pagination uchun)

---

### 3. Bitta Orderni Ko'rish

**Endpoint:** `GET /api/orders/{order_id}`

**Maqsad:** Order to'liq ma'lumotlarini olish

---

### 4. Orderni Qabul Qilish (Accept)

**Endpoint:** `POST /api/orders/{order_id}/accept`

**Kim bajara oladi:** Executor (order yaratmagan tomon)

**Qachon:** Status `pending` bo'lganda

**Nima bo'ladi:**
1. Client balansidan pul yechiladi
2. Pul escrow (xavfsiz saqlash)ga qo'yiladi
3. Status `accepted` ga o'zgaradi
4. `accepted_at` vaqt belgilanadi
5. Transaction record yaratiladi

**Request Body:** Bo'sh

---

### 5. Ishni Topshirish (Deliver)

**Endpoint:** `POST /api/orders/{order_id}/deliver`

**Kim bajara oladi:** Freelancer

**Qachon:** Status `accepted` yoki `in_progress` bo'lganda

**Nima bo'ladi:**
1. Status `delivered` ga o'zgaradi
2. `delivered_at` vaqt belgilanadi
3. Endi mijoz tekshirishi va tasdiqlashi kerak

**Request Body:** Bo'sh

---

### 6. Ishni Tasdiqlash va To'lovni Yuborish (Complete)

**Endpoint:** `POST /api/orders/{order_id}/complete`

**Kim bajara oladi:** Client (mijoz)

**Qachon:** Status `accepted`, `in_progress` yoki `delivered` bo'lganda

**Nima bo'ladi:**
1. Status `completed` ga o'zgaradi
2. Status avtomatik `released` ga o'tadi
3. Escrowdagi pul freelancer balansiga o'tkaziladi
4. `completed_at` va `released_at` vaqtlar belgilanadi
5. Transaction record yaratiladi

**Request Body:** Bo'sh

---

### 7. Orderni Bekor Qilish - Pending uchun (Cancel)

**Endpoint:** `POST /api/orders/{order_id}/cancel`

**Kim bajara oladi:** Client yoki Freelancer

**Qachon:** FAQAT status `pending` bo'lganda

**Nima bo'ladi:**
1. Status `cancelled` ga o'zgaradi
2. Pul yechilmagan edi, shuning uchun refund yo'q
3. `cancelled_at` vaqt belgilanadi

**Request Body:**
```json
{
  "reason": "Vaqtim yo'q" // ixtiyoriy
}
```

---

### 8. Bekor Qilish So'rovi Yuborish (Request Cancellation)

**Endpoint:** `POST /api/orders/{order_id}/request-cancellation`

**Kim bajara oladi:** Client yoki Freelancer

**Qachon:** Status `accepted` yoki `in_progress` bo'lganda

**Nima bo'ladi:**
1. Status `cancellation_requested` ga o'zgaradi
2. Ikkinchi tomon tasdiqlashi yoki rad etishi kerak
3. `cancellation_requested_at` vaqt belgilanadi

**Request Body:**
```json
{
  "reason": "Client boshqa freelancer topdi" // ixtiyoriy
}
```

**Muhim:** Accepted/in_progress holatdagi orderlarni bir tomon o'zi bekor qila olmaydi. Ikkinchi tomon roziligisiz bekor qilish mumkin emas!

---

### 9. Bekor Qilish So'rovini Tasdiqlash (Approve Cancellation)

**Endpoint:** `POST /api/orders/{order_id}/approve-cancellation`

**Kim bajara oladi:** So'rov yuborMAGAN tomon

**Qachon:** Status `cancellation_requested` bo'lganda

**Nima bo'ladi:**
1. Status `refunded` ga o'zgaradi
2. Escrowdagi pul client balansiga qaytariladi
3. `cancelled_at` vaqt belgilanadi
4. Refund transaction yaratiladi

**Request Body:** Bo'sh

---

### 10. Bekor Qilish So'rovini Rad Etish (Reject Cancellation)

**Endpoint:** `POST /api/orders/{order_id}/reject-cancellation`

**Kim bajara oladi:** So'rov yuborMAGAN tomon

**Qachon:** Status `cancellation_requested` bo'lganda

**Nima bo'ladi:**
1. Status `accepted` ga qaytadi
2. Order davom etadi
3. Cancellation ma'lumotlari tozalanadi

**Request Body:** Bo'sh

---

### 11. Qayta ishlashga topshirish (Revision System)

**Endpoint:** `POST /api/orders/{order_id}/request-revision`

**Kim bajara oladi:** Mijoz

**Qachon:** Agar ish yoqmasa, mijoz biror sabab bilan ishni qayta ishlashga topshiradi

**Nima bo'ladi:**
1. Status `in_progress` ga o'zgaradi
2. `revision_count` qayta ishlashga yuborilganlar soni saqlanadi
3. `revision_reason` - client nimani o'zgartirish kerakligini yozadi
4. `revision_requested_at` - qachon so'ralgani
5. `revision_requested_by` - kim so'ragani


**Request Body:**
```json
{
  "reason": "Ish to'liq yakunlanmagan" // majburiy, min 10 ta belgi
}
```

---

### 12. Nizo Ochish (Raise Dispute)

**Endpoint:** `POST /api/orders/{order_id}/dispute`

**Kim bajara oladi:** Client yoki Freelancer

**Qachon:** Status `accepted`, `in_progress`, `delivered` yoki `cancellation_requested` bo'lganda

**Nima bo'ladi:**
1. Status `dispute` ga o'zgaradi
2. Admin ko'rib chiqadi
3. `dispute_raised_at` vaqt belgilanadi

**Request Body:**
```json
{
  "reason": "Freelancer ishni to'liq bajarmadi va aloqaga chiqmayapti" // majburiy, min 10 ta belgi
}
```

**Qachon kerak:**
- Ikkinchi tomon cancellation so'rovini rad etsa
- Ish sifatsiz bajarilgan bo'lsa
- Freelancer ishni topshirmasa
- Mijoz to'lovni berimsiz sabab bilan ushlab tursa

---

## Order Ma'lumotlari (Response Object)

Har bir order quyidagi ma'lumotlarni qaytaradi:

```javascript
{
  // Asosiy ma'lumotlar
  id: 1,
  conversation_id: 123,
  message_id: 456,
  
  // Ishtirokchilar
  creator: { /* User object */ },      // Order yaratgan
  executor: { /* User object */ },     // Qabul qilishi kerak bo'lgan
  client: { /* User object */ },       // To'lovchi (mijoz)
  freelancer: { /* User object */ },   // Ish bajaruvchi
  
  // Order tafsilotlari
  title: "Website Development",
  description: "Create a responsive...",
  amount: "500.00",
  deadline: "2025-12-31T23:59:59.000000Z",
  status: "accepted",
  status_color: "blue",
  is_active: true,
  
  // Vaqtlar
  accepted_at: "2025-10-14T10:00:00.000000Z",
  completed_at: null,
  delivered_at: null,
  cancelled_at: null,
  released_at: null,
  dispute_raised_at: null,
  cancellation_requested_at: null,
  created_at: "2025-10-14T09:00:00.000000Z",
  updated_at: "2025-10-14T10:00:00.000000Z",
  
  // Cancellation ma'lumotlari
  cancellation_reason: "Vaqtim yo'q",
  cancelled_by: { /* User object */ },
  cancellation_requested_by: { /* User object */ },
  
  // Dispute ma'lumotlari
  dispute_reason: "Ish sifatsiz bajarildi",
  dispute_raised_by: { /* User object */ },
  
  // Permissionlar (joriy user uchun)
  can_accept: false,
  can_deliver: true,
  can_complete: false,
  can_cancel: false,
  can_request_cancellation: true,
  can_approve_cancellation: false,
  can_reject_cancellation: false,
  can_dispute: true,
  can_request_revision: false,
  
  // Rollar (joriy user uchun)
  is_creator: false,
  is_executor: true,
  is_client: false,
  is_freelancer: true,
  
  // UI uchun helper maydonlar
  waiting_for_my_approval: false,  // Mening tasdigim kutilmoqdami
  i_requested_cancellation: false  // Men so'rov yuborganmanmi
  has_revisions: false,            // Qayta yuborish mavjudmi
}
```

---

## Order Lifecycle (Hayot Sikli)

### Normal Flow (Muammosiz holat):

```
1. PENDING
   ↓ (executor accepts)
2. ACCEPTED (pul escrow qilindi)
   ↓ (freelancer delivers)
3. DELIVERED
   ↓ (client completes)
4. COMPLETED → RELEASED (to'lov freelancerga o'tdi)
```

### Pending holatda bekor qilish:

```
PENDING
   ↓ (biror tomon cancels)
CANCELLED
```

### Accepted holatda bekor qilish:

```
ACCEPTED/IN_PROGRESS
   ↓ (bir tomon request cancellation)
CANCELLATION_REQUESTED
   ↓ (ikkinchi tomon approves)
REFUNDED (pul qaytarildi)

   YOKi

CANCELLATION_REQUESTED
   ↓ (ikkinchi tomon rejects)
ACCEPTED (davom etadi)
```

### Nizo holati:

```
ACCEPTED/IN_PROGRESS/DELIVERED/CANCELLATION_REQUESTED
   ↓ (biror tomon dispute ochadi)
DISPUTE (admin qaror qiladi)
```

---

## UI uchun Ko'rsatmalar

### Pending holatda:

**Agar creator bo'lsangiz:**
- "Waiting for acceptance" xabari
- "Cancel Order" tugmasi

**Agar executor bo'lsangiz:**
- "Accept Order" tugmasi
- "Decline Order" tugmasi (cancel)

### Accepted holatda:

**Agar freelancer bo'lsangiz:**
- "Deliver Work" tugmasi
- "Request Cancellation" tugmasi
- "Open Dispute" tugmasi

**Agar client bo'lsangiz:**
- "Complete Order" tugmasi (agar delivered bo'lsa)
- "Request Cancellation" tugmasi
- "Open Dispute" tugmasi

### Cancellation Requested holatda:

**Agar siz so'rov yubormagan bo'lsangiz:**
- "Approve Cancellation" tugmasi
- "Reject Cancellation" tugmasi
- Sabab ko'rsatilgan bo'lsa, uni ko'rsating

**Agar siz so'rov yuborgan bo'lsangiz:**
- "Waiting for approval..." xabari
- Sabab ko'rsating

---

## Permission Tekshirish

Har doim `can_*` maydonlaridan foydalaning:

```javascript
// Vue.js misoli
<button v-if="order.can_accept" @click="acceptOrder">
  Accept Order
</button>

<button v-if="order.can_deliver" @click="deliverWork">
  Deliver Work
</button>

<button v-if="order.can_complete" @click="completeOrder">
  Complete & Release Payment
</button>

<button v-if="order.can_request_cancellation" @click="requestCancel">
  Request Cancellation
</button>

<div v-if="order.waiting_for_my_approval">
  <button @click="approveCancellation">Approve</button>
  <button @click="rejectCancellation">Reject</button>
</div>

<button v-if="order.can_dispute" @click="openDispute">
  Open Dispute
</button>
```

---

## Status Color Mapping

UI da status ranglarini ko'rsatish uchun:

```javascript
const statusColors = {
  'pending': 'yellow',           // Kutilmoqda
  'accepted': 'blue',            // Qabul qilindi
  'in_progress': 'blue',         // Jarayonda
  'completed': 'purple',         // Bajarildi
  'delivered': 'purple',         // Topshirildi
  'released': 'green',           // To'lov o'tkazildi
  'dispute': 'orange',           // Nizo
  'cancellation_requested': 'amber', // Bekor qilish so'rovi
  'cancelled': 'red',            // Bekor qilindi
  'refunded': 'red'              // Qaytarildi
}
```

---

## Muhim Eslatmalar

1. **Escrow tizimi:** Pul mijozdan yechiladi va xavfsiz saqlanadi. Faqat ish tugallanganda freelancerga o'tadi.

2. **Ikki tomonlama rozlik:** Accepted holatdagi orderlarni bekor qilish uchun ikkala tomon ham rozi bo'lishi kerak.

3. **Dispute tizimi:** Agar kelishmovchilik bo'lsa, dispute ochish mumkin. Admin ko'rib chiqadi.

4. **Permission tekshirish:** Har doim `can_*` maydonlaridan foydalaning, manual tekshirish xato berishi mumkin.

5. **Order yaratish:** `is_client_order` parametrini to'g'ri yuboring:
   - Mijoz order yaratyaptimi? → `true`
   - Freelancer order yaratyaptimi? → `false`

6. **Vaqt zonasi:** Barcha sanalar UTC formatida. Frontendda mahalliy vaqtga o'tkazing.

---

## Xatolarni Boshqarish

API validatsiya xatolarini rus tilida qaytaradi:

```json
{
  "message": "Validation Error",
  "errors": {
    "title": ["Название заказа обязательно."],
    "amount": ["Сумма заказа должна быть не менее 0.01."]
  }
}
```

403/422 xatolarida:
```json
{
  "message": "You cannot accept this order"
}
```

---

## Testing Scenariysi

### 1. Mijoz order yaratadi:
```javascript
POST /api/conversations/1/orders
{
  "title": "Logo Design",
  "description": "Need a modern logo",
  "amount": 100,
  "is_client_order": true
}
```

### 2. Freelancer qabul qiladi:
```javascript
POST /api/orders/1/accept
```

### 3. Freelancer topshiradi:
```javascript
POST /api/orders/1/deliver
```

### 4. Mijoz tasdiqlaydi:
```javascript
POST /api/orders/1/complete
```

### Cancellation scenariysi:
```javascript
// Bir tomon so'rov yuboradi
POST /api/orders/1/request-cancellation
{ "reason": "Changed my mind" }

// Ikkinchi tomon tasdiqlaydi
POST /api/orders/1/approve-cancellation
```