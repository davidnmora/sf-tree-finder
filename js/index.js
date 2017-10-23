console.clear();
// Set up size
let mapWidth = 750;
let mapHeight = 750;

// Set up projection that the map is using
let projection = d3.geoMercator()
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
var dataset = []
d3.csv("https://magrawala.github.io/cs448b-fa17/assets/a3/trees.csv", function(data) {
   dataset = data.map(function(d) { 
     
     return d; });
   console.log(dataset)
});

// var projectedLocation = projection([treeLon, treeLat]);
// var circle = svg.append('circle')
//   .attr('cx', projectedLocation[0])
//   .attr('cy', projectedLocaiton[1])
//   .attr('r', 10);