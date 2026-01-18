from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from core.models import UserProfile
from core.serializers import UserSerializer

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
            if 'remove_avatar' in request.data and request.data['remove_avatar'] == 'true':
                 profile, created = UserProfile.objects.get_or_create(user=user)
                 profile.avatar.delete(save=False)
                 profile.avatar = None
                 profile.save()
            elif 'avatar' in request.FILES:
                profile, created = UserProfile.objects.get_or_create(user=user)
                profile.avatar = request.FILES['avatar']
                profile.save()
                
            return Response(UserSerializer(user).data)
