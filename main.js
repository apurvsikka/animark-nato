const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
// const BASE_URL = "https://mangakakalot.tv";
const ALT = "https://mangakakalot.com";
const BASE_URL = "https://chapmanganato.to";

// Use cors middleware to allow Cross-Origin requests
app.use(cors());

// Set Access-Control-Allow-Origin header to allow all origins
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.use(express.static(path.join(__dirname, "docs")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "index.html"));
  res.status(200);
});

app.get("/top", async (req, res) => {
  const page = req.query.page || 1; // Default to page 1 if no page query parameter is provided
  const url = `${ALT}/manga_list?type=topview&category=all&state=all&page=${page}`;

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $(".list-truyen-item-wrap").each((index, element) => {
      // const rank = index + 1
      const title = $(element).find("h3 > a").text().trim();
      const image = $(element).find(".list-story-item img").attr("src");
      const id = $(element)
        .find("h3 a")
        .attr("href")
        .replace("https://chapmanganato.to/", "");
      const latestChapter = $(element)
        .find(".list-story-item-wrap-chapter")
        .text()
        .trim();
      const description = $(element).find("p").text().trim();

      results.push({
        // rank,
        title,
        image,
        id,
        latestChapter,
        description,
      });
    });

    const currentPage = parseInt(page, 10);
    const pageLimit = 999;
    var hasNextPage = false;
    if (currentPage < 999) {
      const hasNextPage = true;
      res.json({
        currentPage,
        hasNextPage,
        pageLimit,
        results,
      });
    } else if (currentPage == 999) {
      // const hasNextPage = false
      res.json({
        currentPage,
        hasNextPage,
        pageLimit,
        results,
      });
    } else {
      res.send("Page Not Available");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching the data.");
  }
});
// latest manga from nato
app.get("/latest", async (req, res) => {
  const page = req.query.page || 1; // Default to page 1 if no page query parameter is provided
  const url = `${ALT}/manga_list?type=latest&category=all&state=all&page=${page}`;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $(".list-truyen-item-wrap").each((index, element) => {
      const title = $(element).find("h3 > a").text().trim();
      const image = $(element).find(".list-story-item > img").attr("src");
      const link = $(element).find("h3 > a").attr("href");
      const latestChapter = $(element)
        .find(".list-story-item-wrap-chapter")
        .text()
        .trim();
      const id = link.split("/").pop(); // Extracting manga ID
      const description = $(element).find("p").text().trim();

      results.push({
        id,
        title,
        image,
        id,
        latestChapter,
        description,
      });
    });

    const currentPage = parseInt(page, 10);
    const pageLimit = 999;
    var hasNextPage = false;
    if (currentPage < 999) {
      const hasNextPage = true;
      res.json({
        currentPage,
        hasNextPage,
        pageLimit,
        results,
      });
    } else if (currentPage == 999) {
      // const hasNextPage = false
      res.json({
        currentPage,
        hasNextPage,
        pageLimit,
        results,
      });
    }

    // res.json(latestManga);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching the data.");
  }
});

// information about the manga

