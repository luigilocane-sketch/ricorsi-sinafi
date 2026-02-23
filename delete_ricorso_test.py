#!/usr/bin/env python3
"""
Focused DELETE ricorso functionality test
Tests the specific DELETE scenario as requested in the review
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://ricorso-system.preview.emergentagent.com/api"

class DeleteRicorsoTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.auth_token = None
        self.ricorso_to_delete_id = None
        
    def log_step(self, step_name, success, details="", response=None):
        """Log test step results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {step_name}")
        if details:
            print(f"   Details: {details}")
        if response and not success:
            print(f"   Response: {response.status_code} - {response.text}")
        return success

    def step_1_login_as_admin(self):
        """Step 1: Login as admin"""
        print("\n📋 STEP 1: Login as admin")
        print("-" * 40)
        
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
                    return self.log_step("Admin Login", True, 
                                       f"Successfully logged in. Token: {self.auth_token[:30]}...")
                else:
                    return self.log_step("Admin Login", False, 
                                       "No access_token in response", response)
            else:
                return self.log_step("Admin Login", False, 
                                   "Login failed", response)
        except requests.exceptions.RequestException as e:
            return self.log_step("Admin Login", False, f"Connection error: {str(e)}")

    def step_2_get_list_of_ricorsi(self):
        """Step 2: Get list of ricorsi and note down ID to delete"""
        print("\n📋 STEP 2: Get list of ricorsi")
        print("-" * 40)
        
        url = f"{self.base_url}/ricorsi"
        
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                ricorsi = response.json()
                if isinstance(ricorsi, list) and len(ricorsi) > 0:
                    # Select the first ricorso for deletion
                    self.ricorso_to_delete_id = ricorsi[0].get("id")
                    ricorso_title = ricorsi[0].get("titolo", "Unknown")
                    
                    return self.log_step("Get Ricorsi List", True,
                                       f"Found {len(ricorsi)} ricorsi. Will delete: {ricorso_title} (ID: {self.ricorso_to_delete_id})")
                else:
                    return self.log_step("Get Ricorsi List", False, 
                                       "No ricorsi found in the system", response)
            else:
                return self.log_step("Get Ricorsi List", False, 
                                   "Failed to retrieve ricorsi", response)
        except requests.exceptions.RequestException as e:
            return self.log_step("Get Ricorsi List", False, f"Connection error: {str(e)}")

    def step_3_delete_ricorso(self):
        """Step 3: Delete ricorso with admin auth token"""
        print("\n📋 STEP 3: Delete ricorso")
        print("-" * 40)
        
        if not self.auth_token:
            return self.log_step("Delete Ricorso", False, 
                               "No authentication token available")
        
        if not self.ricorso_to_delete_id:
            return self.log_step("Delete Ricorso", False, 
                               "No ricorso ID available for deletion")
        
        url = f"{self.base_url}/ricorsi/{self.ricorso_to_delete_id}"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.delete(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get("message", "")
                success = "deleted successfully" in message.lower()
                
                return self.log_step("Delete Ricorso", success,
                                   f"Status: {response.status_code}, Message: {message}")
            else:
                return self.log_step("Delete Ricorso", False, 
                                   f"Unexpected status code: {response.status_code}", response)
        except requests.exceptions.RequestException as e:
            return self.log_step("Delete Ricorso", False, f"Connection error: {str(e)}")

    def step_4_verify_deletion(self):
        """Step 4: Verify deletion by getting ricorsi list again"""
        print("\n📋 STEP 4: Verify deletion")
        print("-" * 40)
        
        url = f"{self.base_url}/ricorsi"
        
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                ricorsi = response.json()
                if isinstance(ricorsi, list):
                    # Check if the deleted ricorso is still in the list
                    found_deleted_ricorso = any(
                        ricorso.get("id") == self.ricorso_to_delete_id 
                        for ricorso in ricorsi
                    )
                    
                    if not found_deleted_ricorso:
                        return self.log_step("Verify Deletion", True,
                                           f"Successfully verified deletion. Ricorso {self.ricorso_to_delete_id} no longer exists. Current count: {len(ricorsi)}")
                    else:
                        return self.log_step("Verify Deletion", False, 
                                           f"Deletion failed - ricorso {self.ricorso_to_delete_id} still exists in list")
                else:
                    return self.log_step("Verify Deletion", False, 
                                       "Invalid response format for ricorsi list", response)
            else:
                return self.log_step("Verify Deletion", False, 
                                   "Failed to retrieve ricorsi for verification", response)
        except requests.exceptions.RequestException as e:
            return self.log_step("Verify Deletion", False, f"Connection error: {str(e)}")

    def step_5_test_unauthorized_delete(self):
        """Step 5: Test unauthorized delete (should return 401)"""
        print("\n📋 STEP 5: Test unauthorized delete")
        print("-" * 40)
        
        # Use a dummy ricorso ID for this test
        dummy_id = "test-unauthorized-delete-id"
        url = f"{self.base_url}/ricorsi/{dummy_id}"
        
        try:
            # Make delete request without auth token
            response = requests.delete(url, timeout=10)
            
            # Should return 401 or 403
            if response.status_code in [401, 403]:
                return self.log_step("Unauthorized Delete Test", True, 
                                   f"Correctly denied unauthorized access (HTTP {response.status_code})")
            else:
                return self.log_step("Unauthorized Delete Test", False, 
                                   f"Expected 401/403, got {response.status_code}", response)
        except requests.exceptions.RequestException as e:
            return self.log_step("Unauthorized Delete Test", False, f"Connection error: {str(e)}")

    def run_delete_test_scenario(self):
        """Run the complete DELETE ricorso test scenario"""
        print("🗑️  DELETE RICORSO FUNCTIONALITY TEST")
        print("=" * 60)
        print(f"Backend URL: {self.base_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        
        steps = [
            self.step_1_login_as_admin,
            self.step_2_get_list_of_ricorsi,
            self.step_3_delete_ricorso,
            self.step_4_verify_deletion,
            self.step_5_test_unauthorized_delete
        ]
        
        results = []
        for step in steps:
            try:
                result = step()
                results.append(result)
                # Stop if a critical step fails
                if not result and step in [self.step_1_login_as_admin, self.step_2_get_list_of_ricorsi]:
                    print(f"\n⛔ Critical step failed. Stopping test.")
                    break
            except Exception as e:
                print(f"❌ FAIL {step.__name__} - Exception: {str(e)}")
                results.append(False)
                break
        
        # Summary
        passed = sum(results)
        total = len(results)
        success_rate = (passed / total) * 100 if total > 0 else 0
        
        print("\n" + "=" * 60)
        print("DELETE RICORSO TEST SUMMARY")
        print("=" * 60)
        print(f"Steps Completed: {passed}/{total} ({success_rate:.1f}%)")
        
        if passed == total and total == 5:
            print("🎉 DELETE FUNCTIONALITY WORKING CORRECTLY!")
            print("   ✅ Admin authentication successful")
            print("   ✅ Ricorsi list retrieval working") 
            print("   ✅ Delete with auth token successful")
            print("   ✅ Deletion verification confirmed")
            print("   ✅ Unauthorized access properly denied")
        else:
            print(f"⚠️  {total - passed} steps failed or incomplete. See details above.")
        
        return passed == total and total == 5


def main():
    """Main test runner"""
    tester = DeleteRicorsoTester()
    success = tester.run_delete_test_scenario()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())