from copy import deepcopy
import unittest
import requests

from api.examples.schema_examples import SCHEMA_EXAMPLES

class TestSchemaRoutes(unittest.TestCase):
    """
    Test the schema routes.
    Containers should be running before running these tests.
    Use the following command to start the containers(in the root directory):
    docker compose up -d
    """
    
    def setUp(self):
        """Set up test case with example schemas"""
        self.base_url = "http://localhost:8000/webslayer/schema"
        
        # Create copies of our example schemas to avoid modifying originals
        self.philosophers_schema = deepcopy(SCHEMA_EXAMPLES["philosophers_schema"]["value"])
        self.events_schema = deepcopy(SCHEMA_EXAMPLES["events_schema"]["value"])
        
        # Register both schemas
        response = requests.post(f"{self.base_url}/", json=self.philosophers_schema)
        self.assertEqual(response.status_code, 200, response.json())
        response = requests.post(f"{self.base_url}/", json=self.events_schema)
        self.assertEqual(response.status_code, 200, response.json())

    def tearDown(self):
        # Clean up by deleting the test schema if it exists
        requests.delete(f"{self.base_url}/{self.philosophers_schema['name']}")
        requests.delete(f"{self.base_url}/{self.events_schema['name']}")

    def test_get_all_schemas_200(self):
        response = requests.get(f"{self.base_url}/")
        
        # Add debug print to see what we're getting
        print("Response content:", response.content)
        print("Response JSON:", response.json())
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0], self.philosophers_schema["name"])
        self.assertEqual(data[1], self.events_schema["name"])

    def test_post_register_schema_200(self):
        test_schema = {
            "name": "test_schema",
            "fields": [
                {
                "name": "id",
                "field_type": "integer",
                "description": "Unique identifier for the item",
                "required": True
                },
                {
                    "name": "is_active",
                    "field_type": "boolean",
                    "description": "Whether the item is active",
                    "required": True
                }
            ]}
        
        response = requests.post(f"{self.base_url}/", json=test_schema)
        self.assertEqual(response.status_code, 200)
        returned_schema = response.json()
        self.assertEqual(returned_schema["name"], test_schema["name"])
        self.assertEqual(len(returned_schema["fields"]), 2)
        self.assertEqual(returned_schema["fields"][0]["name"], "id")
        self.assertEqual(returned_schema["fields"][0]["field_type"], "integer")
        self.assertEqual(returned_schema["fields"][1]["name"], "is_active")
        self.assertEqual(returned_schema["fields"][1]["field_type"], "boolean")

        requests.delete(f"{self.base_url}/{test_schema['name']}")

    def test_get_schema_by_name_200(self):
        philosopher_schema_name = SCHEMA_EXAMPLES["philosophers_schema"]["value"]["name"]
        get_response = requests.get(f"{self.base_url}/{philosopher_schema_name}")
        self.assertEqual(get_response.status_code, 200)
        schema = get_response.json()
        self.assertEqual(schema["name"],philosopher_schema_name)
        self.assertEqual(len(schema["fields"]), 3)

    def test_delete_schema_200(self):
        philosopher_schema_name = SCHEMA_EXAMPLES["philosophers_schema"]["value"]["name"]
        delete_response = requests.delete(f"{self.base_url}/{philosopher_schema_name}")
        
        self.assertEqual(delete_response.status_code, 200)
        self.assertTrue(delete_response.json())

        get_response = requests.get(f"{self.base_url}/{philosopher_schema_name}")
        self.assertEqual(get_response.status_code, 404)

    def test_get_schema_not_found_404(self):
        non_existent_schema = "non_existent_schema_12345"
        response = requests.get(f"{self.base_url}/{non_existent_schema}")
        self.assertEqual(response.status_code, 404)

    def test_post_register_schema_invalid_422(self):
        invalid_schema = {
            "fields": [
                {
                    "name": "title",
                    "field_type": "string",
                    "description": "Title of the item",
                    "required": True
                }
            ]
        }
        response = requests.post(f"{self.base_url}/", json=invalid_schema)
        self.assertEqual(response.status_code, 422)  # Unprocessable Entity

    def test_update_existing_schema_200(self):
        philosopher_schema_name = SCHEMA_EXAMPLES["philosophers_schema"]["value"]["name"]
        get_response = requests.get(f"{self.base_url}/{philosopher_schema_name}")
        # update the schema
        schema = get_response.json()
        schema["fields"].append({
            "name": "birth_date",
            "field_type": "date",
            "description": "Date of birth of the philosopher",
            "required": True
        })
        schema["fields"][0]["required"] = False

        post_response1 = requests.post(f"{self.base_url}/", json=schema)
        self.assertEqual(post_response1.status_code, 200)

        # Assert the changes
        get_response = requests.get(f"{self.base_url}/{philosopher_schema_name}")
        self.assertEqual(get_response.status_code, 200)
        updated_schema = get_response.json()
        self.assertEqual(len(updated_schema["fields"]), 4)
        self.assertEqual(updated_schema["fields"][3]["name"], "birth_date")
        self.assertEqual(updated_schema["fields"][0]["required"], False)

if __name__ == "__main__":
    unittest.main() 