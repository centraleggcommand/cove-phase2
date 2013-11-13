from django import forms
from django.contrib.auth.models import User

class User(forms.ModelForm):
	class Meta:
		model = User