const https = require('https');
const http = require('http');

// Function to make an HTTP GET request to fetch webpage content
function fetchWebpage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

function extractHeadingsAndUrls(div) {
    const headings = div.match(/<h3\s+class="latest-stories__item-headline">([^<]*)<\/h3>/gi);
    const urls = div.match(/<a\s+href="([^"]*)">/gi);

    if (headings && urls && headings.length === urls.length) {
        const stories = [];
        for (let i = 0; i < headings.length; i++) {
            const heading = headings[i].match(/<h3\s+class="latest-stories__item-headline">([^<]*)<\/h3>/i)[1];
            const url = urls[i].match(/<a\s+href="([^"]*)">/i)[1];
            stories.push({ heading, url });
        }
        return stories;
    } else {
        return null;
    }
}

// Function to extract the stories div from the webpage
async function extractStories(request, response) {
    const url = 'https://time.com';

    try {
        const html = await fetchWebpage(url);
        // Extract the stories div from the HTML
        const storiesDiv = extractDiv(html);
        if (storiesDiv) {
            const stories = extractHeadingsAndUrls(storiesDiv);
            if (stories) {
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(stories, null, 2));
            } else {
                response.writeHead(404, { 'Content-Type': 'text/plain' });
                response.end('Headings and URLs not found');
            }
        } else {
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('Stories div not found');
        }
    } catch (error) {
        console.error('Error fetching or parsing content:', error);
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.end('Error fetching or parsing content');
    }
}

// Function to extract a div with a given class name from HTML
function extractDiv(html) {
    const regex = /<div\s+class="partial\s+latest-stories"[^>]*>[\s\S]*?<\/div>/i;
    const match = html.match(regex);
    return match ? match[0] : null;
}

// Create a server on port 8080
http.createServer((request, response) => {
    extractStories(request, response);
}).listen(8081, () => {
    console.log('Server running at http://localhost:8081/');
});