# Create your views here.
from django.http import HttpResponse
from django.shortcuts import render
from django.shortcuts import redirect

def overview(request):
	if request.method == 'GET':
		return render(request, 'overview.html')

def team(request):
	if request.method == 'GET':
		return render(request, 'team.html')

def index(request):
    if request.method == 'GET':
        return render(request, 'index.html')
