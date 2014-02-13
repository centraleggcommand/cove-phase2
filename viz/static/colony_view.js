/**
 * Created by user on 2/8/14.
 */

// The var CV is a container for global data to be referenced explicitly.
var CV = {};

// Allow function currying - copied from "Javascript: The Good Parts" by Crockford
Function.prototype.curry = function() {
    var slice = Array.prototype.slice,
            args = slice.apply(arguments),
            that = this;
    return function() {
        return that.apply(null, args.concat(slice.apply(arguments)));
    };
};

// General function to determine if an object is empty
function is_empty( obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop) ) {
            return false;
        }
    }
    return true;
}

// Assign values to the CV.fit_scale function and CV.genFoci positions
function set_scale_foci( nodeLayouts) {
    // Determine the horizontal spacing for each generation based on root node radius.
    for (var i=0; i < nodeLayouts.length; i++) {
        var currGen = nodeLayouts[i];
        for (var j=0; j < currGen.length; j++) {
            if (currGen[j].depth == 0) {
                CV.genFoci[i] = {'radius': currGen[j].r,
                    'x': currGen[j].x,
                    'y': currGen[j].y};
                break;
            }
        }
    }

    var genPadding = 25;
    // Add diameter of each generation to scale width.
    var totSpan = CV.genFoci.reduce( function( prev, curr, i, array) {
        return prev + curr.radius * 2;
    }, 0)
    totSpan = totSpan + (genPadding * (nodeLayouts.length - 1));
    // Get max radius to scale the height.
    var maxRadius = CV.genFoci.reduce( function( prev, curr, i, array) {
        return (prev < curr.radius) ? curr.radius : prev;
    }, 0)

    // Create scale function
    var x_scale = d3.scale.linear().domain([0, totSpan]).range([0, CV.width]);
    var y_scale = d3.scale.linear().domain([0, maxRadius*2]).range([0, CV.height]);
    CV.fit_scale = (x_scale(maxRadius) < y_scale(maxRadius)) ? x_scale : y_scale;

    // Assign foci values
    var runningSum = 0; // Keep track of offset from left of graph
    for (var i=0; i < CV.genFoci.length; i++) {
        var scaledRadius = CV.fit_scale(CV.genFoci[i].radius);
        CV.genFoci[i].radius = scaledRadius;
        CV.genFoci[i]['dx'] = runningSum + scaledRadius - CV.genFoci[i].x;
        CV.genFoci[i]['dy'] = 0;
        runningSum = runningSum + genPadding + (scaledRadius * 2);
    }

}

