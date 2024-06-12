from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import User


class UserRegisterForm(UserCreationForm):
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    first_name = forms.CharField(max_length=30, widget=forms.TextInput(attrs={'class': 'form-control'}))
    last_name = forms.CharField(max_length=30, widget=forms.TextInput(attrs={'class': 'form-control'}))
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    password2 = forms.CharField(label="Confirm Password", widget=forms.PasswordInput(attrs={'class': 'form-control'}))

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password1', 'password2']


class UserLoginForm(AuthenticationForm):
    username = forms.EmailField(label='Email')


class UserProfileForm(forms.ModelForm):
    email = forms.EmailField(required=True)
    date_of_birth = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
        input_formats=['%Y-%m-%d'],
        required=True
    )

    HOME_COUNTRY_CHOICES = [
        ('', 'Select Country'),  # Empty value for default placeholder
        ('US', 'United States'),
        ('CA', 'Canada'),
        ('GB', 'United Kingdom'),
        ('AU', 'Australia'),
        ('ARG', 'Argentina'),
        # Add more countries as needed
    ]

    DESIRED_LANGUAGE_CHOICES = [
        ('', 'Select Language'),  # Empty value for default placeholder
        ('EN', 'English'),
        ('ES', 'Spanish')
    ]

    LANGUAGE_PROFICIENCY_CHOICES = [
        ('', 'Select Proficiency'),  # Empty value for default placeholder
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced')
    ]

    home_country = forms.ChoiceField(
        choices=HOME_COUNTRY_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        required=True
    )

    desired_language = forms.ChoiceField(
        choices=DESIRED_LANGUAGE_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        required=True
    )

    language_proficiency = forms.ChoiceField(
        choices=LANGUAGE_PROFICIENCY_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        required=True
    )

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'gender', 'home_country',
            'desired_language', 'language_proficiency', 'personal_interests', 'date_of_birth'
        ]
