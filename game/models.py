from django.db import models


class LeaderboardEntry(models.Model):
    player_name = models.CharField(max_length=30)
    score = models.PositiveIntegerField(default=0)
    waves_cleared = models.PositiveIntegerField(default=0)
    enemies_destroyed = models.PositiveIntegerField(default=0)
    scenario = models.CharField(max_length=60, blank=True, default='')
    duration_seconds = models.PositiveIntegerField(default=0)
    difficulty = models.CharField(max_length=30, blank=True, default='normal')
    towers_built = models.PositiveIntegerField(default=0)
    towers_upgraded = models.PositiveIntegerField(default=0)
    abilities_used = models.PositiveIntegerField(default=0)
    game_seed = models.CharField(max_length=64, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-waves_cleared', '-enemies_destroyed', 'created_at']
        indexes = [
            models.Index(
                fields=['-score', '-waves_cleared', '-enemies_destroyed', 'created_at'],
                name='leaderboard_rank_idx',
            ),
        ]

    def __str__(self):
        return f'{self.player_name} - {self.score}'
