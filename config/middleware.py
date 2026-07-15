from django.conf import settings


class PermissionsPolicyMiddleware:
    """Add a conservative Permissions-Policy response header."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        policy = getattr(settings, 'PERMISSIONS_POLICY', {})
        if policy and 'Permissions-Policy' not in response:
            directives = []
            for feature, allowlist in policy.items():
                values = ' '.join(allowlist) if allowlist else '()'
                directives.append(f'{feature}={values}')
            response['Permissions-Policy'] = ', '.join(directives)
        return response
