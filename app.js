const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { getICE, putICE } = require("./e2e/scrapICE.GOV.MA");
const { getCompanyByName } = require("./e2e/scrapCharkia");

require("dotenv").config();
const multer = require("multer");
const { dataExtraction, dataExtractionBase64, BankAlMaghribApi, dataExtractionFromPdf } = require("./openAi/imageToText");
const fs = require("fs");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const storagePdf = multer.diskStorage({
	destination: function (req, file, cb) {
		// Specify the directory to save the uploaded files
		const uploadDir = "pdf_uploads"; // Create an uploads directory
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir); // Create uploads directory if it doesn't exist
		}
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		// Use the original file name
		cb(null, "pdf1.pdf");
	},
});
const uploadPdf = multer({ storage: storagePdf });

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
	const currentTime = new Date().toISOString();
	console.log(`${currentTime} - ${req.method} ${req.url}`);
	next();
});

app.post("/imgToTxt", upload.single("image"), dataExtractionBase64);

app.post("/pdfToTxt", uploadPdf.single("pdf"), dataExtractionFromPdf);

app.get("/currencyChange", BankAlMaghribApi);

app.get("/ice/:key", getICE);

app.put("/ice/:key", putICE);

app.get("/company/name/:name", getCompanyByName);
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
