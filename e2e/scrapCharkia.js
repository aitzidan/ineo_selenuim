const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const CHARIKA_EMAIL = "zidangenerafi@gmail.com";
const CHARIKA_PASSWORD = "A8WhKAS6dy!834E";

const getCompanyByName = async (req, res) => {
	const companyName = req.params.name;
	let result;

	result = await searchCharika(companyName);

	if (result === false) {
		res.status(404).send("Company not found");
		return;
	}
	if (result.error) {
		res.status(500).send(`Problem in the server: ${result.error}`);
		return;
	}

	if (result.name) {
		res.status(200).send(result);
	}
};

async function searchCharika(companyName) {
	console.log("Searching for company:", companyName);

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	const userAgents = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"];

	const options = new chrome.Options();
	options.addArguments("--disable-blink-features=AutomationControlled");
	options.addArguments(`user-agent=${userAgents[0]}`);
	options.addArguments("--no-sandbox");
	options.addArguments("--headless=new");
	options.addArguments("--disable-dev-shm-usage");
	options.addArguments("--disable-extensions");
	options.addArguments("--disable-gpu");
	options.addArguments("--window-size=1920,1080");
	options.addArguments("--disable-logging");
	options.addArguments("--log-level=3");
	options.excludeSwitches("enable-logging");

	const driver = new Builder().forBrowser("chrome").setChromeOptions(options).build();

	// Maximize window to ensure all elements are visible
	await driver.manage().window().maximize();

	let result = {};

	try {
		await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");

		// Step 1: Navigate to homepage
		console.log("Navigating to Charika homepage...");
		await driver.get("https://www.charika.ma");
		await sleep(4000);
		console.log("Homepage loaded");

		// Wait for page to be fully loaded
		await driver.wait(async () => {
			const readyState = await driver.executeScript("return document.readyState");
			return readyState === "complete";
		}, 10000);

		// Step 2: Open login popup using JavaScript
		console.log("Attempting to open login popup...");

		const popupOpened = await driver.executeScript(`
			// First, open the dropdown
			var dropdown = document.querySelector('.UserConnect-login');
			if (dropdown) {
				dropdown.click();
			}
			
			// Wait a bit, then click the login button
			setTimeout(function() {
				var loginBtn = document.querySelector('.service-connexion');
				if (loginBtn) {
					loginBtn.click();
				}
			}, 500);
			
			return true;
		`);

		await sleep(3000); // Wait for popup to appear
		console.log("Login popup should be open");

		// Step 3: Check if popup is visible
		try {
			const isPopupVisible = await driver.executeScript(`
				var modal = document.querySelector('#form-connexion');
				if (modal) {
					var style = window.getComputedStyle(modal);
					console.log('Modal display:', style.display);
					console.log('Modal visibility:', style.visibility);
					console.log('Modal opacity:', style.opacity);
					return style.display !== 'none' && style.visibility !== 'hidden';
				}
				return false;
			`);

			console.log("Is popup visible?", isPopupVisible);
		} catch (e) {
			console.log("Could not check popup visibility");
		}

		// Step 4: Fill login form using multiple approaches
		// Step 4: Fill login form using XPath to target the visible modal form
		try {
			await sleep(3000);

			console.log("Filling login form...");

			// Use XPath with index [2] to target the modal form specifically
			let usernameInput = await driver.findElement(By.xpath('(//input[@id="username"])[1]'));
			await usernameInput.clear();
			await usernameInput.sendKeys(CHARIKA_EMAIL);
			console.log("Email entered");

			await sleep(500);

			// Target the second (modal) password field
			let passwordInput = await driver.findElement(By.xpath('(//input[@id="password"])[2]'));
			await passwordInput.click();
			await passwordInput.clear();
			await sleep(200);

			// Send password character by character for reliability
			for (let char of CHARIKA_PASSWORD) {
				await passwordInput.sendKeys(char);
				await sleep(50);
			}
			console.log("Password entered");

			await sleep(1000);

			// Click the submit button in the modal (second form)
			await driver.executeScript(`
    var form = document.getElementById('form-connexion');
    if (form) {
        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.click();
        }
    }
`);

			console.log("Login form submitted");
			await sleep(5000);

			// Check login success
			const loginSuccess = await driver.executeScript(`
        var errorEl = document.querySelector('.error.error-1');
        if (errorEl) {
            var display = window.getComputedStyle(errorEl).display;
            return display === 'none';
        }
        return true;
    `);

			console.log("Login successful?", loginSuccess);
		} catch (loginError) {
			console.log("Login error:", loginError.message);
			result.error = "Login failed: " + loginError.message;
			return result;
		}

		// Step 5: Navigate to search page
		console.log("Navigating to search page...");
		await driver.get("https://www.charika.ma/societe-rechercher");
		await sleep(3000);
		console.log("Search page loaded");

		// Step 6: Fill search field
		console.log("Filling search field...");
		let companySearch = await driver.findElement(By.xpath('(//input[@name="sDenomination"])[2]'));
		await companySearch.clear();
		await companySearch.sendKeys(companyName);
		await sleep(5000);

		// Find the submit button that's a sibling of the input field
		let submitBtn = await driver.findElement(By.xpath('(//input[@name="sDenomination"])[2]/following-sibling::button[@type="submit"]'));
		await submitBtn.click();
		await sleep(5000);

		/*await driver.executeScript(`
        	var searchInput = document.querySelector('input[name="sDenomination"]');


			if (searchInput) {
				searchInput.value = '${companyName}';
				searchInput.dispatchEvent(new Event('input', { bubbles: true }));
			}
		`);
		console.log("Company name entered:", companyName);
		await sleep(1000);

		// Step 7: Submit search
		console.log("Submitting search...");
		await driver.executeScript(`
			var submitBtn = document.querySelector('button.btn.btn-color[type="submit"]');
			if (submitBtn) {
				submitBtn.click();
			}
		`);
		console.log("Search submitted");
		await sleep(4000);*/

		// Step 8: Wait for results
		try {
			await driver.wait(until.elementLocated(By.css(".ligne-resultat")), 10000);
			console.log("Search results loaded");
		} catch (error) {
			result.error = "No results found for this company";
			return false;
		}

		// Step 9: Get first result link
		let firstResultLink;
		try {
			firstResultLink = await driver.executeScript(`
				var firstLink = document.querySelector('.ligne-resultat.BlocInfoJ  .goto-fiche');
				return firstLink ? firstLink.href : null;
			`);

			if (!firstResultLink) {
				result.error = "Could not find first result link";
				return result;
			}

			console.log("First result link:", firstResultLink);
		} catch (error) {
			result.error = "Failed to find first result link: " + error.message;
			return result;
		}

		// Step 10: Navigate to company page
		console.log("Loading company detail page...");
		await driver.get(firstResultLink);
		await sleep(3000);
		console.log("Company detail page loaded");

		// Step 11: Extract company data
		const companyData = await driver.executeScript(`
			const data = {};
			
			// Company name
			try {
				const nameEl = document.querySelector('h1.nom.society-name a, h1.nom.society-name');
				data.name = nameEl ? nameEl.textContent.trim() : '';
			} catch (e) { data.name = ''; }
			
			// Activity
			try {
				const activityEl = document.querySelector('h2');
				data.activity = activityEl ? activityEl.textContent.trim() : '';
			} catch (e) { data.activity = ''; }
			
			// Address
			try {
				const addressEl = document.querySelector('.ligne-tfmw label');
				data.address = addressEl ? addressEl.textContent.trim() : '';
			} catch (e) { data.address = ''; }
			
			// Table data
			try {
				const rows = document.querySelectorAll('.informations-entreprise tbody tr');
				rows.forEach(row => {
					const text = row.textContent;
					if (text.includes('RC')) {
						const cell = row.querySelector('td:nth-child(2)');
						data.rc = cell ? cell.textContent.replace('Afficher le RC', '').trim() : '';
					}
					if (text.includes('ICE')) {
						const cell = row.querySelector('td:nth-child(2)');
						data.ice = cell ? cell.textContent.replace(/Afficher l'ICE|0002\.\.\./g, '').trim() : '';
					}
					if (text.includes('Forme juridique')) {
						const cell = row.querySelector('td:nth-child(2)');
						data.formeJuridique = cell ? cell.textContent.trim() : '';
					}
					if (text.includes('Capital')) {
						const cell = row.querySelector('td:nth-child(2)');
						data.capital = cell ? cell.textContent.trim() : '';
					}
				});
			} catch (e) {}
			
			// Fax
			try {
				const faxEl = document.querySelector('.marketingInfoTelFax');
				data.fax = faxEl ? faxEl.textContent.trim() : '';
			} catch (e) { data.fax = ''; }
			
			// Hidden fields
			try {
				const bilidEl = document.querySelector('input.bilid');
				data.bilid = bilidEl ? bilidEl.value : '';
				
				const entidEl = document.querySelector('input.entid');
				data.entid = entidEl ? entidEl.value : '';
				
				const denomEl = document.querySelector('input.denomination');
				data.denomination = denomEl ? denomEl.value : '';
			} catch (e) {}
			
			return data;
		`);

		result = { ...companyData, url: firstResultLink };
		console.log("Data extracted successfully:", result);
	} catch (error) {
		result.error = "Unexpected error: " + error.message;
		console.error("Error:", error);
	} finally {
		await driver.quit();
	}

	if (!result.name || result.name === "") {
		return false;
	}

	return result;
}

module.exports = { getCompanyByName };
