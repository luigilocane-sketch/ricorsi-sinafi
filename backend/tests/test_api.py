"""
Backend API Tests for Si.Na.Fi Ricorsi System
Tests: Admin Auth, Ricorsi CRUD, Submissions, Stats
"""
import pytest
import requests
import os
import json
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL must be set")

API_URL = f"{BASE_URL}/api"


class TestHealthCheck:
    """Basic API health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{API_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API Root: {data}")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{API_URL}/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        print(f"Login success - Token received: {data['access_token'][:20]}...")
    
    def test_admin_login_invalid_password(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{API_URL}/admin/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Login with wrong password correctly rejected")
    
    def test_admin_login_invalid_username(self):
        """Test admin login with non-existent username"""
        response = requests.post(f"{API_URL}/admin/login", json={
            "username": "nonexistent_user",
            "password": "admin123"
        })
        assert response.status_code == 401
        print("Login with non-existent user correctly rejected")
    
    def test_admin_check_authenticated(self):
        """Test admin check with valid token"""
        # First login
        login_response = requests.post(f"{API_URL}/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        # Check auth status
        response = requests.get(
            f"{API_URL}/admin/check",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] == True
        assert data["username"] == "admin"
        print(f"Admin check passed - authenticated: {data}")
    
    def test_admin_check_unauthorized(self):
        """Test admin check without token"""
        response = requests.get(f"{API_URL}/admin/check")
        assert response.status_code == 401
        print("Unauthorized check correctly rejected")


class TestRicorsiCRUD:
    """Ricorsi CRUD operation tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{API_URL}/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_ricorsi_public(self):
        """Test getting all ricorsi (public endpoint)"""
        response = requests.get(f"{API_URL}/ricorsi")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} ricorsi")
        if len(data) > 0:
            # Verify ricorso structure
            ricorso = data[0]
            assert "id" in ricorso
            assert "titolo" in ricorso
            assert "descrizione" in ricorso
            assert "attivo" in ricorso
            print(f"First ricorso: {ricorso['titolo']}")
    
    def test_get_ricorsi_active_only(self):
        """Test getting only active ricorsi"""
        response = requests.get(f"{API_URL}/ricorsi", params={"attivo": True})
        assert response.status_code == 200
        data = response.json()
        for ricorso in data:
            assert ricorso["attivo"] == True
        print(f"Found {len(data)} active ricorsi")
    
    def test_create_ricorso(self, auth_token):
        """Test creating a new ricorso"""
        unique_id = str(uuid.uuid4())[:8]
        ricorso_data = {
            "titolo": f"TEST_Ricorso {unique_id}",
            "descrizione": "Ricorso di test automatico",
            "badge_text": "TEST",
            "campi_dati": [
                {
                    "id": "nome",
                    "label": "Nome",
                    "type": "text",
                    "required": True,
                    "placeholder": "Inserisci nome"
                }
            ],
            "documenti_richiesti": [
                {
                    "id": "doc_test",
                    "label": "Documento Test",
                    "required": True,
                    "fileType": "pdf"
                }
            ],
            "attivo": True
        }
        
        response = requests.post(
            f"{API_URL}/ricorsi",
            json=ricorso_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["titolo"] == ricorso_data["titolo"]
        assert "id" in data
        print(f"Created ricorso with id: {data['id']}")
        
        # Store for cleanup
        self.created_ricorso_id = data["id"]
        return data["id"]
    
    def test_get_single_ricorso(self, auth_token):
        """Test getting a single ricorso by ID"""
        # First get all ricorsi
        response = requests.get(f"{API_URL}/ricorsi")
        ricorsi = response.json()
        
        if len(ricorsi) == 0:
            pytest.skip("No ricorsi available")
        
        ricorso_id = ricorsi[0]["id"]
        
        # Get single ricorso
        response = requests.get(f"{API_URL}/ricorsi/{ricorso_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == ricorso_id
        print(f"Retrieved ricorso: {data['titolo']}")
    
    def test_get_nonexistent_ricorso(self):
        """Test getting a non-existent ricorso"""
        response = requests.get(f"{API_URL}/ricorsi/nonexistent-id-12345")
        assert response.status_code == 404
        print("Non-existent ricorso correctly returns 404")
    
    def test_create_and_delete_ricorso(self, auth_token):
        """Test creating and then deleting a ricorso"""
        # Create
        unique_id = str(uuid.uuid4())[:8]
        ricorso_data = {
            "titolo": f"TEST_DeleteMe_{unique_id}",
            "descrizione": "This ricorso will be deleted",
            "badge_text": "DELETE TEST",
            "campi_dati": [],
            "documenti_richiesti": [],
            "attivo": False
        }
        
        create_response = requests.post(
            f"{API_URL}/ricorsi",
            json=ricorso_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_response.status_code == 200
        ricorso_id = create_response.json()["id"]
        print(f"Created ricorso for deletion: {ricorso_id}")
        
        # Verify it exists
        get_response = requests.get(f"{API_URL}/ricorsi/{ricorso_id}")
        assert get_response.status_code == 200
        
        # Delete
        delete_response = requests.delete(
            f"{API_URL}/ricorsi/{ricorso_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert delete_response.status_code == 200
        print(f"Deleted ricorso: {ricorso_id}")
        
        # Verify it's deleted
        verify_response = requests.get(f"{API_URL}/ricorsi/{ricorso_id}")
        assert verify_response.status_code == 404
        print("Verified ricorso is deleted (returns 404)")
    
    def test_delete_ricorso_unauthorized(self):
        """Test deleting ricorso without token"""
        response = requests.delete(f"{API_URL}/ricorsi/some-id")
        assert response.status_code == 401
        print("Unauthorized delete correctly rejected")
    
    def test_update_ricorso(self, auth_token):
        """Test updating a ricorso"""
        # First create a ricorso to update
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "titolo": f"TEST_Update_{unique_id}",
            "descrizione": "Original description",
            "badge_text": "ORIGINAL",
            "campi_dati": [],
            "documenti_richiesti": [],
            "attivo": True
        }
        
        create_response = requests.post(
            f"{API_URL}/ricorsi",
            json=create_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        ricorso_id = create_response.json()["id"]
        
        # Update
        update_data = {
            "descrizione": "Updated description",
            "badge_text": "UPDATED"
        }
        
        update_response = requests.put(
            f"{API_URL}/ricorsi/{ricorso_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["descrizione"] == "Updated description"
        assert updated["badge_text"] == "UPDATED"
        print(f"Updated ricorso: {ricorso_id}")
        
        # Verify with GET
        get_response = requests.get(f"{API_URL}/ricorsi/{ricorso_id}")
        assert get_response.json()["descrizione"] == "Updated description"
        
        # Cleanup
        requests.delete(
            f"{API_URL}/ricorsi/{ricorso_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )


class TestSubmissions:
    """Submission tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{API_URL}/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def ricorso_id(self):
        """Get an existing ricorso ID"""
        response = requests.get(f"{API_URL}/ricorsi", params={"attivo": True})
        ricorsi = response.json()
        if not ricorsi:
            pytest.skip("No active ricorsi available")
        return ricorsi[0]["id"]
    
    def test_create_submission(self, ricorso_id):
        """Test creating a submission"""
        # Get ricorso details first
        ricorso_response = requests.get(f"{API_URL}/ricorsi/{ricorso_id}")
        ricorso = ricorso_response.json()
        
        # Build user data based on required fields
        dati_utente = {}
        for campo in ricorso.get("campi_dati", []):
            if campo.get("required"):
                if campo["type"] == "email":
                    dati_utente[campo["id"]] = "test@example.com"
                elif campo["type"] == "tel":
                    dati_utente[campo["id"]] = "+39 333 1234567"
                elif campo["type"] == "select" and campo.get("options"):
                    dati_utente[campo["id"]] = campo["options"][0]
                else:
                    dati_utente[campo["id"]] = f"Test_{campo['id']}"
        
        # Create submission
        response = requests.post(
            f"{API_URL}/submissions",
            data={
                "ricorso_id": ricorso_id,
                "dati_utente": json.dumps(dati_utente)
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["ricorso_id"] == ricorso_id
        print(f"Created submission: {data['id']}")
    
    def test_get_submissions_authenticated(self, auth_token, ricorso_id):
        """Test getting submissions (admin only)"""
        response = requests.get(
            f"{API_URL}/submissions",
            params={"ricorso_id": ricorso_id},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} submissions for ricorso {ricorso_id}")
    
    def test_get_submissions_unauthorized(self):
        """Test getting submissions without auth"""
        response = requests.get(f"{API_URL}/submissions")
        assert response.status_code == 401
        print("Submissions endpoint correctly requires authentication")
    
    def test_get_submissions_stats(self, auth_token, ricorso_id):
        """Test getting submission stats"""
        response = requests.get(
            f"{API_URL}/submissions/stats/{ricorso_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "ricorso_id" in data
        assert "totale_submissions" in data
        assert "per_regione" in data
        print(f"Stats - Total submissions: {data['totale_submissions']}")


class TestAdminManagement:
    """Admin management tests (MOCKED invite system)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{API_URL}/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_list_admins(self, auth_token):
        """Test listing all admins"""
        response = requests.get(
            f"{API_URL}/admin/list",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} admins")
    
    def test_create_invite(self, auth_token):
        """Test creating an admin invite (MOCKED - generates link)"""
        unique_id = str(uuid.uuid4())[:8]
        invite_data = {
            "email": f"test_{unique_id}@example.com",
            "nome": "Test",
            "cognome": f"User_{unique_id}"
        }
        
        response = requests.post(
            f"{API_URL}/admin/invite",
            json=invite_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "invite_url" in data
        print(f"MOCKED: Invite created with URL: {data['invite_url']}")
    
    def test_list_invites(self, auth_token):
        """Test listing all invites"""
        response = requests.get(
            f"{API_URL}/admin/invites",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} invites")


def cleanup_test_data():
    """Cleanup TEST_ prefixed data"""
    # Login
    login_response = requests.post(f"{API_URL}/admin/login", json={
        "username": "admin",
        "password": "admin123"
    })
    if login_response.status_code != 200:
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get all ricorsi
    ricorsi_response = requests.get(f"{API_URL}/ricorsi")
    if ricorsi_response.status_code == 200:
        for ricorso in ricorsi_response.json():
            if ricorso.get("titolo", "").startswith("TEST_"):
                requests.delete(f"{API_URL}/ricorsi/{ricorso['id']}", headers=headers)
                print(f"Cleaned up: {ricorso['titolo']}")


if __name__ == "__main__":
    # Run cleanup at the end
    import atexit
    atexit.register(cleanup_test_data)
    
    pytest.main([__file__, "-v", "--tb=short"])
