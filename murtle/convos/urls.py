from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.conversation_list, name='conversation_list'),
    path('conversations/<int:pk>/', views.conversation_detail, name='conversation_detail'),
    path('conversations/<int:pk>/register/', views.conversation_register, name='conversation_register'),
    path('conversations/new/', views.conversation_create, name='conversation_create'),
    path('conversations/<int:pk>/delete/', views.conversation_delete, name='conversation_delete'),
    path('conversations/<int:pk>/edit/', views.conversation_edit, name='conversation_edit'),
    path('conversations/<int:pk>/registrations/', views.conversation_registrations, name='conversation_registrations'),
    path('registrations/<int:pk>/delete/', views.registration_delete, name='registration_delete'),
]
