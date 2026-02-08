from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authenticate.urls')),
    path('api/dashboard/', include('dashboard.urls')),

    # THE FIX: This regex now IGNORES requests starting with 'assets/'
    # preventing Django from serving index.html for your JS files.
    re_path(r'^(?!assets|api|admin).*$', TemplateView.as_view(template_name='index.html')),
]

# Enable static file serving during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])