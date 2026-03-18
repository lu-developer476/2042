from django.contrib import admin
from .models import LeaderboardEntry


@admin.register(LeaderboardEntry)
class LeaderboardEntryAdmin(admin.ModelAdmin):
    list_display = ('player_name', 'score', 'waves_cleared', 'enemies_destroyed', 'created_at')
    search_fields = ('player_name',)
    list_filter = ('created_at',)
