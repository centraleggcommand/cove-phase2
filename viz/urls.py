from django.conf.urls import patterns, url
from viz import views

urlpatterns = patterns('',
    url(r'find_lineage/?$', views.find_lineage, name='find_lineage'),
	url(r'lineage_view/?$', views.draw_lineage, name='lineage'),
    url(r'force_view/?$', views.draw_force, name='force'),
    url(r'pack_view/?$', views.draw_pack, name='pack'),
    url(r'colony/?$', views.draw_colony, name='colony'),
)
