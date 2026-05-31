"""
AuthForge Python Integration Example

pip install requests
"""

import requests
from typing import Optional, Dict, Any


class AuthForgeClient:
    """AuthForge API client for Python applications."""

    def __init__(self, base_url: str = "http://localhost:3000/api/v1"):
        self.base_url = base_url
        self.access_token: Optional[str] = None
        self.session = requests.Session()

    # ============================================
    # Authentication
    # ============================================

    def signup(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str
    ) -> Dict[str, Any]:
        """Register a new user."""
        response = self.session.post(
            f"{self.base_url}/auth/signup",
            json={
                "email": email,
                "password": password,
                "firstName": first_name,
                "lastName": last_name,
            }
        )
        return self._handle_response(response)

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and store access token."""
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        data = self._handle_response(response)
        self.access_token = data["access_token"]
        return data

    def logout(self, all_sessions: bool = False) -> Dict[str, Any]:
        """Logout current session or all sessions."""
        response = self._authenticated_request(
            "POST",
            "/auth/logout",
            json={"allSessions": all_sessions}
        )
        self.access_token = None
        return response

    def refresh_token(self) -> str:
        """Refresh the access token using the refresh cookie."""
        response = self.session.post(f"{self.base_url}/auth/refresh")
        data = self._handle_response(response)
        self.access_token = data["access_token"]
        return self.access_token

    # ============================================
    # User Management
    # ============================================

    def get_profile(self) -> Dict[str, Any]:
        """Get current user profile."""
        return self._authenticated_request("GET", "/users/me")

    def update_profile(
        self,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update current user profile."""
        data = {}
        if first_name:
            data["firstName"] = first_name
        if last_name:
            data["lastName"] = last_name
        return self._authenticated_request("PATCH", "/users/me", json=data)

    # ============================================
    # Private Helpers
    # ============================================

    def _authenticated_request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Make an authenticated API request."""
        if not self.access_token:
            raise Exception("Not authenticated")

        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {self.access_token}"

        response = self.session.request(
            method,
            f"{self.base_url}{endpoint}",
            headers=headers,
            **kwargs
        )

        # Handle token expiration
        if response.status_code == 401:
            try:
                self.refresh_token()
                return self._authenticated_request(method, endpoint, **kwargs)
            except Exception:
                self.access_token = None
                raise Exception("Session expired")

        return self._handle_response(response)

    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """Handle API response and errors."""
        data = response.json()
        if not data.get("success"):
            error = data.get("error", {})
            raise Exception(f"{error.get('code')}: {error.get('message')}")
        return data.get("data", {})


# ============================================
# USAGE EXAMPLE
# ============================================

if __name__ == "__main__":
    auth = AuthForgeClient()

    try:
        # Signup
        auth.signup(
            email="user@example.com",
            password="SecureP@ss123!",
            first_name="John",
            last_name="Doe"
        )
        print("✓ Signed up successfully")

        # Login
        result = auth.login("user@example.com", "SecureP@ss123!")
        print(f"✓ Logged in as: {result['user']['email']}")

        # Get profile
        profile = auth.get_profile()
        print(f"✓ Profile: {profile}")

        # Update profile
        auth.update_profile(first_name="Jane")
        print("✓ Profile updated")

        # Logout
        auth.logout()
        print("✓ Logged out")

    except Exception as e:
        print(f"Error: {e}")
