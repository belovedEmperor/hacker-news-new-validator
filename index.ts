// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
import { chromium, Browser, BrowserContext, Page, Locator } from "playwright";
import { Chrono } from "chrono-node";

interface Post {
  rowNumber: number;
  title: string;
  timestamp: Date;
  ageText: string;
  pageNumber: number;
}

class HackerNewsValidator {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private chrono: Chrono = new Chrono();

  private readonly hackerNewsLink = "https://news.ycombinator.com";
  private readonly constTime = new Date();

  private assertIsError(e: unknown): asserts e is Error {
    if (!(e instanceof Error)) throw new Error("e is not an Error");
  }

  private async withRetry<T>(
    func: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await func();
      } catch (e) {
        this.assertIsError(e);
        lastError = e;
        if (attempt < maxAttempts) {
          console.log(`Attempt ${attempt}/${maxAttempts} failed, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  private async init() {
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser?.newContext();
  }

  async validate() {
    await this.init();

    let posts: Post[] | null = null;

    const page = await this.context?.newPage();
    if (!page) {
      throw new Error("Failed to get page1");
    }

    await page.goto(`${this.hackerNewsLink}/newest`);

    posts = await this.withRetry(() => this.getPagePosts(page, true, 1));

    await this.withRetry(() => this.goToNextPage(page));
    posts = [
      ...posts,
      ...(await this.withRetry(() => this.getPagePosts(page, true, 2))),
    ];

    await this.withRetry(() => this.goToNextPage(page));
    posts = [
      ...posts,
      ...(await this.withRetry(() => this.getPagePosts(page, true, 3))),
    ];

    await this.withRetry(() => this.goToNextPage(page));
    posts = [
      ...posts,
      ...(await this.withRetry(() => this.getPagePosts(page, false, 4))),
    ];

    if (posts) {
      posts.length !== 100
        ? console.error(
            `Error: Not exactly 100 arcticles, found ${posts.length}`,
          )
        : console.log("Found 100 articles");

      const invalids = await this.validateDates(posts);
      if (invalids.length !== 0) {
        console.log("\nThese pairs of posts are invalid:");
        console.log("| Post # | Title | Timestamp | Relative Age | Page # |");
        for (const [id1, id2] of invalids) {
          const p1 = posts[id1];
          const p2 = posts[id2];
          console.log(
            `| ${p1.rowNumber} | ${p1.title.trim()} | ${p1.timestamp.toISOString()} | ${p1.ageText} | ${p1.pageNumber} |`,
          );
          console.log(
            `| ${p2.rowNumber} | ${p2.title.trim()} | ${p2.timestamp.toISOString()} | ${p2.ageText} | ${p2.pageNumber} |`,
          );
          console.log("|--------|-------|-----------|--------------|--------|");
        }
      } else {
        console.log("All dates are valid");
      }
    }

    this.context?.close();
    this.browser?.close();
  }

  private async validateDates(posts: Post[]) {
    let invalids = [];

    for (let i = 0; i < posts.length - 1; i++) {
      if (posts[i].timestamp < posts[i + 1].timestamp) {
        invalids.push([i, i + 1]);
      }
    }
    return invalids;
  }

  private async getPagePosts(
    page: Page,
    all: boolean,
    pageNumber: number,
  ): Promise<Post[]> {
    const posts: Post[] = [];
    const table = page.locator("tr#bigbox table");

    try {
      const titleRows = await table.locator("tr.athing").all();

      let index = 0;
      for (const row of titleRows) {
        // If 4th page, then only get 10 posts
        if (index > 9 && all !== true) return posts;

        const post = await this.withRetry(() =>
          this.processRow(row, pageNumber),
        );
        posts.push(post);
        // console.log(post);

        index++;
      }
    } catch (e) {
      this.assertIsError(e);
      console.error(`Failed to get posts:\n${e}`);
    }

    return posts;
  }

  private async processRow(row: Locator, pageNumber: number): Promise<Post> {
    let age: Date | null = null;

    const subtextRow = row.locator("xpath=./following-sibling::tr[1]");

    try {
      const titleTextContent = await row.textContent();
      const titleMatch = titleTextContent?.match(/^(\d+)\.(.*)/);
      const rowNumber = parseInt(titleMatch?.[1] ?? "-1");
      const title = titleMatch?.[2] ?? "";
      const ageText = await subtextRow
        .locator("span.age")
        .locator("a")
        .textContent();

      if (ageText) {
        age = this.chrono.parseDate(ageText, this.constTime);
      }
      if (!age || !ageText) {
        throw new Error("Failed to get age");
      }

      return {
        rowNumber: rowNumber,
        title: title,
        timestamp: age,
        ageText: ageText,
        pageNumber: pageNumber,
      };
    } catch (e) {
      this.assertIsError(e);
      console.log(`Failed to process row:\n${e}`);
    }
    throw new Error("Failed to process row");
  }

  private async goToNextPage(page: Page) {
    try {
      await page.locator("a.morelink[rel='next']").click();
      await page.waitForLoadState("networkidle");
    } catch (e) {
      this.assertIsError(e);
      console.error(`Failed to go to next page:\n${e}`);
    }
  }
}

const validator = new HackerNewsValidator();
await validator.validate();
