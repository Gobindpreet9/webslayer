from unittest import TestCase
import unittest
import requests
from datetime import datetime, timedelta, timezone
from copy import deepcopy

from api.examples.schema_examples import SCHEMA_EXAMPLES

class TestReportsRoutes(TestCase):
    """
    Test the reports routes.
    Containers should be running before running these tests.
    Use the following command to start the containers(in the root directory):
    docker compose up -d
    """

    def setUp(self):
        """Set up test case with example schemas and test data"""
        self.base_url = "http://localhost:8000/webslayer"
        self.schema_url = f"{self.base_url}/schema"
        self.reports_url = f"{self.base_url}/reports"

        # Register philosophers schema
        self.philosophers_schema = SCHEMA_EXAMPLES["philosophers_schema"]["value"]
        response = requests.post(f"{self.schema_url}/", json=self.philosophers_schema)
        self.assertEqual(response.status_code, 200, response.json())

        # Create test report
        self.test_report = {
            "name": "test_philosophers_report",
            "schema_name": self.philosophers_schema["name"],
            "content": {
                "philosophers_schema": [
                    {
                        "name": "Socrates",
                        "description": "Classical Greek philosopher, founder of Western philosophy",
                        "area_of_expertise": "Ethics and the Socratic method"
                    }
                ]
            }
        }

    def tearDown(self):
        # Clean up by deleting the test schema and report
        requests.delete(f"{self.schema_url}/{self.philosophers_schema['name']}")
        requests.delete(f"{self.reports_url}/{self.test_report['name']}")

    def test_create_and_get_report(self):
        """Test creating a report and retrieving it"""
        # Create report
        response = requests.post(f"{self.reports_url}/", json=self.test_report)
        self.assertEqual(response.status_code, 200)

        # Get report
        get_response = requests.get(f"{self.reports_url}/{self.test_report['name']}")
        self.assertEqual(get_response.status_code, 200)
        
        report = get_response.json()
        self.assertEqual(report["name"], self.test_report["name"])
        self.assertEqual(report["schema_name"], self.test_report["schema_name"])
        self.assertEqual(len(report["content"]["philosophers_schema"]), 1)
        
        # Verify content
        philosopher = report["content"]["philosophers_schema"][0]
        self.assertEqual(philosopher["name"], "Socrates")
        self.assertEqual(philosopher["area_of_expertise"], "Ethics and the Socratic method")

    def test_list_reports(self):
        """Test listing reports with filters"""
        # Create report first
        response = requests.post(f"{self.reports_url}/", json=self.test_report)
        self.assertEqual(response.status_code, 200)

        # Test listing all reports
        list_response = requests.get(f"{self.reports_url}/")
        self.assertEqual(list_response.status_code, 200)
        reports = list_response.json()
        self.assertGreater(len(reports), 0)

        # Test filtering by schema name
        filter_response = requests.get(
            f"{self.reports_url}/?schema_name={self.philosophers_schema['name']}"
        )
        self.assertEqual(filter_response.status_code, 200)
        filtered_reports = filter_response.json()
        self.assertGreater(len(filtered_reports), 0)
        self.assertEqual(filtered_reports[0]["schema_name"], self.philosophers_schema["name"])

    def test_create_blank_report_422(self):
        """Test creating a report with empty content"""
        blank_report = {
            "name": "blank_report",
            "schema_name": self.philosophers_schema["name"],
            "content": {},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        response = requests.post(f"{self.reports_url}/", json=blank_report)
        self.assertEqual(response.status_code, 422)

    def test_create_non_json_report_422(self):
        """Test creating a report with non-JSON content"""
        invalid_report = {
            "name": "invalid_report",
            "schema_name": self.philosophers_schema["name"],
            "content": "This is not JSON",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        response = requests.post(f"{self.reports_url}/", json=invalid_report)
        self.assertEqual(response.status_code, 422)

    def test_create_report_schema_not_exists_404(self):
        """Test creating a report with non-existent schema"""
        report = {
            "name": "nonexistent_schema_report",
            "schema_name": "nonexistent_schema",
            "content": {
                "philosophers_schema": [
                    {
                        "name": "Socrates",
                        "description": "Classical Greek philosopher",
                        "area_of_expertise": "Ethics"
                    }
                ]
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        response = requests.post(f"{self.reports_url}/", json=report)
        self.assertEqual(response.status_code, 404)

    def test_get_report_file(self):
        """Test downloading a report as a JSON file"""
        # First create a report
        response = requests.post(f"{self.reports_url}/", json=self.test_report)
        self.assertEqual(response.status_code, 200)

        # Then try to download it
        file_response = requests.get(f"{self.reports_url}/file/{self.test_report['name']}")
        self.assertEqual(file_response.status_code, 200)
        self.assertEqual(file_response.headers['content-type'], 'application/json')
        
        # Verify content
        content = file_response.json()
        self.assertIn('philosophers_schema', content)
        self.assertEqual(len(content['philosophers_schema']), 1)
        philosopher = content['philosophers_schema'][0]
        self.assertEqual(philosopher['name'], 'Socrates')

    def test_create_report_with_timestamp_200(self):
        """Test that timestamp is auto-generated regardless of provided value"""
        # Create report with future timestamp
        future_timestamp = datetime(2100, 1, 1, tzinfo=timezone.utc).isoformat()
        report_with_timestamp = {
            "name": "report_with_timestamp",
            "schema_name": self.philosophers_schema["name"],
            "content": {
                "philosophers_schema": [
                    {
                        "name": "Plato",
                        "description": "Classical Greek philosopher",
                        "area_of_expertise": "Metaphysics"
                    }
                ]
            },
            "timestamp": future_timestamp
        }
        
        response = requests.post(f"{self.reports_url}/", json=report_with_timestamp)
        self.assertEqual(response.status_code, 200)

        # Get report to verify timestamp
        get_response = requests.get(f"{self.reports_url}/{report_with_timestamp['name']}")
        self.assertEqual(get_response.status_code, 200)
        
        report = get_response.json()
        report_timestamp = datetime.fromisoformat(report["timestamp"])
        
        # Verify timestamp is recent (within last minute) and not our future date
        now = datetime.now(timezone.utc)
        self.assertLess(now - report_timestamp, timedelta(minutes=1))
        self.assertNotEqual(report_timestamp.isoformat(), future_timestamp)

        # Clean up
        requests.delete(f"{self.reports_url}/{report_with_timestamp['name']}")

    def test_delete_schema_with_reports_200(self):
        """Test deleting a schema with reports"""
        # Create report
        response = requests.post(f"{self.reports_url}/", json=self.test_report)
        self.assertEqual(response.status_code, 200)

        # Delete schema
        delete_response = requests.delete(f"{self.schema_url}/{self.philosophers_schema['name']}")
        self.assertEqual(delete_response.status_code, 200)

        # Verify report is still there
        get_response = requests.get(f"{self.reports_url}/{self.test_report['name']}")
        self.assertEqual(get_response.status_code, 200)

        # Clean up
        requests.delete(f"{self.reports_url}/{self.test_report['name']}")

if __name__ == "__main__":
    unittest.main() 