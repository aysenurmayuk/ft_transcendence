from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CircleViewSet, TaskViewSet, RegisterView, LoginView, MessageViewSet, ProfileView, DirectMessageViewSet, GoogleLoginCallback

router = DefaultRouter()
router.register(r'circles', CircleViewSet)
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'direct-messages', DirectMessageViewSet, basename='direct-message')
router.register(r'profile', ProfileView, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/google/callback/', GoogleLoginCallback.as_view(), name='google-callback'),
]