function initialize( miceData, currDomain) {
    CV.allMice = JSON.parse( miceData);
    //The allMice object is an array of arrays for generation data, and element a json object.
    //Convert to format for hierarchical packing (1 level for all objects of a generation).
    //Use separate layout for each generation.
    CV.miceGenData = [];
    for (var i=0; i < CV.allMice.length; i++) {
        CV.miceGenData.push( {'name': 'Gen' + i, 'children': CV.allMice[i]});
    }

    // Mice data format needs to support additional hierarchy such as by gender and litter.
    // Create an object with a field that supplies ordered array of functions to apply to
    // the data in most basic form - grouped by generation.
    CV.formattedData = { // format_fxns are functions that take one parameter - array of raw data objects
                        'format_fxns': [],
                        'miceData': CV.miceGenData,
                        'get_hierarchy': function() {
                            // Recursive helper fxn
                            var that = this;
                            var applyFormat = function( parentName, currLevel, format_index) {
                                var innerHierarchy = [];
                                for (var ci=0; ci < currLevel.length; ci++) {
                                    var formattedGroup =
                                        // Ensure the group name is unique for the circles denoting a group, and not
                                        // a node, ie. a female and male group will both have a group representing litter 1
                                        {'name': parentName + currLevel[ci].name,
                                         'colorGroup': typeof currLevel[ci].colorGroup !== 'undefined' ?
                                            currLevel[ci].colorGroup : 'rgba(150,150,150,.9)',
                                         'children': that.format_fxns[format_index]( currLevel[ci].children) };
                                    // A depth first approach in recursion, in which the format_index
                                    // corresponds to depth
                                    if ( (format_index + 1) < that.format_fxns.length) {
                                        // Overwrite children array with additional hierarchy
                                        formattedGroup.children = applyFormat( formattedGroup.name, formattedGroup.children, format_index + 1);
                                    }
                                    else {
                                        // Modify the leaf 'name' with a parent prefix
                                        for( var i=0; i < formattedGroup.children.length; i++) {
                                            formattedGroup.children[i].name = currLevel[ci].name + formattedGroup.children[i].name;
                                        }
                                    }
                                    innerHierarchy.push( formattedGroup);
                                }
                                return innerHierarchy;
                            };
                            if (this.format_fxns.length == 0) {
                                return this.miceData;
                            }
                            // Recursively apply format
                            return applyFormat( '',this.miceData, 0);
                        },
                        // The id parameter needs to correlate with DOM checkbox that uses the 'fmt' function
                        'add_format': function( id, fmt) {
                            // Attach the id as an attribute belonging to the fmt function object
                            fmt.id = id;
                            this.format_fxns.push( fmt);
                        },
                        'remove_format': function( id) {
                            this.format_fxns = this.format_fxns.filter( function( elem) { return elem.id != id; });
                        }
    };

    CV.size_by = function() { return 1;}

    CV.width = 950,
    CV.height = 450;

    CV.href_individual = function(val) {
        return "http://" + currDomain + "/viz/lineage_view/?mouseId=" + val;
    };

    CV.genFoci = [];
    // Estimate boundary circle of each generation to assign layout size
    for (var i=0; i < CV.allMice.length; i++) {
        // Calculate circle size based on number of nodes
        var totalArea = 64* CV.allMice[i].length;
        CV.genFoci[i] = {"estimate": Math.sqrt(totalArea) };
    }

    // Use the circle packing layout to calculate node positions for each generation.
    var nodeLayouts = [];
    for (var i=0; i < CV.miceGenData.length; i++) {
        nodeLayouts.push( d3.layout.pack().size([CV.genFoci[i].estimate * 2, CV.height]).padding(10)
                .value( CV.size_by)
                .nodes( CV.miceGenData[i]));
    }

    set_scale_foci( nodeLayouts);

    return nodeLayouts;
}

function handle_color() {
    var selected = this.value;
    if (selected == "genotype") {
        // Show the gene radio button selectors
        d3.select("#geneSelector").style("display","inline")
    }
    else if (selected == "gender") {
        d3.select("#geneSelector").style("display","none");
        update_color( assign_gender_color);
    }
}

function handle_size() {
    // Assign a function based on value from selector, and parameter is __data__ obj
    var selVal = this.value;
    CV.size_by = function(d) {
        if (selVal == "uniform") {
            return 1;
        }
        else if (selVal == "children") {
            return d.numOffspring + 1;
        }
        else return 1;
    }
    CV.nodeLayout = layout_generations( CV.formattedData.get_hierarchy() );
    update_view( CV.nodeLayout);
    var lines = find_endpoints( CV.nodeLayout, CV.genFoci);
    draw_arrows( CV.svg, lines, AR.line_generator);
}


function assign_gender_color( d) {
    if(d.gender == "F") {
        return "#FF7575";
    }
    else if (d.gender == "M") {
        return "#3366FF";
    }
    else return "#C0C0C0";
}

// This function is meant to be curried, since the selections should not have to be looked up
// for every node that this function is called for.
function assign_genotype_color( selections, d) {
    var unmatched = "#FFFFFF";
    var match = "#00AA00";
    // Try to eliminate by looking for mismatch with selection values since all or no match
    if (d.gene1 in selections) {
        if (d.genotype1 != selections[d.gene1]) {
            return unmatched;
        }
    }
    if (d.gene2 in selections) {
        if (d.genotype2 != selections[d.gene2]) {
            return unmatched;
        }
    }
    if (d.gene3 in selections) {
        if (d.genotype3 != selections[d.gene3]) {
            return unmatched;
        }
    }
    return match;
}

