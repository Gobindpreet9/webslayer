from bs4 import BeautifulSoup
import chromedriver_autoinstaller
from selenium import webdriver
import logging

logger = logging.getLogger(__name__)

chromedriver_autoinstaller.install()


class DataFetcher:
    def __init__(self, logger):
        self.logger = logger

    def get_data(self, url):
        soup = self.get_page(url)
        if soup:
            return self.clean_data(soup)
        return None

    def get_page(self, url):
        driver = webdriver.Chrome()
        page_source = None
        try:
            driver.implicitly_wait(10)
            driver.get(url)
            page_source = driver.page_source
            return self.parse_html(page_source)
        except Exception as e:
            self.logger.error(f"An error occurred: {e}")
        finally:
            driver.quit()

    def parse_html(self, html_content):
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            return soup
        except Exception as e:
            self.logger.error(f"Error parsing HTML: {e}")
            return None

    def clean_data(self, soup):
        cleaned_tags = self.remove_unwanted_tags(soup)
        extracted_content = self.extract_tags(cleaned_tags, ["h1", "h2", "h3", "span", "a", "href"])  # Example tag list
        return self.remove_unnecessary_lines(extracted_content)

    @staticmethod
    def remove_unwanted_tags(soup, unwanted_tags=["script", "style"]):
        for tag in unwanted_tags:
            for element in soup.find_all(tag):
                element.decompose()
        return soup

    @staticmethod
    def extract_tags(soup, tags: list[str]):
        """
           This takes in HTML content and a list of tags, and returns a string
           containing the text content of all elements with those tags, along with their href attribute if the
           tag is an "a" tag.
           """
        text_parts = []

        for tag in tags:
            elements = soup.find_all(tag)
            for element in elements:
                # If the tag is a link (a tag), append its href as well
                if tag == "a":
                    href = element.get('href')
                    if href:
                        text_parts.append(f"{element.get_text()} ({href})")
                    else:
                        text_parts.append(element.get_text())
                else:
                    text_parts.append(element.get_text())

        return ' '.join(text_parts)

    @staticmethod
    def remove_unnecessary_lines(content):
        # Split content into lines
        lines = content.split("\n")

        # Strip whitespace for each line
        stripped_lines = [line.strip() for line in lines]

        # Filter out empty lines
        non_empty_lines = [line for line in stripped_lines if line]

        # Remove duplicated lines (while preserving order)
        seen = set()
        deduped_lines = [line for line in non_empty_lines if not (
                line in seen or seen.add(line))]

        # Join the cleaned lines without any separators (remove newlines)
        cleaned_content = "".join(deduped_lines)

        return cleaned_content
