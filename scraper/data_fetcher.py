from typing import Optional, List
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import urllib.robotparser
from playwright.async_api import async_playwright
import asyncio
from core.settings import Settings
settings = Settings()

class DataFetcher:
    def __init__(self, logger, should_crawl, max_depth, max_urls_to_search):
        self.validators = {}
        self.logger = logger
        self.should_crawl = should_crawl
        self.max_depth = max_depth
        self.urls_visited = set()
        self.max_urls_to_search = max_urls_to_search
        self.playwright = None
        self.browser = None
        self.initialization_task = asyncio.create_task(self.initialize_playwright())

    async def initialize_playwright(self):
        try:
            if not self.playwright:
                self.playwright = await async_playwright().start()
            if not self.browser:
                self.browser = await self.playwright.firefox.launch(headless=True)
            self.logger.info("Playwright initialized successfully.")
        except Exception as e:
            self.logger.error(f"Failed to initialize Playwright: {e}")
            await self.cleanup()
            raise RuntimeError(f"Failed to initialize browser: {e}")

    async def cleanup(self):
        """Cleanup Playwright resources"""
        try:
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")

    def __del__(self):
        """Ensure cleanup runs when object is destroyed"""
        if self.browser or self.playwright:
            asyncio.create_task(self.cleanup())

    async def fetch_data(self, urls):
        """
        Gets data from a list of urls if permitted by robots.txt
        """
        try:
            await self.initialization_task

            if not urls or len(urls) == 0:
                self.logger.debug("No URLs provided.")
                return None

            content = []
            if self.should_crawl:
                data = await self.crawl_website(urls)
                if data:
                    content = data
            else:
                for url in urls:
                    data = await self.get_single_page_data(url)
                    if data:
                        content.append(data)

            return content
        finally:
            await self.cleanup()

    async def crawl_website(self, start_urls: List[str]) -> List[str]:
        urls_to_visit = [(url, 0) for url in start_urls]
        data = []

        try:
            while len(urls_to_visit) > 0:
                url, depth = urls_to_visit.pop(0)
                domain = urlparse(url).netloc

                if len(self.urls_visited) >= self.max_urls_to_search:
                    break

                if url in self.urls_visited or depth > self.max_depth:
                    continue

                if not self.is_allowed_by_robots(url):
                    self.logger.debug(f"Access denied for {url}. Please check the robots.txt file.")
                    continue

                soup = await self.get_page(url)
                if soup:
                    urls = self.get_urls_from_page(soup, url, domain, urls_to_visit)
                    urls_to_visit += [(url, depth + 1) for url in urls]
                    data.append(self.clean_data(soup))
                    self.urls_visited.add(url)
                    self.logger.debug(f"URL visited: {url}.")

                await asyncio.sleep(1)  # to avoid rate limiting

        except Exception as e:
            self.logger.error(f"Error during crawling: {e}")
        finally:
            self.urls_visited.clear()

        return data

    async def get_single_page_data(self, url: str) -> Optional[str]:
        """
        Fetches data from a single URL if permitted by robots.txt
        """
        if url in self.urls_visited:
            return None

        if not self.is_allowed_by_robots(url):
            self.logger.debug(f"Access denied for {url}. Please check the robots.txt file.")
            return None

        try:
            soup = await self.get_page(url)
            if soup:
                self.urls_visited.add(url)
                return self.clean_data(soup)
        except Exception as e:
            self.logger.error(f"Error fetching single page: {e}")

    async def get_page(self, url):
        try:
            page = await self.browser.new_page()
            await page.goto(url)
            page_source = await page.content()
            soup = self.parse_html(page_source)
            await page.close()
            return soup
        except Exception as e:
            self.logger.error(f"An error occurred: {e}")
            return None

    def parse_html(self, html_content):
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            return soup
        except Exception as e:
            self.logger.error(f"Error parsing HTML: {e}")
            return None

    def clean_data(self, soup):
        cleaned_tags = self.remove_unwanted_tags(soup)
        extracted_content = self.extract_tags(cleaned_tags, ["h1", "h2", "h3", "span", "a", "href", "p"])  # Example tag list
        return self.remove_unnecessary_lines(str(extracted_content))

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
        for element in soup.descendants:
            if hasattr(element, 'name') and element.name in tags:
                if element.name == "a":
                    href = element.get('href')
                    if href:
                        text_parts.append(f"**{element.get_text()}** ({href})")
                    else:
                        text_parts.append(element.get_text())
                else:
                    text_parts.append(element.get_text())

        return ' '.join(text_parts)

    def get_urls_from_page(self, soup, base_url, domain, urls_to_visit):
        """
        Returns all list of URLs from the given page soup
        """
        urls = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            full_url = urljoin(base_url, href)
            if urlparse(full_url).netloc == domain:
                if full_url not in self.urls_visited and full_url not in urls_to_visit:
                    urls.append(full_url)
                    self.logger.debug(f"Added URL: {full_url}.")  # Add tests and make sure not adding duplicates
            else:
                self.logger.debug(f"Skipping URL: {full_url}. Not in domain.")
        return urls

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

    def get_robots_validator(self, url):
        """
        Configures validator using robots.txt for url permissions
        """
        if url is None:
            return None
        robots = urllib.robotparser.RobotFileParser()
        parsed_url = urlparse(url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}/"
        try:
            if self.validators.get(base_url) is None:
                robots.set_url(base_url + "robots.txt")
                robots.read()
                self.validators[base_url] = robots
        except Exception as e:
            self.logger.error(f"Error fetching robots.txt for {base_url}: {e}")
            return None
        return robots

    def is_allowed_by_robots(self, url):
        if settings.IGNORE_ROBOTS:
            return True
        validator = self.get_robots_validator(url)
        return validator.can_fetch("*", url) if validator else True
