// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
import { chromium, Browser, BrowserContext, Page } from "playwright";
import { Chrono } from "chrono-node";

interface Article {
  id: string;
  rank: number;
  timestamp: Date;
  ageText: string;
  pageNumber: number;
  rowNumber: number;
}

class HackerNewsValidator {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private chrono: Chrono = new Chrono();

  private readonly hackerNewsLink = "https://news.ycombinator.com";
  private readonly constTime = new Date();

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser?.newContext();
  }

  async validate() {
    await this.init();

    let page1, page2, page3, page4: Page;
    let ages1, ages2, ages3, ages4: string;

    page1 = await this.context?.newPage();
    if (page1) {
      await page1.goto(`${this.hackerNewsLink}/newest`);
      console.log("Getting page 1");
      ages1 = await this.getPagePosts(page1, true, this.constTime);
    } else {
      throw new Error("Failed to get page1");
    }

    const link = await this.getNextPageLink(page1);
    if (link === "") {
      throw new Error("Got empty link");
    }
    const pageTime = String(link.match(new RegExp("next=\\d+&")))
      .split("=")[1]
      .split("&")[0];

    let item1, item2, item3;
    item1 = async () => {
      console.log("Getting page 2");
      [page2, ages2] = await this.initializeItems("31", pageTime);
    };
  }

  async initializeItems(
    startingPost: string,
    time: string,
  ): Promise<Page, Date[]> {
    const page = await this.context?.newPage();
    if (page) {
      await page.goto(`${this.hackerNewsLink}/newest?next=${time}&n=31`);
      await page.locator("span.rank").getByText("31").waitFor();
      return {
        // Should use the interface instead
        page: page,
        ages: await this.getPagePosts(page, true, this.constTime),
      };
    }
  }

  async getPagePosts(page: Page, all: boolean, referenceTime: Date) {
    const ages: Date[] = [];
    const table = page.locator("tr#bigbox table");

    try {
      const titleRows = await table.locator("tr.athing").all();

      let index = 0;
      for (const row of titleRows) {
        if (index > 9 && all !== true) return ages;

        const subtextRow = row.locator("xpath=./following-sibling::tr[1]");
        const ageText = await subtextRow
          .locator("span.age")
          .locator("a")
          .textContent();

        if (ageText) {
          const age = this.chrono.parseDate(ageText, referenceTime);
          if (age) {
            ages.push(age);
          }
        }

        index++;
      }
    } catch (e) {
      console.error(`Failed to get posts:\n${e}`);
    }

    return ages;
  }

  async getNextPageLink(page: Page): Promise<string> {
    try {
      return (
        (await page.locator("a.morelink[rel='next']").getAttribute("href")) ||
        ""
      );
    } catch (e) {
      console.error(`Failed to get next page link:\n${e}`);
    }
    return "";
  }
}

const validator = new HackerNewsValidator();
await validator.validate();