app.get("/info/:id", async (req, res) => {
  const mangaId = req.params.id;

  if (!mangaId) {
    return res.status(400).send("Manga ID is required");
  }

  try {
    const url = `https://chapmanganato.to/${mangaId}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const gen_temp = $("tr:nth-child(4) td:nth-child(2)")
      .map((i, el) => $(el).text().trim())
      .get();
    const gen_ref = gen_temp[0];
    const mangaInfo = {
      title: $(".story-info-right > h1").text().trim(),
      image: $(".story-info-left .info-image img").attr("src"),
      altTitle: $("tr:nth-child(1) td:nth-child(2) > h2").text().trim(),
      author: $("tr:nth-child(2) td:nth-child(2)").text().trim(),
      description: $(".panel-story-info-description").text().trim(),
      status: $("tr:nth-child(3) td:nth-child(2)").text().trim(),
      genres: gen_ref.split(" - "),
      updatedOn: $("p > span.stre-value").text().trim(),
    };
    // Extracting chapters
    mangaInfo.chapters = [];
    $(".row-content-chapter li").each((index, element) => {
      const chapterName = $(element).find(".chapter-name").text().trim();
      const chapterLink = $(element).find(".chapter-name").attr("href");

      // Extract only the chapter number from the URL
      const chapterNumberMatch = chapterLink.match(/chapter-(\d+)/);
      const chapterNumber = chapterNumberMatch ? chapterNumberMatch[1] : null;

      mangaInfo.chapters.push({
        chapterName,
        chapterNumber,
      });
    });

    res.json(mangaInfo);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching the data.");
  }
});

// backwards compat for info page
app.get("/info", function (req, res) {
  const id = req.query.id;
  res.redirect(`/info/${id}`);
});

// search results
app.get("/search", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).send("Search query is required");
  }

  try {
    const url = `${ALT}/search/story/${encodeURIComponent(query)}`;
    console.log(`${url}`);

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $(".story_item").each((index, element) => {
      const title = $(element)
        .find(".story_item_right .story_name")
        .text()
        .trim();
      const link = $(element)
        .find(".story_item_right .story_name a")
        .attr("href");
      const image = $(element).find("a > img").attr("src");
      const latestChapter = $(element)
        .find(".story_item_right .story_chapter")
        .text()
        .trim();

      let id = null;
      if (link) {
        id = link.split("/").pop(); // Extracting manga ID
      }

      results.push({
        id,
        title,
        image,
        link,
        latestChapter,
      });
    });

    res.json({ query: encodeURIComponent(query), results });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send("An error occurred while fetching the search results.");
  }
});

// hotfix: image proxy
app.get("/proxy", async (req, res) => {
  const imageUrl = req.query.image;

  if (!imageUrl) {
    return res.status(400).send("Image URL is required");
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        Referer: "https://manganato.com",
        "User-Agent": "Mozilla/5.0",
      },
    });

    res.set("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching image:", error.message);
    res.status(500).send("Error fetching image");
  }
});

// read
app.get("/read/:id/:chapter", async (req, res) => {
  const { id, chapter } = req.params;
  const URL = `${BASE_URL}/${id}/chapter-${chapter}`;

  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);
    const mangaPages = [];

    $(".container-chapter-reader img").each((index, element) => {
      const pageUrl = $(element).attr("src");
      mangaPages.push(`/proxy?image=${pageUrl}`);
    });

    res.json({ id, chapter, pages: mangaPages });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching the manga chapter.");
  }
});
// backwards compat for info page
app.get("/read", function (req, res) {
  const { id, chapter } = req.query;
  res.redirect(`/read/${id}/${chapter}`);
});

// genre-sort
app.get("/genre/:id", async (req, res) => {
  const id = req.params.id;
  const p1 = req.query.page || 1;
  const page = JSON.parse(p1) || 1;
  const genreToId = {
    all: "all",
    action: 2,
    adult: 3,
    adventure: 4,
    comedy: 5,
    cooking: 6,
    doujinshi: 7,
    drama: 8,
    ecchi: 9,
    erotica: 10,
    fantasy: 11,
    "gender bender": 12,
    harem: 13,
    historical: 14,
    horror: 15,
    isekai: 16,
    josei: 17,
    manhua: 18,
    manhwa: 19,
    "martial arts": 20,
    mature: 21,
    mecha: 22,
    medical: 23,
    mystery: 24,
    "one shot": 25,
    pornographic: 26,
    psychological: 27,
    romance: 28,
    "school life": 29,
    "sci fi": 30,
    seinen: 31,
    shoujo: 32,
    "shoujo ai": 33,
    shounen: 34,
    "shounen ai": 35,
    "slice of life": 36,
    smut: 37,
    sports: 38,
    supernatural: 39,
    tragedy: 40,
    webtoons: 41,
    yaoi: 42,
    yuri: 43,
  };
  function genreExt(genre) {
    return genreToId[genre.toLowerCase()] || JSON.parse(id);
  }
  const newId = genreExt(id);
  const url = `${ALT}/manga_list?type=topview&category=${newId}&state=all&page=${page}`;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $(".list-truyen-item-wrap").each((i, el) => {
      results.push({
        id:
          $(el)
            .find(".list-story-item")
            .attr("href")
            .replace("https://chapmanganato.to/", "") || "-",
        title: $(el).find("h3 > a").text().trim(),
        img: $(el).find(".list-story-item > img").attr("src"),
        latestChapter:
          $(el).find(".list-story-item-wrap-chapter").text().trim() || "-",
        description: $(el).find("p").text().trim(),
      });
    });

    res.json({ genre: id, results });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching the genre info");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
