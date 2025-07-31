from fastapi import APIRouter
from app.api.v1 import auth, users, forum, payments, admin, withdraw

api_router = APIRouter()
# api_router.include_router(auth.router, prefix='/auth', tags=['auth'])
# api_router.include_router(users.router, prefix='/users', tags=['users'])
# api_router.include_router(forum.router, prefix='/forum', tags=['forum'])
# api_router.include_router(payments.router, prefix='/payments', tags=['payments'])
# api_router.include_router(admin.router, prefix='/admin', tags=['admin'])
# api_router.include_router(withdraw.router, prefix='/withdraw', tags=['withdraw'])
