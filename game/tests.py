import json

from django.test import TestCase
from django.urls import reverse

from .models import LeaderboardEntry
from .views import MAX_ENEMIES_DESTROYED, MAX_SCORE, MAX_WAVES_CLEARED


class LeaderboardEntryModelTests(TestCase):
    def test_entries_are_ordered_by_ranking_fields(self):
        early_entry = LeaderboardEntry.objects.create(
            player_name='Early', score=100, waves_cleared=3, enemies_destroyed=20
        )
        top_entry = LeaderboardEntry.objects.create(
            player_name='Top', score=250, waves_cleared=2, enemies_destroyed=10
        )
        better_tiebreak_entry = LeaderboardEntry.objects.create(
            player_name='Tie', score=100, waves_cleared=4, enemies_destroyed=5
        )

        entries = list(LeaderboardEntry.objects.all())

        self.assertEqual(entries, [top_entry, better_tiebreak_entry, early_entry])


class LeaderboardViewTests(TestCase):
    def test_home_shows_top_ten_entries(self):
        for index in range(12):
            LeaderboardEntry.objects.create(player_name=f'Pilot {index}', score=index)

        response = self.client.get(reverse('home'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['top_entries']), 10)

    def test_leaderboard_shows_top_fifty_entries(self):
        for index in range(55):
            LeaderboardEntry.objects.create(player_name=f'Pilot {index}', score=index)

        response = self.client.get(reverse('leaderboard'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['top_entries']), 50)

    def test_leaderboard_api_returns_top_twenty_entries(self):
        for index in range(25):
            LeaderboardEntry.objects.create(player_name=f'Pilot {index}', score=index)

        response = self.client.get(reverse('leaderboard_api'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['results']), 20)

    def test_home_includes_cross_device_favicon_links(self):
        response = self.client.get(reverse('home'))

        self.assertContains(response, 'href="/favicon.ico"')
        self.assertContains(response, 'href="/favicon.jpg"')
        self.assertContains(response, 'href="/site.webmanifest"')

    def test_favicon_assets_are_served_with_expected_content_types(self):
        expected_content_types = {
            '/favicon.ico': 'image/jpeg',
            '/favicon.jpg': 'image/jpeg',
            '/site.webmanifest': 'application/manifest+json',
        }

        for url, content_type in expected_content_types.items():
            with self.subTest(url=url):
                response = self.client.get(url)

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.headers['Content-Type'], content_type)


class SaveScoreApiTests(TestCase):
    def post_score(self, payload):
        return self.client.post(
            reverse('save_score'),
            data=json.dumps(payload),
            content_type='application/json',
        )

    def test_save_score_creates_entry_for_valid_payload(self):
        response = self.post_score(
            {
                'player_name': 'Ada',
                'score': 1234,
                'waves_cleared': 5,
                'enemies_destroyed': 42,
            }
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(LeaderboardEntry.objects.count(), 1)
        entry = LeaderboardEntry.objects.get()
        self.assertEqual(entry.player_name, 'Ada')
        self.assertEqual(entry.score, 1234)
        self.assertEqual(entry.waves_cleared, 5)
        self.assertEqual(entry.enemies_destroyed, 42)

    def test_save_score_rejects_invalid_json(self):
        response = self.client.post(
            reverse('save_score'), data='{', content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(LeaderboardEntry.objects.count(), 0)
        self.assertEqual(response.json()['error'], 'JSON inválido.')

    def test_save_score_rejects_non_object_json(self):
        response = self.client.post(
            reverse('save_score'), data='[]', content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(LeaderboardEntry.objects.count(), 0)
        self.assertEqual(response.json()['error'], 'El JSON debe ser un objeto.')

    def test_save_score_rejects_non_numeric_values(self):
        response = self.post_score(
            {'score': 'mucho', 'waves_cleared': 1, 'enemies_destroyed': 2}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(LeaderboardEntry.objects.count(), 0)
        self.assertIn('score', response.json()['error'])

    def test_save_score_rejects_negative_values(self):
        response = self.post_score(
            {'score': -1, 'waves_cleared': 1, 'enemies_destroyed': 2}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(LeaderboardEntry.objects.count(), 0)
        self.assertIn('no puede ser negativo', response.json()['error'])

    def test_save_score_rejects_values_above_configured_limits(self):
        cases = [
            {'score': MAX_SCORE + 1, 'waves_cleared': 1, 'enemies_destroyed': 2},
            {'score': 10, 'waves_cleared': MAX_WAVES_CLEARED + 1, 'enemies_destroyed': 2},
            {'score': 10, 'waves_cleared': 1, 'enemies_destroyed': MAX_ENEMIES_DESTROYED + 1},
        ]

        for payload in cases:
            with self.subTest(payload=payload):
                response = self.post_score(payload)
                self.assertEqual(response.status_code, 400)

        self.assertEqual(LeaderboardEntry.objects.count(), 0)

    def test_save_score_uses_default_name_and_truncates_long_names(self):
        response = self.post_score(
            {
                'player_name': 'Piloto con nombre absurdamente largo para probar el corte',
                'score': 1,
                'waves_cleared': 1,
                'enemies_destroyed': 1,
            }
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(LeaderboardEntry.objects.get().player_name), 30)

        response = self.post_score(
            {'player_name': '   ', 'score': 1, 'waves_cleared': 1, 'enemies_destroyed': 1}
        )

        self.assertEqual(response.status_code, 201)
        latest_entry = LeaderboardEntry.objects.latest('created_at')
        self.assertEqual(latest_entry.player_name, 'Piloto Anónimo')
