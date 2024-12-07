from unittest import TestCase
import unittest
import requests
from copy import deepcopy
import time

from api.examples.schema_examples import SCHEMA_EXAMPLES
from api.models import ModelType

class TestScrapingRoutes(TestCase):
    """
    Test the scraping routes.
    Containers should be running before running these tests.
    Use the following command to start the containers(in the root directory):
    docker compose up -d
    """

    def setUp(self):
        """Set up test case with example schemas and test data"""
        self.base_url = "http://localhost:8000/webslayer"
        self.schema_url = f"{self.base_url}/schema"
        self.scrape_url = f"{self.base_url}/scrape"

        # Register schema
        self.events_schema = SCHEMA_EXAMPLES["events_schema"]["value"]
        response = requests.post(f"{self.schema_url}/", json=self.events_schema)
        self.assertEqual(response.status_code, 200, response.json())
        

    def tearDown(self):
        # Clean up by deleting the test schema
        requests.delete(f"{self.schema_url}/{self.events_schema['name']}")

    def test_scrape_eventsbrite_list_returned(self):
        """Test a complete scraping workflow from start to finish"""
        # 1. Start the scraping job
        job_request = self.get_job_request_with_list_no_crawl()
        start_response = requests.post(f"{self.scrape_url}/start", json=job_request)
        self.assertEqual(start_response.status_code, 200)
        
        job_data = start_response.json()
        self.assertIn("job_id", job_data)
        self.assertEqual(job_data["status"], "accepted")
        
        job_id = job_data["job_id"]
        
        # 2. Poll for job completion
        max_attempts = 30
        poll_interval = 10
        
        for _ in range(max_attempts):
            status_response = requests.get(f"{self.scrape_url}/{job_id}")
            self.assertEqual(status_response.status_code, 200)
            
            status_data = status_response.json()
            self.assertEqual(status_data["job_id"], job_id)
            print(f"Status: {status_data['status']}")   
            
            if status_data["status"] in ["success", "failed"]:
                break
                
            time.sleep(poll_interval)
        
        # 3. Verify final result
        final_response = requests.get(f"{self.scrape_url}/{job_id}")
        self.assertEqual(final_response.status_code, 200)
        
        final_data = final_response.json()
        self.assertEqual(final_data["job_id"], job_id)
        self.assertEqual(final_data["status"], "success")
        
        # Verify result structure
        self.assertIn("result", final_data)
        result = final_data["result"]
        self.assertIsInstance(result, dict)
        self.assertEqual(result["status"], "completed")
        
        # Verify extracted data
        events = result["result"]
        self.assertIsInstance(events, list)
        self.assertGreater(len(events), 0)
        
        # Verify event structure
        for event in events:
            # Required fields
            self.assertIn("event_name", event)
            self.assertIn("event_date", event)
            self.assertIn("description", event)
            self.assertIn("event_tags", event)
            
            # Content checks
            self.assertGreater(len(event["event_name"]), 0)
            # Add more content checks here when standardized. 
            # TODO: Standardize date format

    def test_scrape_blank_page_list_returned(self):
        """Test a complete scraping workflow from start to finish"""
        # 1. Start the scraping job
        job_request = self.get_job_request_with_list_no_crawl()
        job_request["urls"] = ["https://www.webpagetest.org/blank.html"]
        start_response = requests.post(f"{self.scrape_url}/start", json=job_request)
        self.assertEqual(start_response.status_code, 200)
        
        job_data = start_response.json()
        print(f"Job started: {job_data}")
        self.assertIn("job_id", job_data)
        self.assertEqual(job_data["status"], "accepted")
        
        job_id = job_data["job_id"]
        
        # 2. Poll for job completion
        max_attempts = 3
        poll_interval = 5
        
        for _ in range(max_attempts):
            status_response = requests.get(f"{self.scrape_url}/{job_id}")
            self.assertEqual(status_response.status_code, 200)
            
            status_data = status_response.json()
            self.assertEqual(status_data["job_id"], job_id)
            print(f"Status: {status_data['status']}")   
            
            if status_data["status"] in ["success", "failed"]:
                break
                
            time.sleep(poll_interval)
        
        # 3. Verify final result
        final_response = requests.get(f"{self.scrape_url}/{job_id}")
        self.assertEqual(final_response.status_code, 200)
        
        final_data = final_response.json()
        self.assertEqual(final_data["job_id"], job_id)
        self.assertEqual(final_data["status"], "success")
        
        # Verify result structure
        self.assertIn("result", final_data)
        result = final_data["result"]
        self.assertIsInstance(result, dict)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["status_code"], 400)
        self.assertEqual(result["error"], "Unable to fetch data from provided URLs")

    def test_start_job_invalid_schema_404(self):
        """Test starting job with non-existent schema"""
        job_request = self.get_job_request_with_list_no_crawl()
        job_request["schema_name"] = "non_existent_schema"
        
        response = requests.post(f"{self.scrape_url}/start", json=job_request)
        self.assertEqual(response.status_code, 404)

    def test_start_job_invalid_request_422(self):
        """Test starting job with invalid request data"""
        job_request = self.get_job_request_with_list_no_crawl()
        job_request.pop("urls")  # Remove required field
        
        response = requests.post(f"{self.scrape_url}/start", json=job_request)
        self.assertEqual(response.status_code, 422)


    def get_job_request_with_list_no_crawl(self):
        """Helper method to create a standard job request with list output and no crawling"""
        return {
            "urls": ["https://www.eventbrite.com/d/online/free--events/"],
            "schema_name": self.events_schema["name"],
            "return_schema_list": True,
            "llm_model_type": ModelType.ollama.value,
            "llm_model_name": "llama3.1:8b-instruct-q5_0",
            "crawl_config": {
                "enable_crawling": False,
                "max_depth": 2,
                "max_urls": 3,
                "enable_chunking": True,
                "chunk_size": 10000,
                "chunk_overlap": 200
            },
            "scraper_config": {
                "max_hallucination_checks": 2,
                "max_quality_checks": 2
            }
        }    

if __name__ == "__main__":
    unittest.main() 