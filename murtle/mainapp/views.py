from django.shortcuts import render
from django.conf import settings
import pyrebase

from users.forms import UserRegisterForm


def home(request):
    return render(request, 'home.html')


def support(request):
    return render(request, 'support.html')
