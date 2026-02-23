#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Test the Ricorsi backend API system. This is a complete system with authentication, CRUD for ricorsi, and submissions."

backend:
  - task: "Admin Authentication System"
    implemented: true
    working: true
    file: "/app/backend/server.py, /app/backend/auth.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Admin login working correctly with default credentials (admin/admin123). JWT token generation and validation successful. Authentication check endpoint returns correct user info."

  - task: "Get Ricorsi Public API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Public endpoint /api/ricorsi?attivo=true returns default ricorso correctly. Verified structure with 7 campi_dati, 6 documenti_richiesti including 'Procura alle Liti'. Response format matches Ricorso model."

  - task: "Get Specific Ricorso by ID"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Individual ricorso retrieval working correctly. Endpoint /api/ricorsi/{id} returns full ricorso details with all required fields (id, titolo, descrizione, campi_dati, documenti_richiesti)."

  - task: "Create Ricorso (Admin Only)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Admin-only ricorso creation working correctly. POST /api/ricorsi with authentication creates new ricorso with custom fields and documents. Returns 201 with created ricorso object including generated ID."

  - task: "Update Ricorso (Admin Only)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Ricorso update functionality working correctly. PUT /api/ricorsi/{id} with auth token successfully updates titolo and attivo status. Returns updated ricorso object with modified fields."

  - task: "Submission Creation Flow"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Submission creation working correctly. POST /api/submissions accepts ricorso_id and dati_utente JSON, creates submission with generated ID and reference_id. All required fields present in response."

  - task: "Get Submissions (Admin Only)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 1
    priority: "high"
    needs_retesting: false
    status_history:
      - working: false
        agent: "testing"
        comment: "Initial test failed due to MongoDB ObjectId serialization error (ValueError: ObjectId object is not iterable)"
      - working: true
        agent: "testing"
        comment: "FIXED: Added {\"_id\": 0} projection to exclude MongoDB ObjectId from all find operations. GET /api/submissions now returns submissions list correctly with proper JSON serialization."

  - task: "Authentication Authorization Checks"
    implemented: true
    working: true
    file: "/app/backend/auth.py, /app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Authorization working correctly. GET /api/admin/check with token returns authenticated: true. Unauthorized requests (no token) to protected endpoints correctly return 403 Forbidden."

  - task: "Delete Ricorso (Admin Only)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Delete functionality working correctly. DELETE /api/ricorsi/{id} with auth token successfully removes ricorso and returns success message 'Ricorso deleted successfully'."
      - working: true
        agent: "testing"
        comment: "COMPREHENSIVE DELETE TEST PASSED: Verified complete DELETE workflow: 1) Admin login successful, 2) Ricorsi list retrieval working, 3) DELETE /api/ricorsi/{id} with auth returns 200 status and 'Ricorso deleted successfully', 4) Deletion verified - ricorso no longer exists in list, 5) Unauthorized delete properly denied with 403 status. All 5 test steps passed (100%). DELETE functionality is fully operational."

  - task: "MongoDB ObjectId Serialization Fix"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Fixed JSON serialization issues by adding {\"_id\": 0} projection to all MongoDB find operations (get_ricorsi, get_ricorso, get_submissions, admin lookup, submission creation). All endpoints now return proper JSON without ObjectId errors."

metadata:
  created_by: "testing_agent"
  version: "2.0"
  test_sequence: 2
  run_ui: false
  last_tested: "2026-02-23"

test_plan:
  current_focus:
    - "All backend tests completed successfully"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "testing"
    message: "Comprehensive backend API testing completed successfully for Ricorsi system. All 10 critical test scenarios passed: 1) Admin authentication, 2) Get active ricorsi (public), 3) Get specific ricorso, 4) Create ricorso (admin), 5) Update ricorso (admin), 6) Submission flow, 7) Get submissions (admin), 8) Authentication check, 9) Unauthorized access prevention, 10) Delete ricorso (admin). Fixed MongoDB ObjectId serialization issue in submissions endpoint during testing. Backend API is fully functional and ready for production use. Default admin credentials: admin/admin123. Backend URL: https://credits-compute-1.preview.emergentagent.com/api"
  - agent: "testing"
    message: "DELETE RICORSO FOCUSED TEST COMPLETED: Executed comprehensive DELETE functionality test as requested. All 5 test scenarios passed: 1) Admin login (admin/admin123) ✅, 2) Get ricorsi list and select target ✅, 3) DELETE /api/ricorsi/{id} with auth token returns 200 + success message ✅, 4) Deletion verification - ricorso removed from list ✅, 5) Unauthorized delete properly denied with 403 ✅. DELETE functionality is working correctly and securely. Test file created: /app/delete_ricorso_test.py"