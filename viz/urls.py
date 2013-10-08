from django.conf.urls import patterns, url
from viz import views

urlpatterns = patterns('',
    url(r'find_lineage/?$', views.find_lineage, name='find_lineage'),
	url(r'lineage_view/?$', views.draw_lineage, name='lineage'),
)
