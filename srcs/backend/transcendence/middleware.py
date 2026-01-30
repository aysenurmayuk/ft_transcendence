from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.db import close_old_connections
from urllib.parse import parse_qs

@database_sync_to_async
def get_user(token_key):
    try:
        token = Token.objects.get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        close_old_connections()
        try:
            query_string = scope.get('query_string', b'').decode()
            query_params = parse_qs(query_string)
            token_key = query_params.get('token', [None])[0]
            
            if token_key:
                user = await get_user(token_key)
                scope['user'] = user
            else:
                # If no token in query params, user might be authenticated by AuthMiddlewareStack (session)
                # But if we rely solely on token for React, we can check if user is already set
                pass
                
        except Exception as e:
            # print(f"Middleware Error: {e}")
            pass
            
        return await super().__call__(scope, receive, send)
