import json
from bs4 import BeautifulSoup

class DataExtractor:
    def __init__(self, schema_file):
        with open(schema_file) as file:
            self.schema = json.load(file)

    def extract_data(self, soup):
        extracted_data = {}
        for item in self.schema['data_points']:
            elements = soup.select(item['selector'])
            if item['attribute'] == 'text':
                extracted_data[item['name']] = [elem.get_text(strip=True) for elem in elements]
            else:
                extracted_data[item['name']] = [elem[item['attribute']] for elem in elements if elem.has_attr(item['attribute'])]

        return extracted_data
