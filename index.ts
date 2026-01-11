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

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser?.newContext();
  }

  async validate() {
    await this.init();

    let posts1,
      posts2,
      posts3,
      posts4: Post[] | null = null;

    const page1 = await this.context?.newPage();
    if (page1) {
      await page1.goto(`${this.hackerNewsLink}/newest`);
      console.log("Getting page 1");
      posts1 = await this.getPagePosts(page1, true, 1);
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
      posts2 = await this.initializeItems("31", pageTime);
    };
    item2 = async () => {
      console.log("Getting page 3");
      posts3 = await this.initializeItems("61", pageTime);
    };
    item3 = async () => {
      console.log("Getting page 4");
      posts4 = await this.initializeItems("91", pageTime);
    };

    await Promise.all([item1(), item2(), item3()]);

    let posts: Post[] | null = null;

    if (posts1 && posts2 && posts3 && posts4) {
      posts = [...posts1, ...posts2, ...posts3, ...posts4];

      posts.length !== 100
        ? console.error(
            `Error: Not exactly 100 arcticles, found ${posts.length}`,
          )
        : console.log("Found 100 articles");

      const invalids = await this.validateDates(posts);
      if (invalids.length !== 0) {
        console.log("These pairs of posts are invalid:");
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

  async validateDates(posts: Post[]) {
    let invalids = [];

    for (let i = 0; i < posts.length - 1; i++) {
      if (posts[i].timestamp < posts[i + 1].timestamp) {
        invalids.push([i, i + 1]);
      }
    }
    return invalids;
  }

  async initializeItems(startingPost: string, time: string): Promise<Post[]> {
    try {
      const page = await this.context?.newPage();
      let pageNumber = -1;
      switch (startingPost) {
        case "31":
          pageNumber = 2;
          break;
        case "61":
          pageNumber = 3;
          break;
        case "91":
          pageNumber = 4;
          break;
        default:
          throw new Error("startingPost not valid");
      }
      if (page) {
        await page.goto(
          `${this.hackerNewsLink}/newest?next=${time}&n=${startingPost}`,
        );
        await page.locator("span.rank").getByText(startingPost).waitFor();
        const all = pageNumber !== 4 ? true : false;
        return await this.getPagePosts(page, all, pageNumber);
      }
    } catch (e) {
      console.error(`Failed to initialize items:${e}`);
    }
    return [];
  }

  async getPagePosts(
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
        if (index > 9 && all !== true) return posts;

        const post = await this.processRow(row, pageNumber);
        posts.push(post);
        console.log(post);

        index++;
      }
    } catch (e) {
      console.error(`Failed to get posts:\n${e}`);
    }

    return posts;
  }

  async processRow(row: Locator, pageNumber: number): Promise<Post> {
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
      console.log(`Failed to process row:\n${e}`);
    }
    return {
      rowNumber: 0,
      title: "",
      timestamp: this.constTime,
      ageText: "",
      pageNumber: 0,
    };
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
