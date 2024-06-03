from django.shortcuts import render
from django.conf import settings
import pyrebase

firebase = pyrebase.initialize_app(settings.FIREBASE_CONFIG)
authe = firebase.auth()
database = firebase.database()


def home(request):
    user_name = database.child("Data").child("Name").get().val()
    user_language = database.child("Data").child("Language").get().val()
    user_country = database.child("Data").child("Country").get().val()

    return render(request, 'home.html', {
        "user_name": user_name,
        "user_language": user_language,
        "user_country": user_country
    })
