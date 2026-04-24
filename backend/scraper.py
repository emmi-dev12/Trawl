import asyncio
import re
from typing import Optional, List, Dict, Any
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

from playwright.async_api import async_playwright, Page, Browser, BrowserContext

logger = logging.getLogger(__name__)


@dataclass
class ScrapedPage:
    url: str
    title: str
    text: str
    links: List[str]
    structured: Dict[str, Any]


class TrawlScraper:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.pages_scraped: List[ScrapedPage] = []
        self.visited_urls: set = set()
        self.queue: List[tuple[str, int]] = []
        self.active = False
        self.progress_callback = None
        self.stop_requested = False

    async def start(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        self.context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )

    async def stop(self):
        self.active = False
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    def _report_progress(self, current: int, total: int, message: str = ""):
        if self.progress_callback:
            self.progress_callback({
                "current": current,
                "total": total,
                "message": message,
                "pages": self.pages_scraped
            })

    def _normalize_url(self, url: str, base_url: str) -> Optional[str]:
        try:
            absolute_url = urljoin(base_url, url)
            parsed = urlparse(absolute_url)

            # Skip non-HTTP(S) protocols
            if parsed.scheme not in ("http", "https"):
                return None

            # Skip anchors
            if absolute_url.endswith("#"):
                return None

            # Remove fragments for consistency
            return f"{parsed.scheme}://{parsed.netloc}{parsed.path}{'?' + parsed.query if parsed.query else ''}"
        except Exception:
            return None

    def _is_same_domain(self, url: str, base_url: str) -> bool:
        try:
            url_domain = urlparse(url).netloc
            base_domain = urlparse(base_url).netloc
            return url_domain == base_domain
        except Exception:
            return False

    def _should_skip_url(self, url: str) -> bool:
        skip_domains = {"facebook.com", "twitter.com", "instagram.com", "linkedin.com", "github.com"}
        skip_extensions = {".pdf", ".zip", ".exe", ".dmg", ".pkg", ".tar", ".gz"}

        if url.startswith(("mailto:", "tel:", "javascript:", "data:")):
            return True

        for domain in skip_domains:
            if domain in urlparse(url).netloc:
                return True

        url_lower = url.lower()
        for ext in skip_extensions:
            if url_lower.endswith(ext):
                return True

        return False

    async def _extract_links(self, page: Page, base_url: str) -> List[str]:
        try:
            href_list = await page.evaluate("""
                () => {
                    return Array.from(document.querySelectorAll('a[href]'))
                        .map(a => a.href)
                        .filter(href => href && href.trim());
                }
            """)

            links = []
            for href in href_list:
                normalized = self._normalize_url(href, base_url)
                if normalized and not self._should_skip_url(normalized):
                    links.append(normalized)

            # Deduplicate
            return list(dict.fromkeys(links))
        except Exception as e:
            logger.error(f"Error extracting links: {e}")
            return []

    async def _extract_text(self, page: Page) -> str:
        try:
            text = await page.inner_text("body")
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return ""

    async def _extract_title(self, page: Page) -> str:
        try:
            title = await page.title()
            return title.strip()
        except Exception as e:
            logger.error(f"Error extracting title: {e}")
            return ""

    async def _detect_tables(self, page: Page) -> List[Dict]:
        try:
            tables = await page.evaluate("""
                () => {
                    const tables = [];
                    document.querySelectorAll('table').forEach((table, idx) => {
                        const rows = [];
                        table.querySelectorAll('tr').forEach(tr => {
                            const cells = [];
                            tr.querySelectorAll('td, th').forEach(td => {
                                cells.push(td.innerText.trim());
                            });
                            if (cells.length > 0) rows.push(cells);
                        });
                        if (rows.length > 0) {
                            tables.push({type: 'table', index: idx, rows: rows});
                        }
                    });
                    return tables;
                }
            """)
            return tables
        except Exception:
            return []

    async def _extract_structured_data(self, page: Page) -> Dict[str, Any]:
        tables = await self._detect_tables(page)
        return {"tables": tables} if tables else {}

    async def _accept_cookies(self, page: Page):
        try:
            cookie_selectors = [
                'button:has-text("Accept")',
                'button:has-text("accept")',
                'button:has-text("Agree")',
                'button:has-text("OK")',
            ]

            for selector in cookie_selectors:
                try:
                    if await page.query_selector(selector):
                        await page.click(selector)
                        await asyncio.sleep(0.5)
                        break
                except Exception:
                    continue
        except Exception:
            pass

    async def _handle_infinite_scroll(self, page: Page, max_iterations: int = 10):
        try:
            # Find best scroll container
            container_info = await page.evaluate("""
                () => {
                    let best = {elem: window, score: 0};

                    const candidates = [
                        document.documentElement,
                        document.body,
                        ...document.querySelectorAll('[style*="overflow"], [class*="scroll"]')
                    ];

                    for (const elem of candidates) {
                        if (!elem) continue;
                        const scrollHeight = elem.scrollHeight || 0;
                        const clientHeight = elem.clientHeight || 0;
                        const hasOverflow = scrollHeight > clientHeight;
                        const hasLinks = elem.querySelectorAll('a').length > 0;

                        let score = 0;
                        if (hasOverflow) score += 10;
                        if (hasLinks) score += 5;
                        score += Math.max(0, scrollHeight - clientHeight) / 100;

                        if (score > best.score) {
                            best = {elem: elem, score: score};
                        }
                    }

                    return {
                        isWindow: best.elem === window,
                        scrollHeight: best.elem.scrollHeight || document.documentElement.scrollHeight,
                        clientHeight: best.elem.clientHeight || window.innerHeight
                    };
                }
            """)

            last_count = 0
            no_change_iterations = 0

            for iteration in range(max_iterations):
                if self.stop_requested:
                    break

                # Scroll down
                await page.evaluate("""
                    () => {
                        window.scrollBy(0, 500);
                        const elem = document.documentElement;
                        if (elem.scrollHeight > elem.clientHeight) {
                            elem.scrollTop = elem.scrollHeight;
                        }
                    }
                """)

                await asyncio.sleep(1.0)

                # Count visible links
                current_count = await page.evaluate("() => document.querySelectorAll('a').length")

                if current_count == last_count:
                    no_change_iterations += 1
                    if no_change_iterations >= 2:
                        break
                else:
                    no_change_iterations = 0
                    last_count = current_count
        except Exception as e:
            logger.warning(f"Scroll handling error: {e}")

    async def _scrape_page(self, url: str) -> Optional[ScrapedPage]:
        retry_count = 0
        max_retries = 3

        while retry_count < max_retries:
            try:
                page = await self.context.new_page()

                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                    await asyncio.sleep(0.5)

                    await self._accept_cookies(page)
                    await asyncio.sleep(0.5)

                    # Handle scrolling
                    await self._handle_infinite_scroll(page)

                    # Extract data
                    title = await self._extract_title(page)
                    text = await self._extract_text(page)
                    links = await self._extract_links(page, url)
                    structured = await self._extract_structured_data(page)

                    result = ScrapedPage(
                        url=url,
                        title=title,
                        text=text[:5000],  # Limit text
                        links=links[:100],  # Limit links
                        structured=structured
                    )

                    return result
                finally:
                    await page.close()

            except Exception as e:
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = 2 ** retry_count
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Failed to scrape {url} after {max_retries} retries: {e}")
                    return None

    async def scrape(
        self,
        url: str,
        mode: str = "single",
        depth: int = 2,
        max_pages: int = 50,
        scroll: bool = True,
        extract: List[str] = None
    ) -> Dict[str, Any]:
        self.pages_scraped = []
        self.visited_urls = set()
        self.queue = [(url, 0)]
        self.active = True
        self.stop_requested = False

        start_time = datetime.now()

        try:
            while self.queue and len(self.pages_scraped) < max_pages and self.active:
                current_url, current_depth = self.queue.pop(0)

                if self.stop_requested:
                    break

                if current_url in self.visited_urls:
                    continue

                if current_depth > depth and mode == "crawl":
                    continue

                self.visited_urls.add(current_url)
                self._report_progress(
                    len(self.pages_scraped),
                    max_pages,
                    f"Scraping: {current_url[:50]}..."
                )

                page_data = await self._scrape_page(current_url)

                if page_data:
                    self.pages_scraped.append(page_data)

                    # Add new links to queue (crawl mode only)
                    if mode == "crawl" and current_depth < depth:
                        for link in page_data.links:
                            if link not in self.visited_urls and self._is_same_domain(link, url):
                                self.queue.append((link, current_depth + 1))

            duration = (datetime.now() - start_time).total_seconds()

            return {
                "pages": [asdict(p) for p in self.pages_scraped],
                "count": len(self.pages_scraped),
                "duration_seconds": round(duration, 2)
            }
        finally:
            self.active = False

    def request_stop(self):
        self.stop_requested = True