// Callback when gene radio button is clicked
function handle_gene() {
    var selections = {};
    var that = this; // 'that' is used for closure
    // The 'this' context here is for element clicked.
    // Make sure the value for the gene is the newly selected checkbox
    if (this.checked == true) {
        selections[this.name] = this.value;
    }
    // Create a dictionary of genes with selected values
    d3.selectAll("#geneSelector input").each( function() {
        // Uncheck a previous gene value
        if (this.checked == true) {
            if ( (this.name == that.name) && (this.value != that.value) ) {
                this.checked = false;
            }
            else selections[this.name] = this.value;
        }
    })
    // For unchecking a checkbox, the selections will not include this element
    update_color( assign_genotype_color.curry( selections));
}

// Callback when user clicks on checkbox to group by gender
function handle_group_gender() {
    if (this.checked == true) {
        CV.formattedData.add_format( "genderCheck", create_gender_format);
    }
    else {
        CV.formattedData.remove_format( "genderCheck");
    }
    CV.nodeLayout = layout_generations( CV.formattedData.get_hierarchy() );
    update_view( CV.nodeLayout);
    var lines = find_endpoints( CV.nodeLayout, CV.genFoci);
    draw_arrows( CV.svg, lines, AR.line_generator);
}

// Callback when user clicks on checkbox to group by litter
function handle_group_litter() {
    if (this.checked == true) {
        CV.formattedData.add_format( "litterCheck", create_litter_format);
    }
    else {
        CV.formattedData.remove_format( "litterCheck");
    }
    CV.nodeLayout = layout_generations( CV.formattedData.get_hierarchy() );
    update_view( CV.nodeLayout);
    var lines = find_endpoints( CV.nodeLayout, CV.genFoci);
    draw_arrows( CV.svg, lines, AR.line_generator);
}

// Callback when user clicks on checkbox to group by litter
function handle_group_gene() {
    if (this.checked == true) {
        CV.formattedData.add_format( "geneCheck", create_gene_format);
    }
    else {
        CV.formattedData.remove_format( "geneCheck");
    }
    CV.nodeLayout = layout_generations( CV.formattedData.get_hierarchy() );
    update_view( CV.nodeLayout);
    var lines = find_endpoints( CV.nodeLayout, CV.genFoci);
    draw_arrows( CV.svg, lines, AR.line_generator);
}

