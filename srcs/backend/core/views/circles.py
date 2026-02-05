from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from core.models import Circle
from core.serializers import CircleSerializer, CircleDetailSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class CircleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Circle.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CircleDetailSerializer
        return CircleSerializer

    def perform_create(self, serializer):
        circle = serializer.save(admin=self.request.user)
        circle.members.add(self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.admin != self.request.user:
             raise permissions.PermissionDenied("Only admin can update circle settings.")
        serializer.save()

    def get_queryset(self):
        if self.action == 'my_circles':
             return self.request.user.circles.all()
        return Circle.objects.all()

    @action(detail=False, methods=['post'])
    def join_by_code(self, request):
        code = request.data.get('invite_code')
        try:
            circle = Circle.objects.get(invite_code=code)
            if request.user in circle.members.all():
                return Response({'status': 'already member', 'circle_id': circle.id})
            
            # Notify existing members before adding (or after? usually after to include correct count/list logic elsewhere, but notification is "New member joined")
            # Let's add first, then notify others.
            circle.members.add(request.user)
            
            # Send Notification
            channel_layer = get_channel_layer()
            for member in circle.members.all():
                if member.id != request.user.id:
                    async_to_sync(channel_layer.group_send)(
                        f'notifications_{member.id}',
                        {
                            'type': 'send_notification',
                            'notification': {
                                'type': 'circle_message', # Reusing type or creating 'member_joined' if frontend handles it
                                'sender': request.user.username,
                                'circle_id': circle.id,
                                'task_id': None,
                                'message': f"{request.user.username} joined the circle {circle.name}"
                            }
                        }
                    )
            
            return Response({'status': 'joined', 'circle': CircleSerializer(circle).data})
        except Circle.DoesNotExist:
            return Response({'error': 'Invalid code'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        circle = self.get_object()
        if request.user in circle.members.all():
             return Response({'status': 'already member'})
             
        circle.members.add(request.user)
        
        # Send Notification
        channel_layer = get_channel_layer()
        for member in circle.members.all():
            if member.id != request.user.id:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{member.id}',
                    {
                        'type': 'send_notification',
                        'notification': {
                            'type': 'circle_message',
                            'sender': request.user.username,
                            'circle_id': circle.id,
                            'task_id': None,
                            'message': f"{request.user.username} joined the circle {circle.name}"
                        }
                    }
                )
        
        return Response({'status': 'joined circle'})

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        circle = self.get_object()
        circle.members.remove(request.user)
        return Response({'status': 'left circle'})
        
    @action(detail=True, methods=['post'])
    def kick_member(self, request, pk=None):
        circle = self.get_object()
        member_id = request.data.get('member_id')
        
        if circle.admin != request.user:
             return Response({'error': 'Only admin can kick members'}, status=status.HTTP_403_FORBIDDEN)
             
        try:
            member = User.objects.get(id=member_id)
            if member == circle.admin:
                return Response({'error': 'Cannot kick admin'}, status=status.HTTP_400_BAD_REQUEST)
                
            circle.members.remove(member)
            return Response({'status': 'member kicked'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def my_circles(self, request):
        circles = request.user.circles.all()
        serializer = self.get_serializer(circles, many=True)
        return Response(serializer.data)
