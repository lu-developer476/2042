from django.db import models


class LeaderboardEntry(models.Model):
    player_name = models.CharField(max_length=30)
    score = models.PositiveIntegerField(default=0)
    waves_cleared = models.PositiveIntegerField(default=0)
    enemies_destroyed = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-waves_cleared', '-enemies_destroyed', 'created_at']

    def __str__(self):
        return f'{self.player_name} - {self.score}'
