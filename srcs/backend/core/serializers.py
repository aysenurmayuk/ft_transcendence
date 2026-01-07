from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Circle, UserProfile, Task, Message, ChecklistItem

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar']

    def get_avatar(self, obj):
        try:
            if hasattr(obj, 'userprofile') and obj.userprofile.avatar:
                return obj.userprofile.avatar.url
        except:
            pass
        return None

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ['id', 'content', 'is_checked']

class TaskSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='assigned_to', write_only=True, required=False, allow_null=True
    )
    checklist_items = ChecklistItemSerializer(many=True, required=False)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'task_type', 'created_by', 'assigned_to', 'assigned_to_id', 'created_at', 'circle', 'checklist_items']
        read_only_fields = ['created_by', 'circle']

    def create(self, validated_data):
        checklist_data = validated_data.pop('checklist_items', [])
        task = Task.objects.create(**validated_data)
        for item_data in checklist_data:
            ChecklistItem.objects.create(task=task, **item_data)
        return task

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        items = representation.get('checklist_items', [])
        if items:
            # Sort by is_checked (False < True) and then by id
            sorted_items = sorted(items, key=lambda x: (x['is_checked'], x['id']))
            representation['checklist_items'] = sorted_items
        return representation

class CircleSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    members = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Circle
        fields = ['id', 'name', 'description', 'created_at', 'member_count', 'invite_code', 'members']
        read_only_fields = ['invite_code']
        
    def get_member_count(self, obj):
        return obj.members.count()

class CircleDetailSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Circle
        fields = ['id', 'name', 'description', 'created_at', 'members', 'invite_code']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'timestamp', 'sender', 'circle']

