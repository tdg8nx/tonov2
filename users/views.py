from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import login
from django.template.loader import render_to_string
from .forms import UserRegisterForm, UserProfileForm, UserLoginForm
from django.contrib.auth import get_backends



def register(request):
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            backend = get_backends()[0]
            user.backend = f"{backend.__module__}.{backend.__class__.__name__}"

            login(request, user)
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': True})
            return redirect('home')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                form_html = render_to_string('users/register_form.html', {'form': form}, request=request)
                return JsonResponse({'success': False, 'form_html': form_html})
    else:
        form = UserRegisterForm()
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            form_html = render_to_string('users/register_form.html', {'form': form}, request=request)
            return JsonResponse({'form_html': form_html})
    return render(request, 'users/register.html', {'form': form})


def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            # Set the backend for the authenticated user
            backend = get_backends()[0]
            user.backend = f"{backend.__module__}.{backend.__class__.__name__}"

            login(request, user)
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': True})
            return redirect('profile')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                form_html = render_to_string('users/login_form.html', {'form': form}, request=request)
                return JsonResponse({'success': False, 'form_html': form_html})
    else:
        form = UserLoginForm()

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            form_html = render_to_string('users/login_form.html', {'form': form}, request=request)
            return JsonResponse({'form_html': form_html})
    return render(request, 'users/login.html', {'form': form})


@login_required
def profile(request):
    if request.method == 'POST':
        form = UserProfileForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('profile')
    else:
        form = UserProfileForm(instance=request.user)
    return render(request, 'users/profile.html', {'form': form})
