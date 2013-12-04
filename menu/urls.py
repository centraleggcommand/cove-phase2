from django.conf.urls import patterns, url
from menu import views

urlpatterns = patterns('',
	#url(r'calculate/?$', views.calculate, name='calculate'),
	url(r'^accounts/login/$',  views.login, name='login'),
	url(r'^accounts/auth_view/$', views.auth_view, name='auth_view'),
	url(r'^accounts/logout/$', views.logout, name='logout'),
    url(r'^accounts/loggedin/$', views.loggedin, name='loggedin'),
    url(r'^accounts/invalid/$', views.invalid_login, name='invalid'),
	url(r'^accounts/register/$', views.register, name='register'),
	url(r'^accounts/register_success/$', views.register_success, name='register'),

)