from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Circle, UserProfile, Task, Message, ChecklistItem, DirectMessage

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'is_online']

    def get_avatar(self, obj):
        try:
            if hasattr(obj, 'profile') and obj.profile.avatar:
                return obj.profile.avatar.url
        except:
            pass
        return None

    def get_is_online(self, obj):
        try:
            if hasattr(obj, 'profile'):
                return obj.profile.is_online
        except:
            pass
        return False

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ['id', 'content', 'is_checked']

class TaskSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assignees = UserSerializer(many=True, read_only=True)
    assignee_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='assignees', write_only=True, required=False, many=True
    )
    checklist_items = ChecklistItemSerializer(many=True, required=False)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'task_type', 'created_by', 'assignees', 'assignee_ids', 'created_at', 'circle', 'checklist_items']
        read_only_fields = ['created_by', 'circle']

    def create(self, validated_data):
        checklist_data = validated_data.pop('checklist_items', [])
        assignees = validated_data.pop('assignees', [])
        task = Task.objects.create(**validated_data)
        if assignees:
            task.assignees.set(assignees)
        for item_data in checklist_data:
            ChecklistItem.objects.create(task=task, **item_data)
        return task

    def update(self, instance, validated_data):
        checklist_data = validated_data.pop('checklist_items', None)
        assignees = validated_data.pop('assignees', None)
        
        # Update Task fields
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.status = validated_data.get('status', instance.status)
        instance.task_type = validated_data.get('task_type', instance.task_type)
        instance.save()
        
        if assignees is not None:
            instance.assignees.set(assignees)

        # Handle Checklist Items if provided
        if checklist_data is not None:
            existing_items = {item.id: item for item in instance.checklist_items.all()}
            incoming_item_ids = []

            for item_data in checklist_data:
                item_id = item_data.get('id')
                if item_id and item_id in existing_items:
                    # Update existing item
                    item = existing_items[item_id]
                    item.content = item_data.get('content', item.content)
                    item.is_checked = item_data.get('is_checked', item.is_checked)
                    item.save()
                    incoming_item_ids.append(item_id)
                else:
                    # Create new item
                    new_item = ChecklistItem.objects.create(task=instance, **item_data)
                    incoming_item_ids.append(new_item.id)
            
            # Delete items that are not in the incoming list
            for item_id, item in existing_items.items():
                if item_id not in incoming_item_ids:
                    item.delete()

        return instance

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
    admin = UserSerializer(read_only=True)
    
    class Meta:
        model = Circle
        fields = ['id', 'name', 'description', 'created_at', 'member_count', 'invite_code', 'members', 'admin']
        read_only_fields = ['invite_code', 'admin']
        
    def get_member_count(self, obj):
        return obj.members.count()

class CircleDetailSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    admin = UserSerializer(read_only=True)
    
    class Meta:
        model = Circle
        fields = ['id', 'name', 'description', 'created_at', 'members', 'invite_code', 'admin']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'timestamp', 'sender', 'circle']


class DirectMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = DirectMessage
        fields = ['id', 'content', 'timestamp', 'sender', 'receiver', 'is_read']
