import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from core.models import UserProfile
from rest_framework.authtoken.models import Token

class OnlineStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        # We expect user to be authenticated via middleware or standard session if possible
        # Since we use token auth in other consumers, let's try to extract token if user is anonymous
        if self.user.is_anonymous:
            # Try extracting token from query
            try:
                query_string = self.scope['query_string'].decode()
                print(f"DEBUG: Presence connection attempt. Query: {query_string}")
                if 'token=' in query_string:
                    token_key = query_string.split('token=')[1].split('&')[0]
                    self.user = await self.get_user_from_token(token_key)
                    print(f"DEBUG: Presence token found user: {self.user}")
            except Exception as e:
                print(f"DEBUG: Presence auth error: {e}")
                pass

        if not self.user or self.user.is_anonymous:
            print("DEBUG: Presence rejected - Anonymous")
            await self.close()
            return
            
        self.room_group_name = 'global_presence'
        print(f"DEBUG: User {self.user} joining global_presence")

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        
        # Mark as online
        await self.set_online_status(True)
        
        # Broadcast online status
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_status',
                'user_id': self.user.id,
                'status': 'online'
            }
        )
        
        # Send current online users list to the new connection
        online_users = await self.get_online_users()
        await self.send(text_data=json.dumps({
            'type': 'initial_state',
            'online_users': online_users
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and not self.user.is_anonymous:
            # Mark as offline
            await self.set_online_status(False)
            
            # Broadcast offline status
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status',
                    'user_id': self.user.id,
                    'status': 'offline'
                }
            )

            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def user_status(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user_id': event['user_id'],
            'status': event['status']
        }))

    @database_sync_to_async
    def get_user_from_token(self, token_key):
        try:
            return Token.objects.get(key=token_key).user
        except Token.DoesNotExist:
            return None

    @database_sync_to_async
    def set_online_status(self, is_online):
        try:
            # Safely get or create profile to avoid RelatedObjectDoesNotExist errors
            profile, created = UserProfile.objects.get_or_create(user=self.user)
            profile.is_online = is_online
            profile.save()
            print(f"DEBUG: Set {self.user.username} online={is_online}")
        except Exception as e:
            print(f"DEBUG: Error setting online status: {e}")

    @database_sync_to_async
    def get_online_users(self):
        return list(UserProfile.objects.filter(is_online=True).values_list('user_id', flat=True))
