from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from .models import Conversation, Registration
from .forms import ConversationForm


def conversation_list(request):
    conversations = Conversation.objects.all()
    return render(request, 'convos/conversation_list.html', {'conversations': conversations})


def conversation_detail(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk)
    is_registered = request.user.is_authenticated and Registration.objects.filter(user=request.user,
                                                                                  conversation=conversation).exists()
    return render(request, 'convos/conversation_detail.html',
                  {'conversation': conversation, 'is_registered': is_registered})


@login_required
def conversation_register(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk)
    if Registration.objects.filter(user=request.user, conversation=conversation).exists():
        return redirect('conversation_detail', pk=pk)  # Redirect if already registered

    Registration.objects.create(user=request.user, conversation=conversation)
    return redirect('conversation_detail', pk=pk)


@login_required
@user_passes_test(lambda u: u.is_staff, login_url='/')
def conversation_create(request):
    if request.method == 'POST':
        form = ConversationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('conversation_list')
    else:
        form = ConversationForm()
    return render(request, 'convos/conversation_form.html', {'form': form})


@login_required
@user_passes_test(lambda u: u.is_staff, login_url='/')
def conversation_edit(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk)
    if request.method == 'POST':
        form = ConversationForm(request.POST, instance=conversation)
        if form.is_valid():
            form.save()
            return redirect('conversation_detail', pk=pk)
    else:
        form = ConversationForm(instance=conversation)
    return render(request, 'convos/conversation_form.html', {'form': form})


@login_required
@user_passes_test(lambda u: u.is_staff, login_url='/')
def conversation_registrations(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk)
    registrations = Registration.objects.filter(conversation=conversation)
    return render(request, 'convos/conversation_registrations.html',
                  {'conversation': conversation, 'registrations': registrations})


@login_required
@user_passes_test(lambda u: u.is_staff, login_url='/')
def registration_delete(request, pk):
    registration = get_object_or_404(Registration, pk=pk)
    registration.delete()
    return redirect('conversation_registrations', pk=registration.conversation.pk)


@login_required
@user_passes_test(lambda u: u.is_staff, login_url='/')
def conversation_delete(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk)
    conversation.delete()
    return redirect('conversation_list')


@login_required
def conversation_unregister(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk)
    registration = Registration.objects.filter(user=request.user, conversation=conversation).first()
    if registration:
        registration.delete()
    return redirect('conversation_detail', pk=pk)
