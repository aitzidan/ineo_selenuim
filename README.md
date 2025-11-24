# ICE Selenium Scraper

## Prerequisites

-   Node.js v16 or higher
-   Chrome/Chromium browser
-   ChromeDriver (compatible with your Chrome version)

## Installation

```bash
npm install
```

## Dependencies

```json
{
	"selenium-webdriver": "^4.x.x",
	"tesseract.js": "^4.x.x"
}
```

## Configuration

### Testing Without MongoDB

For testing purposes without a MongoDB connection, the database queries are commented out. The application uses:

```javascript
const company = null;
```

This allows the scraper to run and fetch fresh data from the ICE website without checking or saving to a database.
