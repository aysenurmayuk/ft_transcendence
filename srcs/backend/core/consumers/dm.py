import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from core.models import DirectMessage
from rest_framework.authtoken.models import Token

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
