from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/chat/dm/(?P<user_id>\w+)/$', consumers.DMConsumer.as_asgi()),
    re_path(r'ws/sudoku/(?P<circle_id>\w+)/$', consumers.SudokuConsumer.as_asgi()),
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    path('ws/online/', consumers.OnlineStatusConsumer.as_asgi()),
]
