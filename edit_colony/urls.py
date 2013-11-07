from django.conf.urls import patterns, url
from edit_colony import views

urlpatterns = patterns('', 
	url(r'validate_mouse/?$', views.validate_mouse, name='validate_mouse'), 
	url(r'edit_mouse/?$', views.edit_mouse, name='edit_mouse'), 
	url(r'find_edit/?$', views.find_edit, name='find_edit'),
	url(r'add_mouse/?$',views.add_mouse,name="add_mouse"),
)
