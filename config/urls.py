from pathlib import Path

from django.contrib import admin
from django.http import FileResponse
from django.urls import include, path


FAVICON_FILES = {
    'favicon.ico': ('favicon.svg', 'image/svg+xml'),
    'favicon.svg': ('favicon.svg', 'image/svg+xml'),
    'site.webmanifest': ('site.webmanifest', 'application/manifest+json'),
    'favicon.jpg': ('favicon.jpg', 'image/jpeg'),
}


def favicon(request, filename='favicon.ico'):
    icon_name, content_type = FAVICON_FILES[filename]
    favicon_path = Path(__file__).with_name(icon_name)
    return FileResponse(open(favicon_path, 'rb'), content_type=content_type)

urlpatterns = [
    path('favicon.ico', favicon, {'filename': 'favicon.ico'}, name='favicon'),
    path('favicon.svg', favicon, {'filename': 'favicon.svg'}, name='favicon_svg'),
    path('site.webmanifest', favicon, {'filename': 'site.webmanifest'}, name='site_webmanifest'),
    path('favicon.jpg', favicon, {'filename': 'favicon.jpg'}, name='favicon_jpg'),
    path('admin/', admin.site.urls),
    path('', include('game.urls')),
]
