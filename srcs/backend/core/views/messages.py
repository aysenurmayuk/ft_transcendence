from rest_framework import viewsets, permissions
from django.db.models import Q
from core.models import Message, DirectMessage
from core.serializers import MessageSerializer, DirectMessageSerializer

class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        circle_id = self.request.query_params.get('circle_id')
        if not circle_id:
            return Message.objects.none()
        return Message.objects.filter(circle_id=circle_id)

class DirectMessageViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DirectMessageSerializer

    def get_queryset(self):
        target_id = self.request.query_params.get('target_id')
        if not target_id:
            return DirectMessage.objects.none()
        
        user = self.request.user
        return DirectMessage.objects.filter(
            (Q(sender=user) & Q(receiver_id=target_id)) |
            (Q(sender_id=target_id) & Q(receiver=user))
        )
