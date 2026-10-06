"""
URL configuration for server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path

from .views import home
from rest_framework import permissions

# Swagger / OpenAPI
try:
    from drf_yasg.views import get_schema_view
    from drf_yasg import openapi
    _HAS_DRF_YASG = True
except Exception:
    _HAS_DRF_YASG = False

if _HAS_DRF_YASG:
    schema_view = get_schema_view(
        openapi.Info(
            title="Talentlink API",
            default_version='v1',
            description="API documentation",
        ),
        public=True,
        permission_classes=(permissions.AllowAny,),
    )

# drf-spectacular schema and UI (preferred)
try:
    from drf_spectacular.views import (
        SpectacularAPIView,
        SpectacularSwaggerView,
        SpectacularRedocView,
    )
    _HAS_SPECTACULAR = True
except Exception:
    _HAS_SPECTACULAR = False

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/', include('apps.core.urls')),
    path('api/profiles/', include('apps.profiles.urls')), 
    path('api/messaging/', include('apps.messaging.urls')),

    # path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/auth/', include('apps.users.urls')),

    path('api/projects/', include('apps.projects.urls')),
    # path('api/v1/projects/', include('apps.projects.urls')),
    path('api/contracts/', include('apps.contracts.urls')),

    path('api/proposals/', include('apps.proposals.urls')),

    path('api/notifications/', include('apps.notifications.urls')),
    path('api/finance/', include('apps.finance.urls')),
    path('api/matching/', include('apps.matching.urls')),
    # Direct alias endpoints for seamless REST conventions
    path('api/', include('apps.matching.urls')),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Add Swagger UI and Redoc when drf-yasg is installed
    if _HAS_DRF_YASG:
        urlpatterns += [
            re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
            path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
            path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
        ]
    # Add drf-spectacular schema and UIs when available (fallback/preferred)
    if _HAS_SPECTACULAR:
        urlpatterns += [
            path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
            path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='spectacular-swagger-ui'),
            path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='spectacular-redoc'),
        ]
