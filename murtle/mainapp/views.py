from django.shortcuts import render
import pyrebase

# Hide this eventually
config = {
    "apiKey": "AIzaSyDkJunL0yszOv474RJNxe7GUVjUBFWS-fU",
    "authDomain": "murtle-49410.firebaseapp.com",
    "databaseURL": "https://murtle-49410-default-rtdb.firebaseio.com",
    "projectId": "murtle-49410",
    "storageBucket": "murtle-49410.appspot.com",
    "messagingSenderId": "1046106266272",
    "appId": "1:1046106266272:web:d7796c96a27ba34da6c7c5",
}

firebase = pyrebase.initialize_app(config)
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
