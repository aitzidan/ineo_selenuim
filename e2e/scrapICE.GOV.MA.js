const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const tesseract = require("tesseract.js");

const getICE = async (req, res) => {
	const ICE = req.params.key;
	let result;

	// Check database first (commented out - uncomment when ready)
	// const company = await Company.findOne({ identifiantCommunEntreprise: ICE });
	const company = null;

	if (company) {
		res.status(200).send(company);
	} else {
		do {
			result = await ICE_case(ICE);

			if (result === false) {
				res.status(406).send("Invalid ICE");
				return;
			}
			if (result.error) {
				res.status(500).send(`Problem in the server : ${result.error}`);
				return;
			}
		} while (result.name === "");

		if (result.name) {
			// Save to database (uncomment when ready)
			await Company.create({
				name: result.name,
				identifiantFiscale: result.identifiantFiscale,
				identifiantCommunEntreprise: ICE,
				numeroRc: result.numeroRc,
				juridiction: result.juridiction,
				cnss: result.cnss,
			})
				.then((newC) => console.log("company added Successfully : ", newC))
				.catch((error) => console.log("Error creating company : ", error));

			res.status(200).send(result);
		}
	}
};

async function ICE_case(ICE) {
	console.log("Fetching ICE data for:", ICE);

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	const userAgents = [
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
	];

	const options = new chrome.Options();
	options.addArguments("--disable-blink-features=AutomationControlled");
	options.addArguments(`user-agent=${userAgents[Math.floor(Math.random() * userAgents.length)]}`);
	options.addArguments("--no-sandbox");
	options.addArguments("--headless");
	options.addArguments("--disable-dev-shm-usage");
	options.addArguments("--disable-extensions");
	options.addArguments("--profile-directory=Default");
	options.addArguments("--incognito");
	options.addArguments("--start-maximized");

	const driver = new Builder().forBrowser("chrome").setChromeOptions(options).build();
	const actions = driver.actions({ async: true });
	let result = {};

	try {
		// Navigate to the ICE search page
		try {
			await driver.get("https://www.ice.gov.ma/ICE/pages/contribuable/contribuable/Recherche_ICE_front.xhtml");
			await sleep(2000);
			await driver.executeScript("window.scrollBy(0, 200);");
		} catch (error) {
			result.error = "can't access website";
			return result;
		}

		await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");

		// Fill in the ICE input field
		try {
			await sleep(Math.random() * (1000 - 500) + 500);
			let iceInput = await driver.findElement(By.id("demandeIceForm:t12"));
			await actions.move({ origin: iceInput }).perform();
			await iceInput.click();
			await iceInput.clear();
			await iceInput.sendKeys(ICE);
			console.log("ICE input filled");
		} catch (error) {
			result.error = "Failed to fill ICE input: " + error.message;
			return result;
		}

		// Get captcha image and solve it
		let captchaElement;
		try {
			captchaElement = await driver.findElement(By.id("demandeIceForm:capimg"));
		} catch (error) {
			result.error = "captchaImage not found";
			return result;
		}

		let screenshot = await captchaElement.takeScreenshot(true);
		fs.writeFileSync("screenshot.png", screenshot, "base64");

		let captchaText = (
			await tesseract.recognize("screenshot.png", "eng", {
				tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			})
		).data.text.trim();

		console.log("Captcha text:", captchaText);

		// Fill captcha input
		try {
			await sleep(Math.random() * (1000 - 500) + 500);
			let captchaInput = await driver.findElement(By.id("demandeIceForm:r"));
			await actions.move({ origin: captchaInput }).perform();
			await captchaInput.click();
			await captchaInput.clear();
			await captchaInput.sendKeys(captchaText);
			console.log("Captcha input filled");
		} catch (error) {
			result.error = "Failed to fill captcha: " + error.message;
			return result;
		}

		// Click the search button
		try {
			await sleep(1000);
			let searchButton = await driver.findElement(By.id("demandeIceForm:demICE1"));
			await actions.move({ origin: searchButton }).perform();
			await searchButton.click();
			console.log("Search button clicked");
			await sleep(3000);
		} catch (error) {
			result.error = "Failed to click search button: " + error.message;
			return result;
		}

		// Check for validation errors
		try {
			let errorElement = await driver.findElement(By.css("li[style*='color:red']"));
			let errorText = await errorElement.getText();
			console.log("Error found:", errorText);

			if (errorText.includes("Caractères de vérification")) {
				// Captcha error - retry
				result.name = "";
				return result;
			} else {
				result.error = "Validation error: " + errorText;
				return result;
			}
		} catch (error) {
			// No error found, continue to extract data
			console.log("No validation errors");
		}

		// Wait for results table to load
		try {
			await driver.wait(until.elementLocated(By.id("anomalieForm:listeRechercheIce")), 10000);
			console.log("Results table found");
		} catch (error) {
			result.error = "Results table not found - ICE may be invalid";
			return false;
		}

		// Extract company data from the table
		try {
			// Company name (Dénomination)
			let nameElement = await driver.findElement(By.id("anomalieForm:listeRechercheIce:0:j_id_r"));
			result.name = (await nameElement.getText()).trim().replace(/\s+/g, " ");

			// ICE number
			let iceElement = await driver.findElement(By.id("anomalieForm:listeRechercheIce:0:j_id_11"));
			result.ice = (await iceElement.getText()).trim();

			// IF (Identification Fiscale)
			let ifElement = await driver.findElement(By.id("anomalieForm:listeRechercheIce:0:j_id_14"));
			result.identifiantFiscale = (await ifElement.getText()).trim();

			// RC (Registre de Commerce)
			let rcElement = await driver.findElement(By.id("anomalieForm:listeRechercheIce:0:j_id_17"));
			result.numeroRc = (await rcElement.getText()).trim();

			// Juridiction
			let juridictionElement = await driver.findElement(By.id("anomalieForm:listeRechercheIce:0:j_id_1a"));
			result.juridiction = (await juridictionElement.getText()).trim();

			// CNSS
			let cnssElement = await driver.findElement(By.id("anomalieForm:listeRechercheIce:0:j_id_1d"));
			result.cnss = (await cnssElement.getText()).trim();

			console.log("Data extracted successfully:", result);
		} catch (error) {
			result.error = "Failed to extract company data: " + error.message;
			return result;
		}
	} catch (error) {
		result.error = "Unexpected error: " + error.message;
		console.error("Error:", error);
	} finally {
		await driver.quit();
	}

	// If we didn't get a name, something went wrong
	if (!result.name) {
		return false;
	}

	return result;
}

const putICE = async (req, res) => {
	const ICE = req.params.key;
	let result;

	do {
		result = await ICE_case(ICE);

		if (result === false) {
			res.status(406).send("Invalid ICE");
			return;
		}
		if (result.error) {
			res.status(500).send(`Problem in the server : ${result.error}`);
			return;
		}
	} while (result.name === "");

	if (result.name) {
		// Update database (uncomment when ready)
		await Company.findOneAndUpdate(
			{ identifiantCommunEntreprise: ICE },
			{
				$set: {
					name: result.name,
					identifiantFiscale: result.identifiantFiscale,
					identifiantCommunEntreprise: ICE,
					numeroRc: result.numeroRc,
					juridiction: result.juridiction,
					cnss: result.cnss,
				},
			},
			{ new: true }
		)
			.then((newC) => console.log("company updated Successfully : ", newC))
			.catch((error) => console.log("Error updating company : ", error));

		res.status(200).send(result);
	}
};

module.exports = { getICE, putICE };
