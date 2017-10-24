// CITATION: drawTrees(data) based off cats-and-dogs-scatter in class
console.clear();
// Set up size
const mapWidth = 750;
const mapHeight = 750;

// Set up projection that the map is using
const projection = d3.geoMercator()
  .center([-122.433701, 37.767683]) // San Francisco, roughly
  .scale(225000)
  .translate([mapWidth / 2, mapHeight / 2]);

// This is the mapping between <longitude, latitude> position to <x, y> pixel position on the map projection is a function and it has an inverse:
// projection([lon, lat]) returns [x, y]
// projection.invert([x, y]) returns [lon, lat]

// Add an SVG element to the DOM
let svg = d3.select('body').append('svg')
.attr('width', mapWidth)
.attr('height', mapHeight);

// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
.attr('width', mapWidth)
.attr('height', mapHeight)
.attr('xlink:href', 'https://magrawala.github.io/cs448b-fa17/assets/a3/sf-map.svg');



// load data
d3.csv('data/trees.csv', function(data) {
 let dataset = [];
 data.forEach(d => { 
  if (unususable(d)) return;
  else dataset.push(clean(d)); 
});
 console.log(dataset);
 createVis(dataset);
});

//let projectedLocation = projection([treeLon, treeLat]);
//let circle = svg.append('circle')
//   .attr('cx', projectedLocation[0])
//   .attr('cy', projectedLocaiton[1])
//   .attr('r', 10);

function createVis(data) {
  drawTrees(data);
}


function drawTrees(data) {
  let circles = svg.selectAll('circle');
  let updatedCircles = circles.data(data, d => d.TreeID);
  // make circle 'pointers' for new datapoints
  let enterSelection = updatedCircles.enter();
  // now append actual new circle SVGs
  let newCircles = enterSelection.append('circle')
    .attr('r', 4)
    .attr('cx', d => projection([d.Longitude, d.Latitude])[0])
    .attr('cy', d => projection([d.Longitude, d.Latitude])[1])
    .style('fill', 'steelblue')
    .on("click", (d) => c(d.qSpecies));

  updatedCircles.exit().remove();

}

// _________Helper Functions_________

// Filter out any datasets missing crucial info
function unususable(d) {
  if (d.qSpecies.split('::')[1] == '') {
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
  // d.PlotSize relevent to normalize? 
  return d;
}

function c(str) {
  console.log(str);
}