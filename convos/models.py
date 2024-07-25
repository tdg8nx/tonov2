# Import the custom User model
from django.conf import settings
from django.db import models


class Conversation(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    time = models.TimeField(default="00:00")
    location = models.CharField(max_length=200)

    def __str__(self):
        return self.title


class Registration(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} - {self.conversation.title}'
