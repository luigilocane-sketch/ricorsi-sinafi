#!/usr/bin/env python3
"""
Comprehensive backend API testing for Ricorsi system
Tests all critical authentication, CRUD, and submission flows
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get the backend URL from environment
BACKEND_URL = "https://credits-compute-1.preview.emergentagent.com/api"

class RicorsiAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.auth_token = None
        self.test_ricorso_id = None
        self.test_submission_id = None
        
    def log_test(self, test_name, success, details="", response=None):
        """Log test results with details"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response and not success:
            print(f"   Response: {response.status_code} - {response.text}")
        return success
    
    def test_1_admin_authentication(self):
        """Test admin login with credentials"""
        print("\n" + "="*60)
        print("TEST 1: Admin Authentication")
        print("="*60)
        
        url = f"{self.base_url}/admin/login"
        payload = {
            "username": "admin", 
            "password": "admin123"
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.auth_token = data["access_token"]
                    return self.log_test("Admin Login", True, 
                                       f"Token received: {self.auth_token[:20]}...")
                else:
                    return self.log_test("Admin Login", False, 
                                       "No access_token in response", response)
            else:
                return self.log_test("Admin Login", False, 
                                   "Invalid credentials or server error", response)
        except requests.exceptions.RequestException as e:
            return self.log_test("Admin Login", False, f"Connection error: {str(e)}")
    
    def test_2_get_ricorsi_public(self):
        """Test getting active ricorsi (public endpoint)"""
        print("\n" + "="*60)
        print("TEST 2: Get Active Ricorsi (Public)")
        print("="*60)
        
        url = f"{self.base_url}/ricorsi?attivo=true"
        
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                ricorsi = response.json()
                if isinstance(ricorsi, list) and len(ricorsi) > 0:
                    # Check for default ricorso
                    default_ricorso = ricorsi[0]
                    self.test_ricorso_id = default_ricorso.get("id")
                    
                    # Verify structure
                    has_procura = any(
                        doc.get("label") == "Procura alle Liti" 
                        for doc in default_ricorso.get("documenti_richiesti", [])
                    )
                    
                    campi_count = len(default_ricorso.get("campi_dati", []))
                    doc_count = len(default_ricorso.get("documenti_richiesti", []))
                    
                    success = (has_procura and campi_count == 7 and doc_count == 6)
                    details = f"Found {len(ricorsi)} ricorsi, {campi_count} fields, {doc_count} docs, Procura: {has_procura}"
                    
                    return self.log_test("Get Active Ricorsi", success, details)
                else:
                    return self.log_test("Get Active Ricorsi", False, 
                                       "No ricorsi found or invalid format", response)
            else:
                return self.log_test("Get Active Ricorsi", False, 
                                   "Failed to retrieve ricorsi", response)
        except requests.exceptions.RequestException as e:
            return self.log_test("Get Active Ricorsi", False, f"Connection error: {str(e)}")
    
    def test_3_get_specific_ricorso(self):
        """Test getting specific ricorso by ID"""
        print("\n" + "="*60)
        print("TEST 3: Get Specific Ricorso")
        print("="*60)
        
        if not self.test_ricorso_id:
            return self.log_test("Get Specific Ricorso", False, 
                               "No ricorso ID available from previous test")
        
        url = f"{self.base_url}/ricorsi/{self.test_ricorso_id}"
        
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                ricorso = response.json()
                required_fields = ["id", "titolo", "descrizione", "campi_dati", "documenti_richiesti"]
                has_all_fields = all(field in ricorso for field in required_fields)
                
                return self.log_test("Get Specific Ricorso", has_all_fields,
                                   f"Ricorso ID: {ricorso.get('id')}, Title: {ricorso.get('titolo', 'N/A')}")
            else:
                return self.log_test("Get Specific Ricorso", False, 
                                   "Failed to retrieve specific ricorso", response)
        except requests.exceptions.RequestException as e:
            return self.log_test("Get Specific Ricorso", False, f"Connection error: {str(e)}")
    
    def test_4_create_ricorso_admin(self):
        """Test creating new ricorso (admin only)"""
        print("\n" + "="*60)
        print("TEST 4: Create New Ricorso (Admin)")
        print("="*60)
        
        if not self.auth_token:
            return self.log_test("Create Ricorso", False, 
                               "No authentication token available")
        
        url = f"{self.base_url}/ricorsi"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        payload = {
            "titolo": "Test Ricorso API",
            "descrizione": "Test ricorso created by automated test",
            "badge_text": "TEST RICORSO",
            "campi_dati": [
                {
                    "id": "nome_test",
                    "label": "Nome Test", 
                    "type": "text",
                    "required": True,
                    "placeholder": "Inserisci nome"
                },
                {
                    "id": "email_test",
                    "label": "Email Test",
                    "type": "email", 
                    "required": True,
                    "placeholder": "test@email.com"
                }
            ],
            "documenti_richiesti": [
                {
                    "id": "doc_test_1",
                    "label": "Documento Test 1",
                    "required": True,
                    "fileType": "pdf"
                },
                {
                    "id": "doc_test_2", 
                    "label": "Documento Test 2",
                    "required": False,
                    "fileType": "both"
                }
            ],
            "attivo": True
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                ricorso = response.json()
                new_id = ricorso.get("id")
                if new_id:
                    self.test_ricorso_id = new_id  # Update for further tests
                    return self.log_test("Create Ricorso", True,
                                       f"Created ricorso with ID: {new_id}")
                else:
                    return self.log_test("Create Ricorso", False, 
                                       "No ID returned for created ricorso", response)
            else:
                return self.log_test("Create Ricorso", False, 
                                   "Failed to create ricorso", response)
        except requests.exceptions.RequestException as e:
            return self.log_test("Create Ricorso", False, f"Connection error: {str(e)}")
    
    def test_5_update_ricorso_admin(self):
        """Test updating ricorso (admin only)"""
        print("\n" + "="*60)
        print("TEST 5: Update Ricorso (Admin)")
        print("="*60)
        
        if not self.auth_token:
            return self.log_test("Update Ricorso", False, 
                               "No authentication token available")
        
        if not self.test_ricorso_id:
            return self.log_test("Update Ricorso", False, 
                               "No ricorso ID available for update")
        
        url = f"{self.base_url}/ricorsi/{self.test_ricorso_id}"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        payload = {
            "titolo": "Updated Test Ricorso API",
            "attivo": False
        }
        
        try:
            response = requests.put(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                ricorso = response.json()
                updated_title = ricorso.get("titolo")
                updated_status = ricorso.get("attivo")
                
                success = (updated_title == payload["titolo"] and updated_status == payload["attivo"])
                details = f"Title: {updated_title}, Active: {updated_status}"
                
                return self.log_test("Update Ricorso", success, details)
            else:
                return self.log_test("Update Ricorso", False, 
                                   "Failed to update ricorso", response)
        except requests.exceptions.RequestException as e:
            return self.log_test("Update Ricorso", False, f"Connection error: {str(e)}")
    
    def test_6_submission_flow(self):
        """Test submission creation flow"""
        print("\n" + "="*60)
        print("TEST 6: Submission Flow")
        print("="*60)
        
        if not self.test_ricorso_id:
            return self.log_test("Submission Flow", False, 
                               "No ricorso ID available for submission")
        
        url = f"{self.base_url}/submissions"
        
        # Prepare user data
        user_data = {
            "nome": "Giuseppe",
            "cognome": "Testini", 
            "matricola": "TEST123",
            "telefono": "+39 345 1234567",
            "reparto": "Test Unit",
            "email": "giuseppe.testini@test.com",
            "regione": "Lazio"
        }
        
        payload = {
            "ricorso_id": self.test_ricorso_id,
            "dati_utente": json.dumps(user_data)
        }
        
        try:
            response = requests.post(url, data=payload, timeout=10)
            
            if response.status_code == 200:
                submission = response.json()
                required_fields = ["id", "ricorso_id", "dati_utente", "reference_id"]
                has_all_fields = all(field in submission for field in required_fields)
                
                if has_all_fields:
                    self.test_submission_id = submission.get("id")
                    ref_id = submission.get("reference_id")
                    return self.log_test("Submission Flow", True,
                                       f"Created submission with ref: {ref_id}")
                else:
                    return self.log_test("Submission Flow", False, 
                                       "Missing required fields in submission", response)
            else:
                return self.log_test("Submission Flow", False, 
                                   "Failed to create submission", response)
        except requests.exceptions.RequestException as e:
            return self.log_test("Submission Flow", False, f"Connection error: {str(e)}")
    
    def test_7_get_submissions_admin(self):
        """Test getting submissions (admin only)"""
        print("\n" + "="*60)
        print("TEST 7: Get Submissions (Admin)")
        print("="*60)
        
        if not self.auth_token:
            return self.log_test("Get Submissions", False, 
                               "No authentication token available")
        
        url = f"{self.base_url}/submissions"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                submissions = response.json()
                if isinstance(submissions, list):
                    return self.log_test("Get Submissions", True,
                                       f"Retrieved {len(submissions)} submissions")
                else:
                    return self.log_test("Get Submissions", False, 
                                       "Invalid submissions format", response)
            else:
                return self.log_test("Get Submissions", False, 
                                   "Failed to retrieve submissions", response)
        except requests.exceptions.RequestException as e:
            return self.log_test("Get Submissions", False, f"Connection error: {str(e)}")
    
    def test_8_admin_check(self):
        """Test admin authentication check"""
        print("\n" + "="*60)
        print("TEST 8: Authentication Check")
        print("="*60)
        
        if not self.auth_token:
            return self.log_test("Authentication Check", False, 
                               "No authentication token available")
        
        url = f"{self.base_url}/admin/check"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                is_authenticated = data.get("authenticated", False)
                username = data.get("username", "unknown")
                
                return self.log_test("Authentication Check", is_authenticated,
                                   f"User: {username}, Authenticated: {is_authenticated}")
            else:
                return self.log_test("Authentication Check", False, 
                                   "Failed authentication check", response)
        except requests.exceptions.RequestException as e:
            return self.log_test("Authentication Check", False, f"Connection error: {str(e)}")
    
    def test_9_unauthorized_access(self):
        """Test unauthorized access (should fail)"""
        print("\n" + "="*60)
        print("TEST 9: Unauthorized Access")
        print("="*60)
        
        url = f"{self.base_url}/ricorsi"
        payload = {
            "titolo": "Unauthorized Test",
            "descrizione": "This should fail",
            "campi_dati": [],
            "documenti_richiesti": []
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            
            # Should return 401 or 403
            if response.status_code in [401, 403]:
                return self.log_test("Unauthorized Access", True, 
                                   f"Correctly denied access (HTTP {response.status_code})")
            else:
                return self.log_test("Unauthorized Access", False, 
                                   f"Expected 401/403, got {response.status_code}", response)
        except requests.exceptions.RequestException as e:
            return self.log_test("Unauthorized Access", False, f"Connection error: {str(e)}")
    
    def test_10_delete_ricorso_admin(self):
        """Test deleting ricorso (admin only)"""
        print("\n" + "="*60)
        print("TEST 10: Delete Ricorso (Admin)")
        print("="*60)
        
        if not self.auth_token:
            return self.log_test("Delete Ricorso", False, 
                               "No authentication token available")
        
        if not self.test_ricorso_id:
            return self.log_test("Delete Ricorso", False, 
                               "No test ricorso ID available for deletion")
        
        url = f"{self.base_url}/ricorsi/{self.test_ricorso_id}"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.delete(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get("message", "")
                success = "deleted successfully" in message.lower()
                
                return self.log_test("Delete Ricorso", success,
                                   f"Response: {message}")
            else:
                return self.log_test("Delete Ricorso", False, 
                                   "Failed to delete ricorso", response)
        except requests.exceptions.RequestException as e:
            return self.log_test("Delete Ricorso", False, f"Connection error: {str(e)}")
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print(f"🚀 STARTING RICORSI API TESTS")
        print(f"Backend URL: {self.base_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        
        tests = [
            self.test_1_admin_authentication,
            self.test_2_get_ricorsi_public, 
            self.test_3_get_specific_ricorso,
            self.test_4_create_ricorso_admin,
            self.test_5_update_ricorso_admin,
            self.test_6_submission_flow,
            self.test_7_get_submissions_admin,
            self.test_8_admin_check,
            self.test_9_unauthorized_access,
            self.test_10_delete_ricorso_admin
        ]
        
        results = []
        for test in tests:
            try:
                result = test()
                results.append(result)
            except Exception as e:
                print(f"❌ FAIL {test.__name__} - Exception: {str(e)}")
                results.append(False)
        
        # Summary
        passed = sum(results)
        total = len(results)
        success_rate = (passed / total) * 100
        
        print("\n" + "="*60)
        print("FINAL TEST SUMMARY")
        print("="*60)
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Backend API is working correctly.")
        else:
            print(f"⚠️  {total - passed} tests failed. See details above.")
        
        return passed == total


def main():
    """Main test runner"""
    tester = RicorsiAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())