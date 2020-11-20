createChoroplethMap();

async function createChoroplethMap() {
	const path = setupMap(600, 600);
	const provincesGeometry = await loadJSON("data/parking_provinces_topo.json");
	const provincesParkingData = provincesGeometry.features;
	addForm(provincesParkingData);
	drawMap(path, provincesGeometry);
}

function setupMap(width, height) {	
	d3.select("#map")
		.insert("svg", ":first-child")
		.attr("viewBox", "0 0 " + 600 + " " + 600)
		.attr("width", width)
		.attr("height", height);
	
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

function drawMap(path, data) {
	const map = d3.select("#map svg")
		.append("g");

	const color = d3.scaleSequentialQuantile([
		[1000, 5000, 100000],
		[d3.interpolateBlues()]
	]);

	map.selectAll("path")
		.data(data.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("stroke", "#ffffff")
		.attr("fill", function (d) {
			console.log(color(d.properties.parkingTotal));
		});
		
}

function addForm(data) {	
	const descriptions = ["Totaal aantal parkeerplaatsen", "Totaal aantal parkeerplaatsen die het hele jaar open zijn", "Totaal aantal parkeerplaatsen met de uitgang altijd open"];
	const names = Object.keys(createCategories(data, descriptions))
		.map(function (d) {
			return d;
		});

	const select = d3.select("#map")
		.append("form")
		.append("label")
		.text("De verdeling van het ")
		.append("select")
		.attr("name", "parking");
	
	select.selectAll("option")
		.data(names)
		.enter()
		.append("option")
		.attr("value", function (d) {
			return d;
		})
		.data(descriptions)
		.text(function (d) {
			return d.toLowerCase();
		});
	


}

function createCategories(data, descriptions) {
	return data.map(function (feature) {
		return Object.entries(feature.properties)
			.reduce(function (acc, property) {
				const key = property[0];
				const value = property[1];
				if (typeof value === "number") {
					acc.push(key.toLowerCase());
				}
				return acc;
			}, []);
	}).reduce(function (acc, arr) {
		return acc.concat(arr);
	}).filter(function (a, b, arr) {
		return arr.indexOf(a) === b;
	}).reduce(function (acc, name, i) {
		for (let j = 0; j < descriptions.length; j++) {
			const description = descriptions[j];
			if (i === j) {
				Object.assign(acc, {
					[name]: description
				});
			}
		}
		return acc;
	}, {});
}

async function loadJSON(path) {
	const data = await d3.json(path);
	return topojson.feature(data, data.objects);
}
