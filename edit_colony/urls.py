from django.conf.urls import patterns, url
from edit_colony import views

urlpatterns = patterns('', 
	url(r'add_mouse/?$', views.add_mouse, name='add_mouse'), 
	url(r'edit_mouse/?$', views.edit_mouse, name='edit_mouse'), 
	url(r'find_mouse/?$', views.find_mouse, name='find_mouse') 
)
