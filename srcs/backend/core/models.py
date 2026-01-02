import uuid
from django.db import models
from django.contrib.auth.models import User

class Circle(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    members = models.ManyToManyField(User, related_name='circles')
    invite_code = models.CharField(max_length=10, unique=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name

class Task(models.Model):
    STATUS_CHOICES = (
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    )
    
    TYPE_CHOICES = (
        ('assignment', 'Assignment'),
        ('checklist', 'Checklist'),
        ('note', 'Note'),
    )

    circle = models.ForeignKey(Circle, related_name='tasks', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, related_name='tasks', null=True, blank=True, on_delete=models.SET_NULL)
    created_by = models.ForeignKey(User, related_name='created_tasks', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    task_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='assignment')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ChecklistItem(models.Model):
    task = models.ForeignKey(Task, related_name='checklist_items', on_delete=models.CASCADE)
    content = models.CharField(max_length=255)
    is_checked = models.BooleanField(default=False)

    def __str__(self):
        return self.content

class Message(models.Model):
    circle = models.ForeignKey(Circle, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    def __str__(self):
        return self.user.username
