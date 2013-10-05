from django.conf.urls import patterns, url
from menu import views

urlpatterns = patterns('',
	url(r'main_menu/?$', views.main_menu, name='main_menu')
)