from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='LeaderboardEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('player_name', models.CharField(max_length=30)),
                ('score', models.PositiveIntegerField(default=0)),
                ('waves_cleared', models.PositiveIntegerField(default=0)),
                ('enemies_destroyed', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-score', '-waves_cleared', '-enemies_destroyed', 'created_at'],
            },
        ),
    ]
