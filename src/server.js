const express = require("express");
const app = express();
const path = require("path");

const port = 8000;

app.use(express.static(path.join(__dirname, "public")))
	.disable("x-powered-by")
	.listen(port, function () {
		console.log("Listening on port", port);
	});