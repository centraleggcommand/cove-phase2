# Create your views here.
from django.http import HttpResponse
from django.shortcuts import render
from django import forms
from django.core.exceptions import ObjectDoesNotExist

def main_menu(request):
    if request.method == 'GET':
        return render( request, 'bootstrap_test.html')
