import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Circle, Message, DirectMessage
from rest_framework.authtoken.models import Token

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name

        # Extract token from query string
        try:
            query_string = self.scope['query_string'].decode()
            print(f"DEBUG: WS Connection attempt. Query: {query_string}")
            if 'token=' not in query_string:
                print("DEBUG: No token in query string")
                await self.close()
                return
            token_key = query_string.split('token=')[1].split('&')[0]
            print(f"DEBUG: Extracted token: {token_key}")
            self.user = await self.get_user_from_token(token_key)
            print(f"DEBUG: User found: {self.user}")
        except Exception as e:
            print(f"DEBUG: Error extracting token: {e}")
            await self.close()
            return

        if not self.user:
            print("DEBUG: User authentication failed")
            await self.close()
            return
            
        # Check membership
        is_member = await self.check_membership(self.user, self.room_name)
        if not is_member:
            print(f"DEBUG: User {self.user} is not member of circle {self.room_name}")
            await self.close()
            return

        # Join room group
        try:
            print(f"DEBUG: Adding to group {self.room_group_name}")
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            print("DEBUG: Added to group successfully")
        except Exception as e:
            print(f"DEBUG: Error adding to group (Redis error?): {e}")
            await self.close()
            return

        print("DEBUG: Accepting connection")
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']

        # Save to DB
        await self.save_message(self.user, message, self.room_name)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_username': self.user.username,
                'sender_id': self.user.id
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        sender_username = event['sender_username']
        sender_id = event['sender_id']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message,
            'sender': {'username': sender_username, 'id': sender_id}
        }))

    async def task_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'task_update',
            'action': event['action']
        }))

    @database_sync_to_async
    def get_user_from_token(self, token_key):
        try:
            return Token.objects.get(key=token_key).user
        except Token.DoesNotExist:
            return None

    @database_sync_to_async
    def check_membership(self, user, circle_id):
        try:
            circle = Circle.objects.get(id=circle_id)
            return user in circle.members.all()
        except Circle.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, user, content, circle_id):
        circle = Circle.objects.get(id=circle_id)
        Message.objects.create(sender=user, content=content, circle=circle)

class DMConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.target_user_id = int(self.scope['url_route']['kwargs']['user_id'])
        
        # Extract token from query string
        try:
            query_string = self.scope['query_string'].decode()
            if 'token=' not in query_string:
                await self.close()
                return
            token_key = query_string.split('token=')[1].split('&')[0]
            self.user = await self.get_user_from_token(token_key)
        except Exception as e:
            await self.close()
            return

        if not self.user:
            await self.close()
            return

        # Ensure consistent room name for both users (order by ID)
        users = sorted([self.user.id, self.target_user_id])
        self.room_name = f"dm_{users[0]}_{users[1]}"
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']

        # Save to DB
        await self.save_message(self.user, message, self.target_user_id)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_username': self.user.username,
                'sender_id': self.user.id
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        sender_username = event['sender_username']
        sender_id = event['sender_id']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message,
            'sender': {'username': sender_username, 'id': sender_id}
        }))

    @database_sync_to_async
    def get_user_from_token(self, token_key):
        try:
            return Token.objects.get(key=token_key).user
        except Token.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, user, content, target_user_id):
        receiver = User.objects.get(id=target_user_id)
        DirectMessage.objects.create(sender=user, content=content, receiver=receiver)

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
        from .models import UserProfile
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
        from .models import UserProfile
        return list(UserProfile.objects.filter(is_online=True).values_list('user_id', flat=True))
