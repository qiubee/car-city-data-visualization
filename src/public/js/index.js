createChoroplethMap();

async function createChoroplethMap() {
	const descriptions = ["Totaal aantal parkeerplaatsen", "Totaal aantal parkeerplaatsen die het hele jaar open zijn", "Totaal aantal parkeerplaatsen met de uitgang altijd open"];
	const path = setupMap(600, 600);
	const provinces = await loadJSON("data/parking_provinces_topo.json");
	addSelectForm(provinces.features, descriptions);
	drawMap(path, provinces);
}

function setupMap(width, height) {	
	const legendSize = {
		width: width * 0.8,
		height: 10
	};

	const svg = d3.select("#map")
		.insert("svg", ":first-child")
		.attr("viewBox", "0 0 " + 600 + " " + 600)
		.attr("width", width)
		.attr("height", height);
	
	const legend = svg.append("g")
		.attr("class", "legend")
		.attr("transform", `translate(${legendSize.height}, ${legendSize.height * 3})`);

	svg.insert("defs", ":first-child")
		.append("linearGradient")
		.attr("id", "linear-gradient")
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "100%")
		.attr("y2", "0%");
	
	legend.append("rect")
		.attr("x", -legendSize.width / 2)
		.attr("y", 0)
		.attr("width", legendSize.width / 2)
		.attr("height", legendSize.height)
		.attr("transform", `translate(${legendSize.width / 2}, ${legendSize.height})`)
		.attr("fill", "url(#linear-gradient)");

	legend.append("text")
		.text("Parkeerplaatsen")
		.style("font-weight", "500")
		.style("font-size", "0.85rem");

	const legendScale = d3.scaleLinear([0, 200000], [10, 249]);
	
	legend.append("g")
		.attr("class", "ticks")
		.attr("transform", "translate(-10, 20)")
		.call(d3.axisBottom(legendScale).ticks(3))
		.select(".domain").remove()
		.style("font-size", "0.85rem");
	
	svg.append("g")
		.attr("class", "map");
	
	const scale = width * height / 50;

	const projection = d3.geoMercator()
		.rotate([5.38763888888889, 0])
		.center([0, 52.15616055555555])
		.scale(scale)
		.translate([-990, height / 2]);
	const path = d3.geoPath().projection(projection);
	return path;
}

function drawMap(path, data, node=null) {
	const selected = node ? 
		node.selectedOptions.item(0).dataset.key : 
		"parkingTotal";

	const selectedData = dataFromKey(data.features, selected);

	const svg = d3.select("#map svg");
	const map = d3.select("#map svg g.map");
	const select = d3.select("#map form select");
		
	const max = d3.max(selectedData);
	const n = 10 ** (max.toString().length - 1);
	const ceil = Math.ceil(max / n) * n;
	const color = d3.scaleSequential([0, ceil], d3.interpolatePurples);

	svg.select("linearGradient")
		.selectAll("stop")
		.data(color.range())
		.enter()
		.append("stop")
		.attr("offset", function (d, i) {
			return i / (color.range().length-1);
		})
		.attr("stop-color", function (d) {
			return d;
		});
	
	map.selectAll("path")
		.data(data.features)
		.join(function (enter) {
				enter.append("path")
					.attr("class", "province")
					.attr("d", path)
					.attr("stroke", "#ffffff")
					.attr("fill", function (d) {
						return color(d.properties[selected]);
					})
					.append("title")
					.text(function (d) {
						const info = d.properties;
						return `Provincie ${info.province} \n${info[selected]} parkeerplaatsen`;
		});
		}, function (update) {
				update.attr("fill", function (d) {
						return color(d.properties[selected]);
					})
					.selectAll("title")
					.text(function (d) {
						const info = d.properties;
						return `Provincie ${info.province}\n${info[selected]} parkeerplaatsen`;
					});
		}, function (exit) {
				exit.remove();
		});

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
