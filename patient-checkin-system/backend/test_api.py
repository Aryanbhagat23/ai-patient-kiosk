from fastapi.testclient import TestClient
from main import app
import os

# Create a test client that can send fake requests to your API
client = TestClient(app)

# --- TEST DATA ---
fake_patient = {
    "firstName": "Test",
    "lastName": "User",
    "dob": "2000-01-01",
    "address": "123 Test St",
    "phone": "555-0000",
    "email": "test@example.com",
    "insurance": {
        "provider": "TestHealth",
        "policy": "123",
        "group": "456"
    },
    # A tiny 1x1 pixel white image in base64 for testing
    "faceImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwf3+ooooA//2Q=="
}

def test_1_health_check():
    """Verify the server is running."""
    print("\n🧪 TEST 1: Health Check")
    response = client.get("/")
    assert response.status_code == 200
    print("✅ Server is online")

def test_2_register_patient():
    """Test registering a new patient."""
    print("\n🧪 TEST 2: Patient Registration")
    response = client.post("/api/v1/patient/register", json=fake_patient)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "patient_id" in data
    # Save ID for next tests
    os.environ["TEST_PATIENT_ID"] = data["patient_id"]
    print(f"✅ Registered test patient with ID: {data['patient_id']}")

def test_3_book_appointment():
    """Test booking an appointment for the patient we just registered."""
    print("\n🧪 TEST 3: Book Appointment")
    patient_id = os.environ.get("TEST_PATIENT_ID")
    fake_appt = {
        "patientId": patient_id,
        "department": "Cardiology",
        "physician": "Dr. Test",
        "date": "2030-01-01",
        "time": "9:00 AM",
        "reason": "Automated Testing"
    }
    response = client.post("/api/v1/appointment/book", json=fake_appt)
    assert response.status_code == 200
    assert response.json()["success"] == True
    print("✅ Appointment booked successfully")

def test_4_admin_security():
    """Verify unauthorized users cannot access admin data."""
    print("\n🧪 TEST 4: Security Check (Unauthorized Access)")
    # Try to login with bad password
    response = client.post("/api/v1/staff/login", json={"username":"admin", "password":"wrongpassword"})
    assert response.status_code == 401
    print("✅ Security blocked invalid login")

def test_5_admin_login_success():
    """Verify correct credentials work."""
    print("\n🧪 TEST 5: Valid Staff Login")
    response = client.post("/api/v1/staff/login", json={"username":"admin", "password":"password123"})
    assert response.status_code == 200
    assert response.json()["success"] == True
    print("✅ Staff login successful")