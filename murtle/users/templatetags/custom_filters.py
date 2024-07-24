# users/templatetags/custom_filters.py
from django import template
from django.forms import BoundField

register = template.Library()


@register.filter(name='add_class')
def add_class(field, css_class):
    if isinstance(field, BoundField):
        return field.as_widget(attrs={"class": css_class})
    return field


@register.filter
def user_display(user):
    if user.first_name and user.last_name:
        return f"{user.first_name} {user.last_name}"
    elif user.email:
        return user.email
    return "Anonymous"
