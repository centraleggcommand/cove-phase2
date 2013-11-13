from django.conf.urls import patterns, url
from breeding_calculator import views
urlpatterns = patterns('',
	#url(r'calculate/?$', views.calculate, name='calculate'),
	url(r'compute_ancestors/$', views.compute_ancestors, name='compute_ancestors'),

)