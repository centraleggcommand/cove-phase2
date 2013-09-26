from django.conf.urls import patterns, url
from viz import views

urlpatterns = patterns('', 
	url(r'parent_view/?$', views.draw_lineage, name='lineage'), 
)
