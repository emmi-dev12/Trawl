import asyncio
import re
from typing import Optional, List, Dict, Any
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass, asdict, field
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
    branding: Dict[str, Any] = field(default_factory=dict)


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
            if parsed.scheme not in ("http", "https"):
                return None
            if absolute_url.endswith("#"):
                return None
            return f"{parsed.scheme}://{parsed.netloc}{parsed.path}{'?' + parsed.query if parsed.query else ''}"
        except Exception:
            return None

    def _is_same_domain(self, url: str, base_url: str) -> bool:
        try:
            return urlparse(url).netloc == urlparse(base_url).netloc
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
                () => Array.from(document.querySelectorAll('a[href]'))
                    .map(a => a.href)
                    .filter(href => href && href.trim())
            """)
            links = []
            for href in href_list:
                normalized = self._normalize_url(href, base_url)
                if normalized and not self._should_skip_url(normalized):
                    links.append(normalized)
            return list(dict.fromkeys(links))
        except Exception as e:
            logger.error(f"Error extracting links: {e}")
            return []

    async def _extract_text(self, page: Page) -> str:
        try:
            return (await page.inner_text("body")).strip()
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return ""

    async def _extract_title(self, page: Page) -> str:
        try:
            return (await page.title()).strip()
        except Exception as e:
            logger.error(f"Error extracting title: {e}")
            return ""

    async def _detect_tables(self, page: Page) -> List[Dict]:
        try:
            return await page.evaluate("""
                () => {
                    const tables = [];
                    document.querySelectorAll('table').forEach((table, idx) => {
                        const rows = [];
                        table.querySelectorAll('tr').forEach(tr => {
                            const cells = [];
                            tr.querySelectorAll('td, th').forEach(td => cells.push(td.innerText.trim()));
                            if (cells.length > 0) rows.push(cells);
                        });
                        if (rows.length > 0) tables.push({type: 'table', index: idx, rows});
                    });
                    return tables;
                }
            """)
        except Exception:
            return []

    async def _extract_structured_data(self, page: Page) -> Dict[str, Any]:
        tables = await self._detect_tables(page)
        return {"tables": tables} if tables else {}

    async def _extract_branding(self, page: Page, base_url: str) -> Dict[str, Any]:
        try:
            branding = await page.evaluate("""
                (baseUrl) => {
                    const toAbsolute = (src) => {
                        if (!src) return null;
                        try { return new URL(src, baseUrl).href; } catch { return null; }
                    };

                    // --- Colors ---
                    const colorCounts = {};
                    const colorRe = /#([0-9a-fA-F]{3,8})\\b|rgb\\(\\d[^)]*\\)|rgba\\(\\d[^)]*\\)/g;
                    const sheets = [];
                    try {
                        for (const ss of document.styleSheets) {
                            try {
                                for (const rule of ss.cssRules || []) {
                                    if (rule.style) sheets.push(rule.style.cssText);
                                }
                            } catch {}
                        }
                    } catch {}
                    const allCss = sheets.join(' ');
                    let m;
                    while ((m = colorRe.exec(allCss)) !== null) {
                        const c = m[0].toLowerCase();
                        colorCounts[c] = (colorCounts[c] || 0) + 1;
                    }
                    const colors = Object.entries(colorCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 12)
                        .map(([color]) => color);

                    // --- Fonts ---
                    const fonts = new Set();
                    try {
                        for (const ss of document.styleSheets) {
                            try {
                                for (const rule of ss.cssRules || []) {
                                    if (rule.style) {
                                        const ff = rule.style.fontFamily;
                                        if (ff) ff.split(',').forEach(f => fonts.add(f.trim().replace(/['"]/g, '')));
                                    }
                                    if (rule.constructor.name === 'CSSFontFaceRule') {
                                        const ff = rule.style.fontFamily;
                                        if (ff) fonts.add(ff.replace(/['"]/g, ''));
                                    }
                                }
                            } catch {}
                        }
                    } catch {}

                    // --- Logos ---
                    const logoSelectors = [
                        'img[class*="logo" i]', 'img[id*="logo" i]', 'img[alt*="logo" i]',
                        'a[class*="logo" i] img', 'header img', '.navbar img', 'nav img',
                        'svg[class*="logo" i]', 'svg[id*="logo" i]'
                    ];
                    const logos = [];
                    for (const sel of logoSelectors) {
                        document.querySelectorAll(sel).forEach(el => {
                            const src = el.src || el.getAttribute('src');
                            const abs = toAbsolute(src);
                            if (abs && !logos.includes(abs)) logos.push(abs);
                        });
                        if (logos.length >= 3) break;
                    }

                    // --- Favicon ---
                    const faviconEl = document.querySelector('link[rel~="icon"]') ||
                                     document.querySelector('link[rel="shortcut icon"]');
                    const favicon = faviconEl ? toAbsolute(faviconEl.getAttribute('href')) : toAbsolute('/favicon.ico');

                    // --- Images (prominent) ---
                    const images = [];
                    document.querySelectorAll('img[src]').forEach(img => {
                        const abs = toAbsolute(img.src);
                        const rect = img.getBoundingClientRect();
                        if (abs && rect.width > 100 && rect.height > 100 && !images.includes(abs)) {
                            images.push(abs);
                        }
                    });

                    // --- Meta ---
                    const getMeta = (names) => {
                        for (const name of names) {
                            const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                            if (el) return el.getAttribute('content');
                        }
                        return null;
                    };

                    return {
                        colors,
                        fonts: Array.from(fonts).slice(0, 8),
                        logos: logos.slice(0, 5),
                        favicon,
                        images: images.slice(0, 10),
                        meta: {
                            description: getMeta(['description', 'og:description']),
                            site_name: getMeta(['og:site_name', 'application-name']),
                            theme_color: getMeta(['theme-color', 'msapplication-TileColor']),
                            og_image: getMeta(['og:image'])
                        }
                    };
                }
            """, base_url)
            return branding
        except Exception as e:
            logger.error(f"Error extracting branding: {e}")
            return {}

    async def _accept_cookies(self, page: Page):
        try:
            for selector in ['button:has-text("Accept")', 'button:has-text("Agree")', 'button:has-text("OK")']:
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
            last_count = 0
            no_change_iterations = 0
            for _ in range(max_iterations):
                if self.stop_requested:
                    break
                await page.evaluate("""
                    () => {
                        window.scrollBy(0, 500);
                        const elem = document.documentElement;
                        if (elem.scrollHeight > elem.clientHeight) elem.scrollTop = elem.scrollHeight;
                    }
                """)
                await asyncio.sleep(1.0)
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

    async def _scrape_page(self, url: str, extract_branding: bool = False) -> Optional[ScrapedPage]:
        for attempt in range(3):
            try:
                page = await self.context.new_page()
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                    await asyncio.sleep(0.5)
                    await self._accept_cookies(page)
                    await asyncio.sleep(0.5)
                    await self._handle_infinite_scroll(page)

                    title = await self._extract_title(page)
                    text = await self._extract_text(page)
                    links = await self._extract_links(page, url)
                    structured = await self._extract_structured_data(page)
                    branding = await self._extract_branding(page, url) if extract_branding else {}

                    return ScrapedPage(
                        url=url,
                        title=title,
                        text=text[:5000],
                        links=links[:100],
                        structured=structured,
                        branding=branding
                    )
                finally:
                    await page.close()
            except Exception as e:
                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)
                else:
                    logger.error(f"Failed to scrape {url}: {e}")
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
        extract_branding = extract and "branding" in extract

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
                self._report_progress(len(self.pages_scraped), max_pages, f"Scraping: {current_url[:50]}...")

                page_data = await self._scrape_page(current_url, extract_branding=extract_branding)
                if page_data:
                    self.pages_scraped.append(page_data)
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
