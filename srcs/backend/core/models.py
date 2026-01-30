import uuid
from django.db import models
from django.contrib.auth.models import User

class Circle(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    admin = models.ForeignKey(User, related_name='managed_circles', on_delete=models.CASCADE, null=True, blank=True)
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
    assignees = models.ManyToManyField(User, related_name='assigned_tasks', blank=True)
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
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_online = models.BooleanField(default=False)
    kvkk_accepted = models.BooleanField(default=False)
    

    def __str__(self):
        return self.user.username

class DirectMessage(models.Model):
    sender = models.ForeignKey(User, related_name='sent_direct_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_direct_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

class SudokuGame(models.Model):
    circle = models.OneToOneField(Circle, related_name='sudoku_game', on_delete=models.CASCADE)
    board = models.JSONField(default=list)  # Current 9x9 grid
    initial_board = models.JSONField(default=list)  # Initial 9x9 grid
    solution = models.JSONField(default=list) # Solution grid
    difficulty = models.CharField(max_length=20, default='easy')
    is_solved = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Sudoku for {self.circle.name}"
