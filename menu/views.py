from menu.forms import User
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django.shortcuts import render, render_to_response
from django.contrib import auth
from django.core.context_processors import csrf

def auth_view(request):
	username = request.POST.get('username', '')
	password = request.POST.get('password', '')
	user = auth.authenticate(username=username, password=password)
	if user is not None and user.is_active:
		auth.login(request, user)
		return HttpResponseRedirect("/menu/accounts/loggedin/")
	else:
		return HttpResponseRedirect("/menu/accounts/invalid/")

def invalid_login(request):
	return render_to_response('invalid_login.html')

def login(request):
	c = {}
	c.update(csrf(request))
	return render_to_response('login.html',c)
	
def loggedin(request):
	return render_to_response('loggedin.html', 
		{'full_name': request.user.username})

def logout(request):
	auth.logout(request)
	return HttpResponseRedirect("/menu/accounts/login/")

def register(request):
	if request.method == 'POST':
		form = UserCreationForm(request.POST)
		if form.is_valid():
			form.save()
			return HttpResponseRedirect('/menu/accounts/register_success/')
		else:
			form = UserCreationForm()

	args = {}
	args.update(csrf(request))
	args['form'] = UserCreationForm()
	return render(request,'register.html', args)

def register_success(request):
	return render_to_response('register_success.html')
