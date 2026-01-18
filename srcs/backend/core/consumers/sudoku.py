import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from core.models import Circle, SudokuGame
from rest_framework.authtoken.models import Token

class SudokuConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.circle_id = self.scope['url_route']['kwargs']['circle_id']
        self.room_group_name = f'sudoku_{self.circle_id}'
        self.user = self.scope.get("user")

        # Basic Auth check (Token auth fallback if anonymous)
        if not self.user or self.user.is_anonymous:
             try:
                query_string = self.scope['query_string'].decode()
                if 'token=' in query_string:
                    token_key = query_string.split('token=')[1].split('&')[0]
                    self.user = await self.get_user_from_token(token_key)
             except:
                 pass
        
        if not self.user or self.user.is_anonymous:
             await self.close()
             return

        # Check membership
        is_member = await self.check_membership(self.user, self.circle_id)
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send current game state
        game_state = await self.get_game_state(self.circle_id)
        if game_state:
             await self.send(text_data=json.dumps({
                'type': 'game_state',
                'board': game_state['board'],
                'initial_board': game_state['initial_board'],
                'solution': game_state['solution'],
                'difficulty': game_state['difficulty'],
                'is_solved': game_state['is_solved']
            }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get('type')

        if event_type == 'update_cell':
            row = data['row']
            col = data['col']
            value = data['value']
            
            # Update DB
            await self.update_game_cell(self.circle_id, row, col, value)
            
            # Broadcast
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'board_update',
                    'row': row,
                    'col': col,
                    'value': value,
                    'sender_id': self.user.id
                }
            )
            
        elif event_type == 'new_game':
            board = data['board']
            initial_board = data['initial_board']
            solution = data.get('solution', [])
            difficulty = data.get('difficulty', 'easy')
            
            await self.create_or_update_game(self.circle_id, board, initial_board, solution, difficulty)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'new_game_started',
                    'board': board,
                    'initial_board': initial_board,
                    'solution': solution,
                    'difficulty': difficulty
                }
            )

    async def board_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def new_game_started(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_game',
            'board': event['board'],
            'initial_board': event['initial_board'],
            'solution': event.get('solution', []),
            'difficulty': event['difficulty']
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
    def get_game_state(self, circle_id):
        try:
            game = SudokuGame.objects.get(circle_id=circle_id)
            return {
                'board': game.board,
                'initial_board': game.initial_board,
                'solution': game.solution,
                'difficulty': game.difficulty,
                'is_solved': game.is_solved
            }
        except SudokuGame.DoesNotExist:
            return None

    @database_sync_to_async
    def update_game_cell(self, circle_id, row, col, value):
        try:
            game = SudokuGame.objects.get(circle_id=circle_id)
            board = game.board
            board[row][col] = value
            game.board = board
            game.save()
        except SudokuGame.DoesNotExist:
            pass

    @database_sync_to_async
    def create_or_update_game(self, circle_id, board, initial_board, solution, difficulty):
        circle = Circle.objects.get(id=circle_id)
        SudokuGame.objects.update_or_create(
            circle=circle,
            defaults={
                'board': board,
                'initial_board': initial_board,
                'solution': solution,
                'difficulty': difficulty,
                'is_solved': False
            }
        )
