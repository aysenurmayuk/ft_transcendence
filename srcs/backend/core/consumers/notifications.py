import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework.authtoken.models import Token

class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications"""
    
    async def connect(self):
        # Extract token from query string
        try:
            query_string = self.scope['query_string'].decode()
            if 'token=' in query_string:
                token_key = query_string.split('token=')[1].split('&')[0]
                self.scope['user'] = await self.get_user_from_token(token_key)
        except Exception as e:
            print(f"DEBUG: Error processing token: {e}")

        if not self.scope['user'].is_authenticated:
            print(f"DEBUG: Notification connection rejected - Unauthenticated")
            await self.close()
            return
        
        self.user_id = self.scope['user'].id
        self.notification_group_name = f'notifications_{self.user_id}'
        
        print(f"DEBUG: User {self.user_id} connecting to notifications")
        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"DEBUG: User {self.user_id} connected to notifications channel: {self.notification_group_name}")

    async def disconnect(self, close_code):
        # Leave notification group
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
            print(f"DEBUG: User {getattr(self, 'user_id', 'Unknown')} disconnected from notifications")

    @database_sync_to_async
    def get_user_from_token(self, token_key):
        try:
            return Token.objects.get(key=token_key).user
        except Token.DoesNotExist:
            from django.contrib.auth.models import AnonymousUser
            return AnonymousUser()

    async def receive(self, text_data):
        """Handle incoming notification"""
        try:
            data = json.loads(text_data)
            
            # Process notification here if needed
            await self.send(text_data=json.dumps({
                'status': 'received'
            }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON'
            }))

    async def send_notification(self, event):
        """Send notification to user"""
        print(f"DEBUG: Sending notification to user {self.user_id}: {event}")
        notification = event.get('notification', event)
        # If the event itself contains the data we need, use it. 
        # The 'event' dict comes from group_send. 
        # Conventionally, we might pass 'notification' key.
        
        # If event has 'data', use that.
        data_to_send = notification if 'notification' in event else event
        
        # Clean up the event type wrapper if present
        if 'type' in data_to_send and data_to_send['type'] == 'send_notification':
             # It's the wrapper, let's look for payload
             pass

        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': notification
        }))
