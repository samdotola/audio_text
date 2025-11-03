import requests
import sys
import os
import tempfile
from datetime import datetime
import json

class AudioTranscriptionAPITester:
    def __init__(self, base_url="https://voiceshift-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data}"
            self.log_test("API Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Error: {str(e)}")
            return False

    def test_get_transcriptions_empty(self):
        """Test getting transcriptions when none exist"""
        try:
            response = requests.get(f"{self.api_url}/transcriptions", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Count: {len(data)} transcriptions"
            self.log_test("Get Transcriptions (Empty)", success, details)
            return success, response.json() if success else []
        except Exception as e:
            self.log_test("Get Transcriptions (Empty)", False, f"Error: {str(e)}")
            return False, []

    def create_test_audio_file(self):
        """Create a small test audio file for testing"""
        # Create a minimal WAV file (44 bytes header + minimal audio data)
        wav_header = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_file.write(wav_header)
        temp_file.close()
        
        return temp_file.name

    def test_transcribe_audio_invalid_file(self):
        """Test transcription with invalid file type"""
        try:
            # Create a text file instead of audio
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.txt', mode='w')
            temp_file.write("This is not an audio file")
            temp_file.close()
            
            with open(temp_file.name, 'rb') as f:
                files = {'file': ('test.txt', f, 'text/plain')}
                response = requests.post(
                    f"{self.api_url}/transcribe?language=en",
                    files=files,
                    timeout=30
                )
            
            # Should return 400 for invalid file type
            success = response.status_code == 400
            details = f"Status: {response.status_code}"
            if response.status_code == 400:
                details += f", Error: {response.json().get('detail', 'No detail')}"
            
            self.log_test("Transcribe Invalid File Type", success, details)
            
            # Cleanup
            os.unlink(temp_file.name)
            return success
            
        except Exception as e:
            self.log_test("Transcribe Invalid File Type", False, f"Error: {str(e)}")
            return False

    def test_transcribe_audio_valid_file(self):
        """Test transcription with valid audio file"""
        try:
            # Create test audio file
            audio_file_path = self.create_test_audio_file()
            
            with open(audio_file_path, 'rb') as f:
                files = {'file': ('test_audio.wav', f, 'audio/wav')}
                response = requests.post(
                    f"{self.api_url}/transcribe?language=en",
                    files=files,
                    timeout=60  # Longer timeout for AI processing
                )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            transcription_id = None
            
            if success:
                data = response.json()
                transcription_id = data.get('id')
                details += f", ID: {transcription_id}, Text length: {len(data.get('text', ''))}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Raw response: {response.text[:200]}"
            
            self.log_test("Transcribe Valid Audio File", success, details)
            
            # Cleanup
            os.unlink(audio_file_path)
            return success, transcription_id
            
        except Exception as e:
            self.log_test("Transcribe Valid Audio File", False, f"Error: {str(e)}")
            return False, None

    def test_get_transcriptions_with_data(self):
        """Test getting transcriptions after creating one"""
        try:
            response = requests.get(f"{self.api_url}/transcriptions", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            transcriptions = []
            
            if success:
                transcriptions = response.json()
                details += f", Count: {len(transcriptions)} transcriptions"
                if transcriptions:
                    details += f", Latest: {transcriptions[0].get('filename', 'Unknown')}"
            
            self.log_test("Get Transcriptions (With Data)", success, details)
            return success, transcriptions
            
        except Exception as e:
            self.log_test("Get Transcriptions (With Data)", False, f"Error: {str(e)}")
            return False, []

    def test_delete_transcription(self, transcription_id):
        """Test deleting a transcription"""
        if not transcription_id:
            self.log_test("Delete Transcription", False, "No transcription ID provided")
            return False
            
        try:
            response = requests.delete(f"{self.api_url}/transcriptions/{transcription_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Raw response: {response.text[:200]}"
            
            self.log_test("Delete Transcription", success, details)
            return success
            
        except Exception as e:
            self.log_test("Delete Transcription", False, f"Error: {str(e)}")
            return False

    def test_delete_nonexistent_transcription(self):
        """Test deleting a non-existent transcription"""
        try:
            fake_id = "nonexistent-id-12345"
            response = requests.delete(f"{self.api_url}/transcriptions/{fake_id}", timeout=10)
            success = response.status_code == 404
            details = f"Status: {response.status_code}"
            
            if response.status_code == 404:
                try:
                    data = response.json()
                    details += f", Error: {data.get('detail', 'No detail')}"
                except:
                    pass
            
            self.log_test("Delete Non-existent Transcription", success, details)
            return success
            
        except Exception as e:
            self.log_test("Delete Non-existent Transcription", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Audio Transcription API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)
        
        # Test 1: API Root
        if not self.test_api_root():
            print("❌ API is not accessible. Stopping tests.")
            return self.generate_report()
        
        # Test 2: Get empty transcriptions
        self.test_get_transcriptions_empty()
        
        # Test 3: Invalid file upload
        self.test_transcribe_audio_invalid_file()
        
        # Test 4: Valid file upload (this might fail due to minimal audio file)
        success, transcription_id = self.test_transcribe_audio_valid_file()
        
        # Test 5: Get transcriptions with data
        self.test_get_transcriptions_with_data()
        
        # Test 6: Delete transcription (if we have one)
        if transcription_id:
            self.test_delete_transcription(transcription_id)
        
        # Test 7: Delete non-existent transcription
        self.test_delete_nonexistent_transcription()
        
        return self.generate_report()

    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    tester = AudioTranscriptionAPITester()
    report = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if report["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())