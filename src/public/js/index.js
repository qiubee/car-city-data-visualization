createChoroplethMap();

async function createChoroplethMap() {
	const path = setupMap(600, 600);
	const provincesData = await loadJSON("data/parking_provinces_topo.json");
	drawMap(path, provincesData);
}

function setupMap(width, height) {	
	d3.select("svg")
		.attr("viewBox", "0 0 " + width + " " + height)
		.attr("width", width)
		.attr("height", height);
	
	const scale = width * height / 50;
	const trans_left = width % height !== 0 ? 
		-width % scale / (scale / 12500) + (width % height * 0.33) :
		-width % scale / (scale / 12500);
	console.log(scale, trans_left);

	const projection = d3.geoMercator()
		.rotate([5.38763888888889, 0])
		.center([0, 52.15616055555555])
		.scale(scale)
		.translate([trans_left, height / 2]);
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
		.attr("stroke", "#77bb00")
		.attr("fill", "#fbfbfb");

}

async function loadJSON(path) {
	const data = await d3.json(path);
	return topojson.feature(data, data.objects);
}
