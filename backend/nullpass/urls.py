from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from .views import health_check, db_health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authenticate.urls')),
    path('api/dashboard/', include('dashboard.urls')),

    path('api/health', health_check, name='health_check'),
    path('api/dbhealth', db_health_check, name='db_health_check'),

    # THE FIX: This regex now IGNORES requests starting with 'assets/', 'api/', 'admin/', 'health', 'dbhealth'
    # preventing Django from serving index.html for your JS files or endpoints.
    re_path(r'^(?!assets|api|admin|health|dbhealth).*$', TemplateView.as_view(template_name='index.html')),
]

# Enable static file serving during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])