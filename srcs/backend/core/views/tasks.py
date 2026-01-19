from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from core.models import Circle, Task, ChecklistItem
from core.serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        # Filter by circle_id if provided
        queryset = Task.objects.all()
        circle_id = self.request.query_params.get('circle_id')
        if circle_id:
            queryset = queryset.filter(circle_id=circle_id)
        
        # Security: Only show tasks from circles I am a member of
        user_circle_ids = self.request.user.circles.values_list('id', flat=True)
        return queryset.filter(circle__id__in=user_circle_ids)

    def perform_create(self, serializer):
        circle_id = self.request.data.get('circle_id')
        circle = Circle.objects.get(id=circle_id)
        serializer.save(created_by=self.request.user, circle=circle)
        
        # Signal Update
        try:
             channel_layer = get_channel_layer()
             async_to_sync(channel_layer.group_send)(
                 f'chat_{circle.id}',
                 {'type': 'task_update', 'action': 'create'}
             )
             
             # Notify assignee(s)
             if serializer.instance.task_type == 'assignment':
                if serializer.instance.assigned_to:
                     if serializer.instance.assigned_to != self.request.user:
                        assignee_id = serializer.instance.assigned_to.id
                        print(f"DEBUG: Sending assignment notification to {assignee_id}")
                        async_to_sync(channel_layer.group_send)(
                            f'notifications_{assignee_id}',
                            {
                                'type': 'send_notification',
                                'notification': {
                                    'type': 'task_assigned',
                                    'sender': self.request.user.username,
                                    'circle_id': circle.id,
                                    'task_id': serializer.instance.id,
                                    'message': f"Assigned you to task: {serializer.instance.title}"
                                }
                            }
                        )
                else:
                    # Assigned to Everyone - Notify all members except creator
                    print(f"DEBUG: Task assigned to Everyone in circle {circle.id}")
                    for member in circle.members.all():
                        if member.id != self.request.user.id:
                            async_to_sync(channel_layer.group_send)(
                                f'notifications_{member.id}',
                                {
                                    'type': 'send_notification',
                                    'notification': {
                                        'type': 'task_assigned',
                                        'sender': self.request.user.username,
                                        'circle_id': circle.id,
                                        'task_id': serializer.instance.id,
                                        'message': f"Assigned everyone to task: {serializer.instance.title}"
                                    }
                                }
                            )
        except Exception as e:
             print(f"Error sending signal: {e}")

    def perform_destroy(self, instance):
        if instance.created_by != self.request.user:
            raise permissions.PermissionDenied("You can only delete tasks you created.")
        circle_id = instance.circle.id
        instance.delete()
        
        # Signal Update
        try:
             channel_layer = get_channel_layer()
             async_to_sync(channel_layer.group_send)(
                 f'chat_{circle_id}',
                 {'type': 'task_update', 'action': 'delete'}
             )
        except Exception as e:
             print(f"Error sending signal: {e}")

    def perform_update(self, serializer):
        instance = self.get_object()
        # If updating status, check if user is assigned
        if serializer.validated_data.get('status'):
            if instance.task_type == 'assignment' and instance.assigned_to and instance.assigned_to != self.request.user:
                raise permissions.PermissionDenied("Only the assigned user can update the status of this task.")
        serializer.save()
        
        # Signal Update
        try:
             channel_layer = get_channel_layer()
             async_to_sync(channel_layer.group_send)(
                 f'chat_{instance.circle.id}',
                 {'type': 'task_update', 'action': 'update'}
             )
        except Exception as e:
             print(f"Error sending signal: {e}")

    @action(detail=True, methods=['post'])
    def toggle_check(self, request, pk=None):
        item_id = request.data.get('item_id')
        try:
            item = ChecklistItem.objects.get(id=item_id, task_id=pk)
            item.is_checked = not item.is_checked
            item.save()
            
            # Signal Update
            try:
                 channel_layer = get_channel_layer()
                 async_to_sync(channel_layer.group_send)(
                     f'chat_{item.task.circle.id}',
                     {'type': 'task_update', 'action': 'update'}
                 )
            except Exception as e:
                 print(f"Error sending signal: {e}")
            
            return Response({'status': 'toggled', 'is_checked': item.is_checked})
        except ChecklistItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
