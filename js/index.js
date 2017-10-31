// CITATION: drawTrees(data) based off cats-and-dogs-scatter in class
console.clear();

// Copies a variable number of methods from source to target.
d3.rebind = function(target, source) {
  var i = 1, n = arguments.length, method;
  while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments);
    return value === source ? target : value;
  };
}

// setup slider
d3.select('#slider9').call(d3.slider().value( [10, 30] ).orientation("vertical")
  .on("slideend", minMax => { 
    filterParams.DBHmin = minMax[0];
    filterParams.DBHmax = minMax[1]; 
  }));

// Set up projection that the map is using
const mapWidth = 750;
const mapHeight = 750;
const projection = d3.geoMercator()
  .center([-122.433701, 37.767683]) // San Francisco, roughly
  .scale(225000)
  .translate([mapWidth / 2, mapHeight / 2]);

// This is the mapping between <longitude, latitude> position to <x, y> pixel position on the map projection is a function and it has an inverse:
// projection([lon, lat]) returns [x, y]
// projection.invert([x, y]) returns [lon, lat]

// Globals
let completeDataset = [];
let POIs = [{
  Latitude: 37.7722386113234,
  Longitude: -122.419630895813,
  ID: "A",
  color: "red"
}, {
  Latitude: 37.7723771523117,
  Longitude: -122.423530217156,
  ID: "B",
  color: "blue"
}];
let filterParams = {
  DBHmin: null,
  DBHmax: null,
  maxDistFromA: 2.1, // miles DEBUG
  maxDistFromB: 2.1, // miles DEBUG
  pointAxy: projection([POIs[0].Longitude, POIs[0].Latitude]),
  pointBxy: projection([POIs[1].Longitude, POIs[1].Latitude]),
  filterByPOIs: false
};

// Add an SVG element to the DOM
let svg = d3.select('body').append('svg')
.attr('width', mapWidth)
.attr('height', mapHeight);

// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
.attr('width', mapWidth)
.attr('height', mapHeight)
.attr('xlink:href', 'https://magrawala.github.io/cs448b-fa17/assets/a3/sf-map.svg');

drawPOIs();
let pointA = d3.select('#A');
let pointB = d3.select('#B');

// load data
d3.csv('data/trees-mini.csv' /* DEBUG */, function(data) {
 data.forEach(d => { 
  if (unususable(d)) return;
  else completeDataset.push(clean(d)); 
});
 console.log(completeDataset);
 createVis();
});

function createVis() {
  drawTrees();
}

function drawTrees() {
  let data = applyFilters();
  let circles = svg.selectAll('.tree');
  let updatedCircles = circles.data(data, d => d.TreeID);
  // make circle 'pointers' for new datapoints, append actual new circle SVGs
  let newCircles = updatedCircles.enter().append('circle')
  .attr('r', 4)
  .attr('cx', d => projToPix(d)[0])
  .attr('cy', d => projToPix(d)[1])
  .style('fill', 'steelblue')
  .classed("tree", true)
  .on("click", (d) => c(d));
  updatedCircles.exit().remove();
}

function applyFilters() {
  let filteredData = deepCopy(completeDataset); // QUESTION: is this a terrible idea?
  if (filterParams.DBHmin !== null) {
    c("Filtering DBHmin");
    filteredData = filteredData.filter(d => (d.DBH >= filterParams.DBHmin));
  }
  if (filterParams.DBHmax !== null) {
    c("Filtering DBH MAX");
    filteredData = filteredData.filter(d => (d.DBH <= filterParams.DBHmax));
  }
  if (filterParams.filterByPOIs) {
    c("Filtering by POIs");
    filteredData = filteredData.filter(d => inRangeOfPOIs(d));   
  }
  return filteredData;
}

function inRangeOfPOIs(d) {
  let AisGood = dist(filterParams.pointAxy, projToPix(d)) <= filterParams.maxDistFromA;
  let BisGood = dist(filterParams.pointBxy, projToPix(d)) <= filterParams.maxDistFromB;
  return AisGood && BisGood;
}


function drawPOIs() {
  svg.selectAll('.POI').data(POIs, d => d.ID).enter()
  .append('circle')
  .attr('r', 20)
  .attr('cx', d => projToPix(d)[0])
  .attr('cy', d => projToPix(d)[1])
  .style('fill', d => d.color)
  .attr('id', d => d.ID) // 'A' or 'B'
  .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));
}

// _________Event Handlers_________ 

function filter(e, filterType) {
  if (filterType == "POIs") {
    let slider = d3.select("#POI-slider");
    slider.classed('slider-active', !slider.classed('slider-active'));
    filterParams.filterByPOIs = slider.classed('slider-active');
  } else {
    let num = e.value; 
    if (isNaN(num)) return;
    filterParams[filterType] = ((num == '') ? null : num);
  } 
  drawTrees();
}

// _________Helper Functions_________

// CITATION: based off piazza post by Alec Glassford
function dist(xy1, xy2) {
  // let xy1 = [200, 600]; // location in x,y pixels on map
  // let xy2 = [300, 600]; // this is 100 pixels away

  let lonLat1 = projection.invert(xy1);
  let lonLat2 = projection.invert(xy2);

  let radianDistance = d3.geoDistance(lonLat1, lonLat2); 
  let fractionOfTheWayAroundTheEarth = radianDistance / (2 * Math.PI);
  let earthCircumference = 24901; // in miles

  return fractionOfTheWayAroundTheEarth * earthCircumference; 
}

// Filter out any datum missing crucial info
function unususable(d) {
  if (d.qSpecies.split('::')[1] == '' || d.DBH == '0') {
    return true;
  }
  return !(d.Latitude && d.Longitude && d.qSpecies 
    && d.qAddress && d.DBH && d.PlotSize);
}

function clean(d) {
  d.TreeID    = +d.TreeID;
  d.DBH       = +d.DBH;
  d.Latitude  = +d.Latitude;
  d.Longitude = +d.Longitude; 
  // TO DO: d.PlotSize relevent to normalize? 
  return d;
}

// CITATION: Xah Lee
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Drag behaviour. CITATION: based on Mike Bostock's "Circle Dragging I"
function dragstarted(d) {
  d3.select(this).raise().classed("clicked", true);
}

// called every time an element moves some amount
function dragged(d) {
  d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

function dragended(d) {
  d3.select(this).classed("clicked", false);
  if (filterParams.filterByPOIs) {
    c("Drag done. Time to filter by POIs");
    if (d.ID == "A") filterParams.pointAxy = [d.x, d.y];
    else filterParams.pointBxy = [d.x, d.y];
    drawTrees();
  }
}

function projToPix(d) {
  return projection([d.Longitude, d.Latitude]);
}

function c(str) {
  console.log(str);
}