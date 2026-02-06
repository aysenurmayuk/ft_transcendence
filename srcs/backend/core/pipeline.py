"""
Custom Social Auth Pipeline Functions
"""

def create_user_profile(backend, user, response, *args, **kwargs):
    """
    Create UserProfile for OAuth users if it doesn't exist
    """
    from core.models import UserProfile
    
    if user and not hasattr(user, 'profile'):
        UserProfile.objects.get_or_create(
            user=user,
            defaults={'kvkk_accepted': True}  # OAuth users auto-accept
        )
    
    return {'user': user}
