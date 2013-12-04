from django.conf.urls import patterns, url,include
from home import views
from edit_colony import views as ec_views
from viz import views as viz_views
from breeding_calculator import views as bc_views

urlpatterns = patterns('',
	url(r'index/?$', views.index, name='index'),
	url(r'overview.html', views.overview,name='overview'),
	url(r'index.html', views.index, name='index'),
	url(r'team.html', views.team, name='index'),
	url(r'add_mouse?$',ec_views.add_mouse,name='ec_am'),
	url(r'edit_mouse?$',ec_views.validate_mouse,name='ec_em'),	
	url(r'bc', bc_views.compute_ancestors, name='ca'),
)