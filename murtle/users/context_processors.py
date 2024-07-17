from .forms import UserRegisterForm


def registration_form(request):
    return {'register_form': UserRegisterForm()}
