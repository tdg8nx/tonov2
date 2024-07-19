from django import forms
from .models import Conversation

class DateInput(forms.DateInput):
    input_type = 'date'

class TimeInput(forms.TimeInput):
    input_type = 'time'

class ConversationForm(forms.ModelForm):
    class Meta:
        model = Conversation
        fields = ['title', 'description', 'date', 'time', 'location']
        widgets = {
            'date': DateInput(),
            'time': TimeInput(),
        }
