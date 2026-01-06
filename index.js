// @ts-check
// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");
const chrono = require("chrono-node");

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  const hackerNewsLink = "https://news.ycombinator.com";
  const constTime = new Date();

  const page1 = await context.newPage();
  await page1.goto(`${hackerNewsLink}/newest`);
  console.log("Getting page 1");
  const ages1 = await getPagePosts(page1, true, constTime);

  const link = await getNextPageLink(page1);
  const time = String(link.match(new RegExp("next=\\d+&")))
    .split("=")[1]
    .split("&")[0];
  await page1.close();

  let ages2, ages3, ages4;

  const item1 = async () => {
    console.log("Getting page 2");
    const page2 = await context.newPage();
    await page2.goto(`${hackerNewsLink}/newest?next=${time}&n=31`);
    await page2.locator("span.rank").getByText("31").waitFor();
    ages2 = await getPagePosts(page2, true, constTime);
    await page2.close();
  };

  const item2 = async () => {
    console.log("Getting page 3");
    const page3 = await context.newPage();
    await page3.goto(`${hackerNewsLink}/newest?next=${time}&n=61`);
    await page3.locator("span.rank").getByText("61").waitFor();
    ages3 = await getPagePosts(page3, true, constTime);
    await page3.close();
  };

  const item3 = async () => {
    console.log("Getting page 4");
    const page4 = await context.newPage();
    await page4.goto(`${hackerNewsLink}/newest?next=${time}&n=91`);
    await page4.locator("span.rank").getByText("91").waitFor();
    ages4 = await getPagePosts(page4, false, constTime);
    await page4.close();
  };

  await Promise.all([item1(), item2(), item3()]);

  const ages = [...ages1, ...ages2, ...ages3, ...ages4];
  ages.length !== 100
    ? console.error(`Error: Not exactly 100 arcticles, found ${ages.length}`)
    : console.log("Found 100 articles");

  const invalids = await validateDates(ages);
  if (invalids.length !== 0) {
    console.log("These errors posts are invalid:");
    console.log("\n|id|          time          |");
    for (const [id1, id2] of invalids) {
      console.log(`|${id1}|${ages[id1].toISOString()}| <-- older`);
      console.log(`|${id2}|${ages[id2].toISOString()}| <-- newer`);
      console.log("|  |                        |");
    }
  } else {
    console.log("All dates are valid");
  }

  await context.close();
  await browser.close();
}

async function validateDates(dates) {
  let invalids = [];

  for (let i = 0; i < dates.length - 1; i++) {
    if (dates[i] < dates[i + 1]) {
      invalids.push([i, i + 1]);
    }
  }
  return invalids;
}

async function getPagePosts(page, all, referenceTime) {
  try {
    const ages = [];

    const table = page.locator("tr#bigbox table");

    const titleRows = await table.locator("tr.athing").all();

    let index = 0;
    for (const row of titleRows) {
      if (index > 9 && all !== true) return ages;
      // const title = await row.locator("span.titleline").first().textContent();

      const subtextRow = row.locator("xpath=./following-sibling::tr[1]");
      // const subtext = await subtextRow.locator("td.subtext").textContent();

      ages.push(
        chrono.parseDate(
          await subtextRow.locator("span.age").locator("a").textContent(),
          referenceTime,
        ),
      );

      // console.log(title);
      // console.log(subtext);
      index++;
    }

    return ages;
  } catch (e) {
    console.error(`Failed to get posts: \n${e}`);
  }
}

async function nextPage(page) {
  const pageLink = page.locator("a.morelink");
  console.log(await pageLink.getAttribute("href"));
  await page.goto(
    "https://news.ycombinator.com/" + (await pageLink.getAttribute("href")),
  );
}

async function getNextPageLink(page) {
  const link = await page
    .locator("a.morelink[rel='next']")
    .getAttribute("href");
  return link;
}

(async () => {
  await sortHackerNewsArticles();
})();
