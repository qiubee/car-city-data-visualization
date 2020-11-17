createChoroplethMap();

async function createChoroplethMap() {
	const path = setupMap(800, 800);
	const provincesData = await loadJSON("data/parking_provinces.json");
	drawMap(path, provincesData);
}

function setupMap(width, height) {	
	d3.select("svg")
		.attr("viewBox", "0 0 " + width + " " + height)
		.attr("width", width)
		.attr("height", height);
	
	const projection = d3.geoMercator();
	const path = d3.geoPath().projection(projection);
	return path;
}

function drawMap(path, data) {
	const map = d3.select("svg")
		.append("g");

	map.selectAll("path")
		.data(data.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("fill", "#000");
}

async function loadJSON(path) {
	const data = await d3.json(path);
	return data;
}
