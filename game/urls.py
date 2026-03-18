from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('api/leaderboard/', views.leaderboard_api, name='leaderboard_api'),
    path('api/save-score/', views.save_score, name='save_score'),
]
