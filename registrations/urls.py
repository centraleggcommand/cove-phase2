from django.conf.urls import patterns, url
from registrations import views
urlpatterns = patterns('',
	#url(r'calculate/?$', views.calculate, name='calculate'),
	url(r'register/$', views.register, name='register'),

)