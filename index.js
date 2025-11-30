// @ts-check
// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  console.log("Getting...");
  await getPagePosts(page);
  console.log("Got");

  // await browser.close();
}

async function getPagePosts(page) {
  try {
    const table = page.locator("tr#bigbox table");

    const titleRows = await table.locator("tr.athing").all();
    for (const row of titleRows) {
      const title = await row
        .locator("span.titleline a[rel='nofollow']")
        .textContent();

      const subtextRow = row.locator("xpath=./following-sibling::tr[1]");
      const subtext = await subtextRow.locator("td.subtext").textContent();

      console.log(title);
      console.log(subtext);
    }
  } catch (e) {
    console.error(`Failed to get posts: \n${e}`);
  }
}

(async () => {
  await sortHackerNewsArticles();
})();
