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

  console.log("Getting page 1...");
  await getPagePosts(page, true);
  await nextPage(page);

  console.log("Getting page 2...");
  await getPagePosts(page, true);
  await nextPage(page);

  console.log("Getting page 3...");
  await getPagePosts(page, true);
  await nextPage(page);

  console.log("Getting page 4...");
  await getPagePosts(page, false);

  // await browser.close();
}

async function getPagePosts(page, all) {
  try {
    const table = page.locator("tr#bigbox table");

    const titleRows = await table.locator("tr.athing").all();

    let index = 0;
    for (const row of titleRows) {
      if (index > 9 && all !== true) return;

      const title = await row
        .locator("span.titleline a[rel='nofollow']")
        .textContent();

      const subtextRow = row.locator("xpath=./following-sibling::tr[1]");
      const subtext = await subtextRow.locator("td.subtext").textContent();

      console.log(title);
      console.log(subtext);
      index++;
    }
  } catch (e) {
    console.error(`Failed to get posts: \n${e}`);
  }
}

async function nextPage(page) {
  const pageLink = page.locator("a.morelink");
  console.log(await pageLink.getAttribute("href"));
  await page.goto(await pageLink.getAttribute("href"));
}

(async () => {
  await sortHackerNewsArticles();
})();
