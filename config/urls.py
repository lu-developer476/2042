from pathlib import Path

from django.contrib import admin
from django.http import FileResponse
from django.urls import include, path


def favicon(request):
    favicon_path = Path(__file__).with_name('favicon.jpg')
    return FileResponse(open(favicon_path, 'rb'), content_type='image/jpeg')

urlpatterns = [
    path('favicon.jpg', favicon, name='favicon'),
    path('admin/', admin.site.urls),
    path('', include('game.urls')),
]
