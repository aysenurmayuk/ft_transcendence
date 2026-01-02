from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import generics
from django.contrib.auth.models import User
from .models import Circle, Task, Message, ChecklistItem
from .serializers import CircleSerializer, CircleDetailSerializer, UserSerializer, TaskSerializer, MessageSerializer
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token

class CircleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Circle.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CircleDetailSerializer
        return CircleSerializer

    def perform_create(self, serializer):
        circle = serializer.save()
        circle.members.add(self.request.user)

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
            circle.members.add(request.user)
            return Response({'status': 'joined', 'circle': CircleSerializer(circle).data})
        except Circle.DoesNotExist:
            return Response({'error': 'Invalid code'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        circle = self.get_object()
        circle.members.add(request.user)
        return Response({'status': 'joined circle'})

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        circle = self.get_object()
        circle.members.remove(request.user)
        return Response({'status': 'left circle'})
    
    @action(detail=False, methods=['get'])
    def my_circles(self, request):
        circles = request.user.circles.all()
        serializer = self.get_serializer(circles, many=True)
        return Response(serializer.data)

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
        if self.request.user not in circle.members.all():
            raise permissions.PermissionDenied("You are not a member of this circle")
        serializer.save(created_by=self.request.user, circle=circle)

    def perform_destroy(self, instance):
        if instance.created_by != self.request.user:
            raise permissions.PermissionDenied("You can only delete tasks you created.")
        instance.delete()

    def perform_update(self, serializer):
        instance = self.get_object()
        # If completing an assignment, check if user is assigned
        if serializer.validated_data.get('status') == 'done':
            if instance.task_type == 'assignment' and instance.assigned_to and instance.assigned_to != self.request.user:
                raise permissions.PermissionDenied("Only the assigned user can complete this task.")
        serializer.save()

    @action(detail=True, methods=['post'])
    def toggle_check(self, request, pk=None):
        item_id = request.data.get('item_id')
        try:
            item = ChecklistItem.objects.get(id=item_id, task_id=pk)
            item.is_checked = not item.is_checked
            item.save()
            return Response({'status': 'toggled', 'is_checked': item.is_checked})
        except ChecklistItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        
        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.create_user(username=username, email=email, password=password)
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username
        })

class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username
        })

class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        circle_id = self.request.query_params.get('circle_id')
        if not circle_id:
            return Message.objects.none()
        return Message.objects.filter(circle_id=circle_id)

from .models import UserProfile
from rest_framework.parsers import MultiPartParser, FormParser

class ProfileView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # Support file upload

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            # Update User fields
            if 'username' in request.data:
                user.username = request.data['username']
            if 'email' in request.data:
                user.email = request.data['email']
            if 'password' in request.data and request.data['password']:
                user.set_password(request.data['password'])
            user.save()
            
            # Update Profile Avatar
            if 'avatar' in request.FILES:
                profile, created = UserProfile.objects.get_or_create(user=user)
                profile.avatar = request.FILES['avatar']
                profile.save()
                
            return Response(UserSerializer(user).data)
