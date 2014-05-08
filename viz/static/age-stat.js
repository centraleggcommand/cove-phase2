/* File: age_stat.js
 * Purpose: provide functions to create a distribution graph
 */

// A container for global vars
AH = {};


// A formatter for counts.
//AH.formatCount = d3.format(",.0f");

// Default dimensions for graph
AH.margin = {top: 10, right: 20, bottom: 30, left: 20};
AH.width = 360 - AH.margin.left - AH.margin.right;
AH.height = 260 - AH.margin.top - AH.margin.bottom;

AH.x = d3.scale.linear();
AH.y = d3.scale.linear();
AH.xAxis = d3.svg.axis();

AH.data_layout = d3.layout.histogram();

AH.process_data = function( miceGenData) {
   // miceGenData is an array of generations, each being an array of mice objs. 
   // find the age of each mouse and put in 1D array
   var ages = [];
   var today = moment().startOf('day'); // don't include hours, etc
   for (var i=0; i < miceGenData.length; i++) {
      miceGenData[i].forEach( function(elem)
      {
         var elemAge = moment( elem.dob, 'YYYYMMDD');
         ages.push( today.diff( elemAge, 'days'));
      });
   }
   return ages;
};

// Input: id of a dom element, and width and height of svg
function create_histogram( parentId, miceGenData, width, height ) {

   width = width ? width : AH.width;
   height = height ? height : AH.height;
   var graphValues = AH.process_data( miceGenData);
   var posHeight = height + 20;
   AH.x
    .domain([0, Math.max.apply(null, graphValues)])
    .rangeRound([0, width]);

   // Generate a histogram using twenty uniformly-spaced bins.
   AH.data_layout.bins(AH.x.ticks(20));
   var dataLayout = AH.data_layout( graphValues);
   AH.y
    .domain([0, d3.max( dataLayout, function(d) { return d.y; })])
    .range([height, 0]);

   AH.xAxis
    .scale(AH.x)
    .orient("bottom");

   var svg = d3.select( "#" + parentId).append("svg")
       .attr("width", width + AH.margin.left + AH.margin.right)
       .attr("height", posHeight + AH.margin.top + AH.margin.bottom)
     .append("g")
       .attr("transform", "translate(" + AH.margin.left + "," + AH.margin.top + ")");

   
   var bar = svg.selectAll(".bar")
       .data(dataLayout)
     .enter().append("g")
       .attr("class", "bar")
       .attr("transform", function(d) { 
          var ypos = AH.y(d.y) + 20;
          //return "translate(" + AH.x(d.x) + "," + AH.y(d.y) + ")"; });
          return "translate(" + AH.x(d.x) + "," + ypos + ")"; });
   
   bar.append("rect")
       .attr("x", 1)
       .attr("width", AH.x(dataLayout[0].dx) - 1)
       .attr("height", function(d) { 
          return height - AH.y(d.y); })
       .style("fill", "#C0C0C0");
   
   bar.append("text")
       .attr("dy", ".75em")
       .attr("y", -15)
       .attr("x", AH.x(dataLayout[0].dx) / 2)
       .attr("text-anchor", "middle")
       .text(function(d) { return d.y > 0 ? d.y : ""; });
   
   svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + posHeight + ")")
       .call(AH.xAxis);

}