function create_initial_view( initNodes) {
    CV.svg = d3.select("#graph").append("svg")
            .attr("width", CV.width)
            .attr("height", CV.height);

    // Add event handlers to various view options
    d3.select("#selectColorGroup").on("change", handle_color);
    d3.select("#selectSizeBy").on("change", handle_size);
    d3.select("#genderCheck").on("click", handle_group_gender);
    d3.select("#litterCheck").on("click", handle_group_litter);
    d3.select("#geneCheck").on("click", handle_group_gene);
    d3.selectAll("#geneSelector input").on("click", handle_gene);

    // Use default color selection indicated by DOM dropdown element
    var colorOption = d3.select("#selectColorGroup").node();
    var colorBy = colorOption.options[colorOption.selectedIndex].value;
    var color_fxn;
    if (colorBy == "gender") { color_fxn = assign_gender_color; }
    else if (colorBy == "genotype") { color_fxn = assign_genotype_color.curry( {});}

    for (var i=0; i < initNodes.length; i++) {
        var genGrp = CV.svg.append("g").datum(i)
                .attr("id","g" + i)
                .attr("transform", "translate(" + CV.genFoci[i].dx + ", " + CV.genFoci[i].dy + ")" );
        genGrp.selectAll(".gen" + i).data(initNodes[i])
                .enter()
                .append("circle")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r", function(d) { return CV.fit_scale(d.r); })
                .classed("node", function(d) { return d.mouseId ? true : false; })
                .classed("gen" + i, "true")
                .style("stroke", "rgb(150,150,150)")
                .style("stroke-width", "1.0px")
                .style("fill", function(d, i) {
                    if (d.depth == 0) { return "rgba(255,255,255,0)"; }
                    else {
                        return color_fxn(d);
                    }
                });
        genGrp.selectAll(".node")
                .on("mouseover", function() {
                    var thisNode = d3.select(this);
                    if (thisNode.datum().mouseId) { //only highlight nodes, not hierarchy circles
                        //undo any previous selection
                        if (CV.nodeHovered) {
                            CV.nodeHovered
                                    .classed("hovered", false)
                                    .style("stroke", "rgb(150, 150, 150)")
                                    .style("stroke-width", "1.0px");
                        }
                        if (CV.pathsDisplayed) {
                            CV.pathsDisplayed
                                    .classed("pathHovered", false)
                                    .style("stroke", "rgba(255,255,255,0");
                        }
                        thisNode
                                .classed("hovered", true)
                                .style( "stroke", "rgb(250,250,0)")
                                .style("stroke-width", "3px");
                        CV.nodeHovered = thisNode;
                        CV.pathsDisplayed = CV.svg.selectAll("path").filter( function(d) {
                            if ((d[0].id == thisNode.datum().mouseId) || (d[2].id == thisNode.datum().mouseId) ) {
                                return true;
                            }
                            else return false;
                        });
                        CV.pathsDisplayed
                                .classed("pathHovered", true)
                                .style("stroke", "rgba(130,230,190,0.5");
                    }
                })
                .on("dblclick", function() {
                    var thisNode = d3.select(this);
                    if (thisNode.datum().mouseId) { //ignore hierarchy circles
                        window.location.href = CV.href_individual( thisNode.datum().mouseId);
                    }
                });
    }
    CV.svg.selectAll("g")
            .append("text")
            .attr("text-anchor", "middle")
            .text( function(d) { return "Gen" + d;})
            .attr("x", function(d) { return CV.genFoci[d].x; })
            .attr("y", CV.height - 25);

}

// Format mice data to have hierarchy of generation then gender type
function create_gender_format( rawNodes) {
    // Create additional grouping by gender
    var genderGroup = [];
    var grouping =  {'name': 'female',
                     'colorGroup': 'rgba(250,0,0,1)',
                     'children': rawNodes.filter( function( elem) { return elem.gender == "F"; })
    };
    if (grouping.children.length > 0) { genderGroup.push( grouping); }

    var grouping =  {'name': 'male',
                     'colorGroup': 'rgba(0,0,250,1)',
        'children': rawNodes.filter( function( elem) { return elem.gender == "M"; })
    };
    if (grouping.children.length > 0) { genderGroup.push( grouping); }

    var grouping =  {'name': 'unknown',
        'children': rawNodes.filter( function( elem) { return (elem.gender != "M") && (elem.gender != "F"); })
    };
    if (grouping.children.length > 0) { genderGroup.push( grouping); }

    return genderGroup;
}

// Format data to have hierarchy of litters unique by motherID, fatherID, and litter number
function create_litter_format( rawNodes) {
    var litterGroup = [];
    // Hold members of each distinct litter in a separate array
    var distinctLitters = {};
    for (var i=0; i < rawNodes.length; i++) {
        var litterId = rawNodes[i].motherId + rawNodes[i].fatherId + rawNodes[i].litter;
        if (distinctLitters[litterId]) {
            distinctLitters[litterId].push(rawNodes[i]);
        }
        else {
            distinctLitters[litterId] = [rawNodes[i]];
        }
    }
    // Create hierarchy format
    var attrib;
    for (attrib in distinctLitters) {
        // Make sure the attribute is not inherited
        if (distinctLitters.hasOwnProperty(attrib) ) {
            litterGroup.push( {'name': attrib, 'children': distinctLitters[attrib]} );
        }
    }
    return litterGroup;
}

