createChoroplethMap();

async function createChoroplethMap() {
	const descriptions = ["Totaal aantal parkeerplaatsen", "Totaal aantal parkeerplaatsen die het hele jaar open zijn", "Totaal aantal parkeerplaatsen met de uitgang altijd open"];
	const path = setupMap(600, 600);
	const provincesGeometry = await loadJSON("data/parking_provinces_topo.json");
	const provincesParkingData = provincesGeometry.features;
	addSelectForm(provincesParkingData, descriptions);
	drawMap(path, provincesGeometry);
}

function setupMap(width, height) {	
	d3.select("#map")
		.insert("svg", ":first-child")
		.attr("viewBox", "0 0 " + 600 + " " + 600)
		.attr("width", width)
		.attr("height", height)
		.append("g");
	
	const scale = width * height / 50;
	const transLeft = width % height !== 0 ? 
		-width % scale / (scale / 12500) + (width % height * 0.33) :
		-width % scale / (scale / 12500);

	const projection = d3.geoMercator()
		.rotate([5.38763888888889, 0])
		.center([0, 52.15616055555555])
		.scale(scale)
		.translate([transLeft, height / 2]);
	const path = d3.geoPath().projection(projection);
	return path;
}

function drawMap(path, data, node=null) {
	const selected = node ? 
		node.selectedOptions.item(0).dataset.key : 
		"parkingTotal";

	const selectedData = dataFromKey(data.features, selected);

	const map = d3.select("#map g");
	const select = d3.select("#map form select");
		
	const max = d3.max(selectedData);
	const n = 10 ** (max.toString().length - 1);
	const ceil = Math.ceil(max / n) * n;
	const color = d3.scaleSequential([0, ceil], d3.interpolateBlues);

	// enter
	map.selectAll("path")
		.data(data.features)
		.enter()
		.append("path")
		.attr("class", "province")
		.attr("d", path)
		.attr("stroke", "#ffffff")
		.append("title");

	// update
	map.selectAll(".province")
		.data(data.features)
		.attr("fill", function (d) {
			return color(d.properties[selected]);
		})
		.selectAll("title")
			.text(function (d) {
				const info = d.properties;
				return `Provincie ${info.province} \n${info[selected]} parkeerplaatsen`;
		});
	
	// exit
	map.selectAll(".province")
		.data(data.features)
		.exit()
		.remove();

	// uncomment to see exit pattern:
	// data.features = data.features.slice(0, data.features.length - 1);

	select.on("change", function (event) {
		drawMap(path, data, event.target);
	});
}

function addSelectForm(data, descriptions) {	
	const keys = listOfKeysWithNumberValue(data);

	const select = d3.select("#map")
		.append("form")
		.append("label")
		.text("De verdeling van het ")
		.append("select")
		.attr("name", "parking");
	
	select.selectAll("option")
		.data(keys)
		.enter()
		.append("option")
		.attr("value", function (d) {
			return d.toLowerCase();
		})
		.attr("data-key", function (d) {
			return d;
		})
		.data(descriptions)
		.text(function (d) {
			return d.toLowerCase();
		});
}

function dataFromKey(data, keyToFilter) {
	return data.map(function (feature) {
		return Object.entries(feature.properties)
			.reduce(function (acc, property) {
				const key = property[0];
				const value = property[1];
				if (key === keyToFilter && typeof value === "number") {
					acc.push(value);
				}
				return acc;
			}, []);
	}).reduce(function (acc, arr) {
		return acc.concat(arr);
	}).filter(function (a, b, arr) {
		return arr.indexOf(a) === b;
	});
}

function listOfKeysWithNumberValue(data) {
	return data.map(function (feature) {
		return Object.entries(feature.properties)
			.reduce(function (acc, property) {
				const key = property[0];
				const value = property[1];
				if (typeof value === "number") {
					acc.push(key);
				}
				return acc;
			}, []);
	}).reduce(function (acc, arr) {
		return acc.concat(arr);
	}).filter(function (a, b, arr) {
		return arr.indexOf(a) === b;
	});
}

async function loadJSON(path) {
	const data = await d3.json(path);
	return topojson.feature(data, data.objects);
}
