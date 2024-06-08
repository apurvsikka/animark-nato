const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;
const BASE_URL = 'https://manganato.com/genre-all';

app.get('/', async (req, res) => {
  let routes = [];
  let infoPage = '/';
  let topPage = '/top?page={pagenumber}';
  let search = '/search?query={query}';
  let latest = '/latest?page={pagenumber}';
  let readPage = '/read?id={mangaId}&chapter={chapterNumber}'
  routes.push({infoPage},{topPage},{search},{latest},{readPage})

  res.json({
    provider: 'https://manganato.com',
    type: "manga",
    apiName: "manganato",
    author: "apurvsikka(apurv)",
    madeOn: "8 june 2024",
    updatedOn: "8 june 2024",
    gitLink: 'https://github.com/apurvsikka/api-manganato-animark',
    routes
  })
  res.status(200)
});

app.get('/top', async (req, res) => {
    const page = req.query.page || 1; // Default to page 1 if no page query parameter is provided
    const url = `${BASE_URL}/${page}?type=topview`;

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const results = [];

        $('.content-genres-item').each((index, element) => {
            const rank = index + 1
            const title = $(element).find('h3 > a').text().trim();
            const image = $(element).find('img').attr('src');
            const id = $(element).find('h3 > a').attr('href').split('/').pop();
            const latestChapter = $(element).find('.genres-item-chap ').text().trim();

            results.push({
                rank,
                title,
                image,
                id,
                latestChapter
            });
        });

        const currentPage = parseInt(page, 10);
        const pageLimit = 999
        var hasNextPage = false
        if (currentPage < 999) {
          const hasNextPage = true;
          res.json({
              currentPage,
              hasNextPage,
              pageLimit,
              results
          });
        } else if (currentPage == 999) {
          // const hasNextPage = false
          res.json({
              currentPage,
              hasNextPage,
              pageLimit,
              results
          });
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching the data.');
    }
});
// latest manga from nato
app.get('/latest', async (req, res) => {
    const page = req.query.page || 1; // Default to page 1 if no page query parameter is provided
    const url = `${BASE_URL}/${page}`;
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const results = [];

        $('.content-genres-item').each((index, element) => {
            const title = $(element).find('h3 > a').text().trim();
            const image = $(element).find('img').attr('src');
            const link = $(element).find('h3 > a').attr('href');
            const latestChapter = $(element).find('.genres-item-chap').text().trim();
            const id = link.split('/').pop(); // Extracting manga ID

            results.push({
                id,
                title,
                image,
                id,
                latestChapter
            });
        });

        const currentPage = parseInt(page, 10);
        const pageLimit = 999
        var hasNextPage = false
        if (currentPage < 999) {
          const hasNextPage = true;
          res.json({
              currentPage,
              hasNextPage,
              pageLimit,
              results
          });
        } else if (currentPage == 999) {
          // const hasNextPage = false
          res.json({
              currentPage,
              hasNextPage,
              pageLimit,
              results
          });
        }

        // res.json(latestManga);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching the data.');
    }
});

// information about the manga


app.get('/info', async (req, res) => {
    const mangaId = req.query.id;

    if (!mangaId) {
        return res.status(400).send('Manga ID is required');
    }

    try {
        const url = `https://chapmanganato.to/${mangaId}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const mangaInfo = {
            title: $('.story-info-right > h1').text().trim(),
            altTitle: $('tr:nth-child(1) td:nth-child(2) > h2').text().trim(),
            author: $('tr:nth-child(2) td:nth-child(2)').text().trim(),
            description: $('.panel-story-info-description').text().trim(),
            status: $('tr:nth-child(3) td:nth-child(2)').text().trim(),
            genres: $('tr:nth-child(4) td:nth-child(2)').map((i, el) => $(el).text().trim()).get(),
            updatedOn: $('p > span.stre-value').text().trim(),
        };
        // Extracting chapters
        mangaInfo.chapters = [];
        $('.row-content-chapter li').each((index, element) => {
          const chapterName = $(element).find('.chapter-name').text().trim();
          const chapterLink = $(element).find('.chapter-name').attr('href');

          // Extract only the chapter number from the URL
          const chapterNumberMatch = chapterLink.match(/chapter-(\d+)/);
          const chapterNumber = chapterNumberMatch ? chapterNumberMatch[1] : null;

          mangaInfo.chapters.push({
            chapterName,
            chapterNumber
          });
        });

        res.json(mangaInfo);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching the data.');
    }
});


// search results
app.get('/search', async (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).send('Search query is required');
    }

    try {
        const url = `https://manganato.com/search/story/${encodeURIComponent(query)}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const results = [];

        $('.search-story-item').each((index, element) => {
            const title = $(element).find('.item-title').text().trim();
            const link = $(element).find('.item-title').attr('href');
            const image = $(element).find('.item-img > img').attr('src');
            const latestChapter = $(element).find('.item-chapter ').text().trim();

            let id = null;
            if (link) {
                id = link.split('/').pop(); // Extracting manga ID
            }

            results.push({
                id,
                title,
                image,
                link,
                latestChapter
            });
        });

        res.json({results});
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching the search results.');
    }
});

// read
app.get('/read', async (req, res) => {
    const { id, chapter } = req.query;
    const URL = `https://chapmanganato.to/${id}/chapter-${chapter}`;

    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);
        const mangaPages = [];

        $('.container-chapter-reader img').each((index, element) => {
            const pageUrl = $(element).attr('src');
            mangaPages.push(pageUrl);
        });

        res.json({ id, chapter, pages: mangaPages });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching the manga chapter.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
