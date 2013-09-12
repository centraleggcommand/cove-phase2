from django.conf.urls import patterns, url
from edit_colony import views

urlpatterns = patterns('', 
	url(r'^$', views.edit_mouse, name='edit_mouse') 
)
