const ObjectsToCsv = require("objects-to-csv");
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_KEY = "UN2d6SNd0RoesuGxxAKFVin9UPnNHEAmfhejdZa5";

const app = express();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (req, res) => {
	res.render("index");
});

app.get("/download", async (req, res) => {
	let candidates = [],
		jobApps = [],
		currentURL =
			"https://api.teamtailor.com/v1/candidates?include=job-applications&page[size]=30&page[number]=1";

	do {
		try {
			const result = await axios({
				method: "get",
				url: currentURL,
				headers: {
					Authorization: `Token token=${API_KEY}`,
					"X-Api-Version": "20210218",
				},
			});

			candidates = candidates.concat(result.data.data);
			jobApps = jobApps.concat(result.data.included);

			if (result.data.links.next) {
				currentURL = result.data.links.next;
			} else {
				currentURL = null;
			}
		} catch (error) {
			console.log(error);
		}
	} while (currentURL != null);

	const mappedCandidates = candidates.map((candidate, index) => ({
		candidate_id: candidate.id,
		first_name: candidate.attributes["first-name"],
		last_name: candidate.attributes["last-name"],
		email: candidate.attributes.email,
		job_application_id: jobApps[index].id,
		job_application_created_at: jobApps[index].attributes["created-at"],
	}));

	const csv = new ObjectsToCsv(mappedCandidates);
	await csv.toDisk("./candidates.csv");
	return res.download("./candidates.csv", () => {
		fs.unlinkSync("./candidates.csv");
	});
});

app.listen(3000, () => {
	console.log("Server running on port 3000");
});
