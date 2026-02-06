from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from core.models import UserProfile
from core.serializers import UserSerializer
from django.shortcuts import redirect
from django.views import View
from django.contrib.auth import login

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
            
        kvkk_accepted = request.data.get('kvkkAccepted')
        if not kvkk_accepted or kvkk_accepted == 'false':
             return Response({'error': 'You must accept the KVKK terms.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        UserProfile.objects.create(user=user, kvkk_accepted=True)

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

class GoogleLoginCallback(View):
    """
    Custom callback view for Google OAuth
    After successful OAuth, redirect to frontend with token
    """
    def get(self, request, *args, **kwargs):
        # User is already authenticated by social-auth pipeline
        user = request.user
        
        if user.is_authenticated:
            # Create or get token for API authentication
            token, created = Token.objects.get_or_create(user=user)
            
            # Redirect to frontend with token
            # Frontend will catch this and save to localStorage
            return redirect(f'/?oauth_token={token.key}&user_id={user.pk}&username={user.username}')
        else:
            return redirect('/?oauth_error=authentication_failed')

