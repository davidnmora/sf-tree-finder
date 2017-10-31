// Set up projection that the map is using
const mapWidth = 750;
const mapHeight = 750;
const projection = d3.geoMercator()
  .center([-122.433701, 37.767683]) // San Francisco, roughly
  .scale(225000)
  .translate([mapWidth / 2, mapHeight / 2]);

// Globals
let colors = {
  blue: "#364E97",
  green: "#5C953E",
  red: "#AB3D2B"
}

let maxDistFromAnyPoint = 10; // miles
let completeDataset = [];
let POIs = [{
  Latitude:37.8066799978444,
  Longitude:-122.425855144407,
  ID: "A",
  color: colors.red
}, {
  Latitude: 37.8044183160192,
  Longitude: -122.446035175776,
  ID: "B",
  color: colors.blue
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
let svg = d3.select('#canvas').append('svg')
.attr('width', mapWidth)
.attr('height', mapHeight);

// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
.attr('width', mapWidth)
.attr('height', mapHeight)
.attr('xlink:href', 'https://magrawala.github.io/cs448b-fa17/assets/a3/sf-map.svg');

drawPOIs();

// load data
let DBHrange = [];
d3.csv('data/trees.csv', function(data) {
 data.forEach(d => { 
  if (unususable(d)) return;
  else completeDataset.push(clean(d)); 
});
 createVis();
 createSliders([d3.min(DBHrange), d3.max(DBHrange)]);
});

function createVis() {
  drawTrees();
}

// CITATION: drawTrees(data) based off cats-and-dogs-scatter in class
function drawTrees() {
  let data = applyFilters();
  let circles = svg.selectAll('.tree');
  let updatedCircles = circles.data(data, d => d.TreeID);
  // make circle 'pointers' for new datapoints, append actual new circle SVGs
  let newCircles = updatedCircles.enter().append('circle')
  .attr('r', 4)
  .attr('cx', d => projToPix(d)[0])
  .attr('cy', d => projToPix(d)[1])
  .style('fill', colors.green)
  .classed("tree", true)
  .on("click", (d) => console.log(d));
  updatedCircles.exit().remove();
}

function applyFilters() {
  let filteredData = deepCopy(completeDataset); // QUESTION: is this a terrible idea?
  if (filterParams.DBHmin !== null) {
    filteredData = filteredData.filter(d => (d.DBH >= filterParams.DBHmin));
  }
  if (filterParams.DBHmax !== null) {
    filteredData = filteredData.filter(d => (d.DBH <= filterParams.DBHmax));
  }
  if (filterParams.filterByPOIs) {
    filteredData = filteredData.filter(d => inRangeOfPOIs(d));   
  }
  return filteredData;
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
    let toggle = d3.select("#POI-toggle");
    toggle.classed('toggle-active', !toggle.classed('toggle-active'));
    filterParams.filterByPOIs = toggle.classed('toggle-active');
    d3.select("#POI-sliders").classed('active', toggle.classed('toggle-active'));
  }
  drawTrees();
}

// _________Helper Functions_________

// CITATION: based off piazza post by Alec Glassford
function dist(xy1, xy2) {
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
  
  DBHrange.push(+d.DBH);
  return d;
}

function createSliders(range) {
  // DBH range slider
  d3.select('#DBH-range-slider').call(d3.slider().value(range).orientation("horizontal")
    .min(range[0])
    .max(range[1])
    .on("slideend", minMax => { 
      filterParams.DBHmin = minMax[0];
      filterParams.DBHmax = minMax[1]; 
      drawTrees();
    })
    .on("slide", minMax => {
      d3.select('#DBH-range-slider-min').text(round(minMax[0], 2));
      d3.select('#DBH-range-slider-max').text(round(minMax[1], 2));
    }));
  // add initial values
  d3.select('#DBH-range-slider-min').text(round(range[0], 2));
  d3.select('#DBH-range-slider-max').text(round(range[1], 2));

  // POI A slider
  d3.select('#POI-slider-A').call(d3.slider().max(maxDistFromAnyPoint)
    .on("slideend", value => { 
      filterParams.maxDistFromA = value;
      drawTrees();
    })
    .on("slide", value => {
      d3.select('#POI-slider-A-max').text(round(value, 2));
    }));

  // POI B slider
  d3.select('#POI-slider-B').call(d3.slider().max(maxDistFromAnyPoint)
    .on("slideend", value => { 
      filterParams.maxDistFromA = value;
      drawTrees();
    })
    .on("slide", value => {
      d3.select('#POI-slider-B-max').text(round(value, 2));
    }));
}

function inRangeOfPOIs(d) {
  let AisGood = dist(filterParams.pointAxy, projToPix(d)) <= filterParams.maxDistFromA;
  let BisGood = dist(filterParams.pointBxy, projToPix(d)) <= filterParams.maxDistFromB;
  return AisGood && BisGood;
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
    if (d.ID == "A") filterParams.pointAxy = [d.x, d.y];
    else filterParams.pointBxy = [d.x, d.y];
    drawTrees();
  }
}

function projToPix(d) {
  return projection([d.Longitude, d.Latitude]);
}

// CITATION: MDN
function round(value, exp) {
  if (typeof exp === 'undefined' || +exp === 0) return Math.round(value);
  value = +value;
  exp = +exp;
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
    return NaN;
  // Shift
  value = value.toString().split('e');
  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
  // Shift back
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}