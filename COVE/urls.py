from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'COVE.views.home', name='home'),
    # url(r'^COVE/', include('COVE.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
	url(r'^edit_colony/', include( 'edit_colony.urls')),
	#url(r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT }),
	url(r'^viz/', include( 'viz.urls')),
	url(r'^home/', include( 'home.urls')),
    url(r'^menu/', include( 'menu.urls')),
    url(r'^register/', include( 'registrations.urls')),
    url(r'^breeding_calculator/', include( 'breeding_calculator.urls')),
)

urlpatterns += staticfiles_urlpatterns()
