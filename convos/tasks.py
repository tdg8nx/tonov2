from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from .models import Conversation, Registration

@shared_task
def send_reminder_emails():
    now = timezone.now()
    upcoming_conversations = Conversation.objects.filter(
        start_time__lte=now + timezone.timedelta(hours=2),
        start_time__gt=now
    )
    for conversation in upcoming_conversations:
        registrations = Registration.objects.filter(conversation=conversation)
        for registration in registrations:
            send_mail(
                'Reminder: Upcoming Conversation',
                f'This is a reminder that the conversation "{conversation.title}" is starting at {conversation.start_time}.',
                'from@example.com',
                [registration.user.email],
            )