function create_gene_format( rawNodes) {
    var selections = {};
    // Create a dictionary of genes with selected values
    d3.selectAll("#geneSelector input").each( function() {
        if (this.checked == true) {
            selections[this.name] = this.value;
        }
    })
    if (is_empty(selections)) {
        return rawNodes;
    }
    var inGrp = [];
    var outGrp = [];
    function check_grp( node, selections) {
        // Try to eliminate by looking for mismatch with selection values since all or no match
        if (node.gene1 in selections) {
            if (node.genotype1 != selections[node.gene1]) {
                return false;
            }
        }
        if (node.gene2 in selections) {
            if (node.genotype2 != selections[node.gene2]) {
                return false;
            }
        }
        if (node.gene3 in selections) {
            if (node.genotype3 != selections[node.gene3]) {
                return false;
            }
        }
        return true;
    }
    for (var i=0; i < rawNodes.length; i++) {
        if ( check_grp(rawNodes[i], selections) ) {
            inGrp.push(rawNodes[i]);
        }
        else {
            outGrp.push(rawNodes[i]);
        }
    }
    var geneGrp = [];
    if (inGrp.length > 0) { geneGrp.push( {'name': 'genotypeMatch', 'children': inGrp}); }
    if (outGrp.length > 0) { geneGrp.push( {'name': 'genotypeNoMatch', 'children': outGrp}); }
    return geneGrp;
}

// Take an array of objects, with each object representing a generation, and having a children field.
// Return an array of an array of objects that have data for position and size.
function layout_generations( genArray) {
    // Use the circle packing layout to calculate node positions for each generation.
    var nodeLayouts = [];
    for (var i=0; i < genArray.length; i++) {
        // The size for packing is currently based on last boundary circle size
        nodeLayouts.push( d3.layout.pack().size([CV.genFoci[i].radius * 2, CV.height]).padding(10)
                .value( CV.size_by)
                .nodes( genArray[i]));
    }
    return nodeLayouts;
}

// Update position of circles
function update_view( nodeLayouts) {
    set_scale_foci( nodeLayouts);
    // Update the translation for each generation based on any change in genFoci and radii
    for (var i=0; i < nodeLayouts.length; i++) {
        d3.select("#g" + i).attr("transform","translate(" + CV.genFoci[i].dx + ", " + CV.genFoci[i].dy + ")" );
    }
    // Go through each generation in nodeLayout
    for (var i=0; i < nodeLayouts.length; i++) {
        var genSelect = d3.select("#g" + i).selectAll(".gen" + i).data(nodeLayouts[i], function(d) {
            return d.mouseId ? d.mouseId : d.name; });
        // Add any inner hierarchy circles
        genSelect.enter()
                .insert("circle")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r", function(d) { return CV.fit_scale(d.r); })
                .classed("gen" + i, "true")
                .style("stroke", "rgba(150,150,150,0.1)")
                .style("stroke-width", "1.0px")
                .style("fill", "rgba(255,255,255,0)" );
        // Remove any hierarchy circles not needed
        genSelect.exit()
                .transition().duration(1200).style("stroke", "rgba(150, 150, 150, .2").remove();
        // Update nodes
        genSelect.transition().delay(700 * Math.pow(i, 1.5)).duration(1400 * Math.pow(i, 1.5))
                .style("stroke", function(d) {
                    return typeof d.colorGroup !== 'undefined' ? d.colorGroup : "rgba(150,150,150,0.9)" })
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r", function(d) { return CV.fit_scale(d.r); });
    }
}

// The parameter color_fxn is a function with one parameter - the node data
function update_color( color_fxn) {
    d3.selectAll(".node").transition()
            .style("fill", function(d) { return color_fxn(d); });
}
