# Loyiha uchun kerakli muhitni yaratish

## 1. REDIS o'rnatish

- Redis ni o'rnatish
```
sudo apt update
sudo apt install redis-server -y
```

- Servisni ishga tushirish
```
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

- Tekshirib ko'rish
```
redis-cli ping
```

## 2. Laravel uchun PHP kengaytmasi o‘rnatish

- PHP kengaytmasini o‘rnatish
```
sudo apt install php-redis
```

- PHP ni qayta ishga tushirish
```
sudo systemctl restart apache2
```

