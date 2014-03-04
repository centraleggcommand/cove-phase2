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

// Function to create the minimal object structure needed for circle packing
function mice_data_format( data) {
    var dataFormatted = [];
    for (var i=0; i < data.length; i++) {
        dataFormatted.push( {'name': 'Gen' + i, 'children': data[i]});
    }
    return dataFormatted;
}

function initialize( miceData, currDomain) {
    CV.allMice = JSON.parse( miceData);
    //The allMice object is an array of arrays for generation data, and element a json object.
    //Convert to format for hierarchical packing (1 level for all objects of a generation).
    //Use separate layout for each generation.
    CV.miceGenData = mice_data_format( CV.allMice);

    // Mice data format needs to support additional hierarchy such as by gender and litter.
    // Create an object that stores fxns that need to be applied to the original raw data
    // to achieve the filtering and grouping specified by user.
    CV.formattedData = 
        { // format_fxns are functions that take one parameter - array of raw data objects
            'filteredHierarchy': mice_data_format( CV.allMice),
            // format fxns add an additional level of grouping to leaf nodes
            'format_fxns': [],
            // filter functions take one parameter - a node to test
            'filter_fxns': [],
            // perform the grouping functions and return data in format for circle packing
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

                // Recursively apply format
                return applyFormat( '',this.filteredHierarchy, 0);
            },
            // The id parameter needs to correlate with DOM checkbox that uses the 'fmt' function
            'add_format': function( id, fmt) {
                // Attach the id as an attribute belonging to the fmt function object
                fmt.id = id;
                this.format_fxns.push( fmt);
            },
            'remove_format': function( id) {
                this.format_fxns = this.format_fxns.filter( function( elem) { return elem.id != id; });
            },
            'add_filter': function( id, filterFxn) {
                // Attach the id as an attribute belonging to the fmt function object
                filterFxn.id = id;
                this.filter_fxns.push( filterFxn);
                //this.filteredHierarchy = mice_data_format( CV.allMice);
                // Apply additional filter
                // Filters designate what *can* be displayed.
                // Filter members of each generation
                for (var g=0; g < this.filteredHierarchy.length; g++) {
                    this.filteredHierarchy[g].children = this.filteredHierarchy[g].children.filter( filterFxn); 
                }
                /*
                var that = this;
                for (var g=0; g < this.filteredHierarchy.length; g++) {
                    //this.filteredHierarchy[g].children = this.filter_fxns[fi]( this.filteredHierarchy[g].children);
                     this.filteredHierarchy[g].children = this.filteredHierarchy[g].children.filter( function( elem) {
                        var matchedFilter = false;
                        for (var fi=0; fi < that.filter_fxns.length; fi++ ) {
                            matchedFilter = that.filter_fxns[fi]( elem);
                            if (matchedFilter) {
                                break;
                            }
                        }
                        return matchedFilter;
                    });
                }
                */
            },
            'remove_filter': function( id) {
                this.filter_fxns = this.filter_fxns.filter( function( elem) { return elem.id != id; });
                this.filteredHierarchy = mice_data_format( CV.allMice);
                // Re-Apply remaining filters
                for (var fi=0; fi < this.filter_fxns.length; fi++ ) {
                    // Filter members of each generation
                    for (var g=0; g < this.filteredHierarchy.length; g++) {
                        this.filteredHierarchy[g].children = this.filteredHierarchy[g].children.filter(this.filter_fxns[fi]); 
                    }
                }
            }
        };

    CV.active_genotype_filters = [];
    CV.disabled_genotype_filters = [];
    CV.size_by = function() { return 1;}

    CV.width = 950,
    CV.height = 450;
    CV.infoHeight = 500;
    CV.infoWidth = 500;

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
    // For unchecking a checkbox, the selections will not include this element
        //update_color( assign_genotype_color.curry( selections));
    }
    else if (selected == "gender") {
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
    var that = this; // 'that' is used for closure
    // The 'this' context here is for element clicked.
    // Uncheck a previous gene value
    d3.selectAll("#geneSelector input").each( function() {
        if (this.checked == true) {
            if ( (this.name == that.name) && (this.value != that.value) ) {
                this.checked = false;
            }
        }
    });
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

// Callback when gender filter is clicked
function handle_filter_gender() {
    // Remove any previous filter for gender because user is changing filter value
    CV.formattedData.remove_filter( "filterGender");
    if ( (this.checked == true) && (this.value != 'All') ) {
        CV.formattedData.add_filter( "filterGender", perform_filter.curry(this.name, this.value) );
    }
    // The 'this' context here is for element clicked.
    /* Following old code for checkbox instead of radio buttons
    var that = this; // 'that' is used to reference outer scope within closure
    d3.selectAll("#genderFilter input").each( function() {
        if (this.checked == true) {
            // Uncheck a previous value
            if ( (this.name == that.name) && (this.value != that.value) ) {
                this.checked = false;
                this.disabled = false;
            }
            else { // Disallow unchecking
                this.disabled = true;
            }
        }
    });
    */
    
    // Re-draw
    CV.nodeLayout = layout_generations( CV.formattedData.get_hierarchy() );
    update_view( CV.nodeLayout);
    //update_color();
    var lines = find_endpoints( CV.nodeLayout, CV.genFoci);
    draw_arrows( CV.svg, lines, AR.line_generator);
}

function handle_add_geno_filter() {
    // Show the gene radio button selectors
    d3.selectAll(".genotypeDesc").style("display","inline")
}

// Function to compare user selected genotype filter with data.
// Parameter "selections" is an object with a field for each specified gene in filter.
function check_genotype( node, selections) {
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

// Called when user presses "Done" button for creating genotype filter
function handle_done_geno_filter() {
    d3.selectAll(".genotypeDesc").style("display","none");
    // Create a dictionary of genes with selected values
    var selections = {};
    d3.selectAll("#geneSelector input").each( function() {
        if (this.checked == true) {
            selections[this.name] = this.value;
        }
    })
    // Create unique name for filter so it can later
    // be referenced for removal.
    var doneSelection = "";
    for (var prop in selections) {
        if (selections.hasOwnProperty(prop)) {
            doneSelection = doneSelection + prop + " " + selections[prop] + " ";
        }
    }
    // Create new filter entry in the menu
    var doneSel = d3.select("#userFilters").append("tr");
    doneSel.append("td").append("input")
        .attr("type","checkbox")
        .attr("name", doneSelection)
        .classed("userAddedFilter",true)
        .property("checked","true")
        .on("click", handle_user_filter);
    doneSel.append("td")
        .text(doneSelection);
    d3.select("#allGeno")
        .attr("disabled",null)
        .property("checked",false);
    // Run filter
    // Given an object with a field for each filter name selected and 
    // set to corresponding value ie. LEF1 = +/+
    // The raw data being compared with has format where fields
    // exist such as gene1, gene2 ... with values such as LEF1 ...
    // and also fields for genotype1, genotype2 ... with values such as +/-
    add_genotype_filter( doneSelection, check_grp.curry(selections));
    CV.formattedData.remove_filter( "genotypeFilter");
    CV.formattedData.add_filter( "genotypeFilter", perform_filter_set );

    // Re-draw
    CV.nodeLayout = layout_generations( CV.formattedData.get_hierarchy() );
    update_view( CV.nodeLayout);
    //update_color();
    var lines = find_endpoints( CV.nodeLayout, CV.genFoci);
    draw_arrows( CV.svg, lines, AR.line_generator);
}

function handle_all_geno_filter() {
    // Disable ability to uncheck 'All'. Need to select a different value
    this.disabled = true;
    d3.selectAll(".userAddedFilter")
        .property("checked",false); 
}

function handle_user_filter() {
    // When filter is checked, the 'All' option should be enabled.
    // Note: this is not for handling event when filter is created
    // and automatically checked. It is for when user unchecks
    // then re-checks a filter.
    if (this.checked == true) {
        d3.select("#allGeno")
            .attr("disabled",null)
            .property("checked",false);
        restore_genotype_filter( this.name);
        CV.formattedData.remove_filter( "genotypeFilter");
        CV.formattedData.add_filter( "genotypeFilter", perform_filter_set );
    }
    else {
        remove_genotype_filter( this.name);
        // When filter is unchecked, and no other filters are checked
        // then the 'All' option should be auto checked.
        CV.formattedData.remove_filter( "genotypeFilter");
        if (CV.active_genotype_filters.length == 0) {
            d3.select("#allGeno")
                .attr("disabled", true)
                .property("checked", true);
        }
        else {
            CV.formattedData.add_filter( "genotypeFilter", perform_filter_set );
        }
    } 
    // Re-draw
    CV.nodeLayout = layout_generations( CV.formattedData.get_hierarchy() );
    update_view( CV.nodeLayout);
    //update_color();
    var lines = find_endpoints( CV.nodeLayout, CV.genFoci);
    draw_arrows( CV.svg, lines, AR.line_generator);
}

function handle_hover_info( thisNode) {
    var xpos = 20;
    var ypos = 30;
    if ( typeof CV.infoText == 'undefined') {
        d3.select("#mouseInfoDiv svg")
            .append("rect")
            .attr("height", CV.infoHeight - 20)
            .attr("width", CV.infoWidth - 20)
            .attr("x", xpos)
            .attr("y", ypos)
            .attr("rx", 20)
            .attr("ry", 20)
            .style("fill","rgba(250,241,133,0.3");
        CV.infoText = d3.select("#mouseInfoDiv svg")
            .append("text")
            .attr("x", xpos)
            .attr("y", ypos);
    }
    //Update details shown
    ypos += 30;
    CV.infoText.text("Details of mouse " + thisNode.datum().mouseId);
    CV.infoText.append("tspan").text( "Generation: " + thisNode.datum().generation)
            .attr("x", xpos).attr("y", ypos);
    ypos += 20;
    CV.infoText.append("tspan").text( "Father ID: " + thisNode.datum().fatherId)
            .attr("x", xpos).attr("y", ypos);
    ypos += 20;
    CV.infoText.append("tspan").text( "Mother ID: " + thisNode.datum().motherId)
            .attr("x", xpos).attr("y", ypos);
    //second column
    ypos = 60;
    xpos += 180;
    CV.infoText.append("tspan").text( "Gender: " + thisNode.datum().gender)
            .attr("x", xpos).attr("y", ypos);
    ypos += 20;
    CV.infoText.append("tspan").text( "Genotype: " )
            .attr("x", xpos).attr("y", ypos);
    xpos += 20;
    ypos += 20;
    CV.infoText.append("tspan").text( thisNode.datum().gene1 + " : " + thisNode.datum().genotype1)
            .attr("x", xpos).attr("y", ypos);
    ypos += 20;
    CV.infoText.append("tspan").text( thisNode.datum().gene2 + " : " + thisNode.datum().genotype2)
            .attr("x", xpos).attr("y", ypos);
    ypos += 20;
    CV.infoText.append("tspan").text( thisNode.datum().gene3 + " : " + thisNode.datum().genotype3)
            .attr("x", xpos).attr("y", ypos);
}


function create_initial_view( initNodes) {
    CV.svg = d3.select("#graph").append("svg")
            .attr("width", CV.width)
            .attr("height", CV.height);

    // Mouse info is left blank until hover event occurs
    d3.select("#mouseInfoDiv").append("svg")
            .attr("width", CV.infoWidth)
            .attr("height", CV.infoHeight);

    // Add event handlers to various view options
    d3.select("#selectColorGroup").on("change", handle_color);
    d3.select("#selectSizeBy").on("change", handle_size);
    d3.select("#genderCheck").on("click", handle_group_gender);
    d3.select("#litterCheck").on("click", handle_group_litter);
    d3.select("#geneCheck").on("click", handle_group_gene);
    d3.select("#addGenotypeFilter").on("click", handle_add_geno_filter);
    d3.select("#doneGenotypeFilter").on("click", handle_done_geno_filter);
    d3.select("#allGeno").on("click", handle_all_geno_filter);
    d3.selectAll("#geneSelector input").on("click", handle_gene);
    d3.selectAll("#genderFilter input").on("click", handle_filter_gender);

    // Use default color selection indicated by DOM dropdown element
    var colorOption = d3.select("#selectColorGroup").node();
    var colorBy = colorOption.options[colorOption.selectedIndex].value;
    if (colorBy == "gender") { CV.color_fxn = assign_gender_color; }
    else if (colorBy == "genotype") { CV.color_fxn = assign_genotype_color.curry( {});}

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
                        return CV.color_fxn(d);
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
                        //show info on selected node
                        handle_hover_info( thisNode);
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

function check_grp( selections, node) {
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
    for (var i=0; i < rawNodes.length; i++) {
        if ( check_grp( selections, rawNodes[i]) ) {
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

function add_genotype_filter( id, add_fxn) {

    add_fxn.id = id;
    CV.active_genotype_filters.push(add_fxn );
}

function restore_genotype_filter( id) {
    var add_fxn;
    for( var ff=0; ff < CV.disabled_filter_fxns.length; ff++) {
        if (CV.disabled_filter_fxns[ff].id == id) {
            add_fxn = CV.disabled_filter_fxns[ff];
            CV.disabled_filter_fxns = CV.disabled_filter_fxns.filter( function( elem) { return elem.id != id; });
            CV.active_genotype_filters.push(add_fxn );
            break;
        }
    }
}

function remove_genotype_filter( id) {
    // move filter fxn to disabled list
    for (var fi=0; fi < CV.active_genotype_filters.length; fi++) {
        if (CV.active_genotype_filters[fi].id == id) {
            CV.disabled_genotype_filters.push( CV.active_genotype_filters[fi]);
            CV.active_genotype_filters = CV.active_genotype_filters.filter( function(elem) { return elem.id != id; });
            break;
        }
    }
}

function perform_filter( attrName, attrVal, rawNode) {
    //return rawNodes.filter( function( elem) { return elem[attrName] == attrVal; });
    return rawNode[attrName] == attrVal;
}

function perform_filter_set( rawNode) {
    // If no selections supplied, look for id in disabled_filter_fxns
    /*
    if ( typeof selections == 'undefined') {
        for( var ff=0; ff < CV.disabled_filter_fxns.length; ff++) {
            if (CV.disabled_filter_fxns[ff].id == id) {
                add_fxn = CV.disabled_filter_fxns[ff];
                CV.disabled_filter_fxns = CV.disabled_filter_fxns.filter( function( elem) { return elem.id != id; });
                break;
            }
        }
        if ( typeof add_fxn == 'undefined') {
            return;
        }
    }
    else {
        // Save genotype filter set member. 
        // The check of all genotype filters is combined here for use by CV.formattedData.add_filter
        add_fxn = check_grp.curry(selections);
        add_fxn.id = id;
    }
    */
    var matchedFilter = false;
    for (var fi=0; fi < CV.active_genotype_filters.length; fi++ ) {
        matchedFilter = CV.active_genotype_filters[fi]( rawNode);
        if (matchedFilter) {
            break;
        }
    }
    return matchedFilter;
}

// T of objects, with each object representing a generation, and having a children field.
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
                .classed("node", function(d) { return d.mouseId ? true : false; })
                .classed("gen" + i, "true")
                .style("stroke", "rgba(150,150,150,0.1)")
                .style("stroke-width", "1.0px")
                .style("fill", function(d) { return d.mouseId ? CV.color_fxn(d) : "rgba(255,255,255,0)";} );
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
    if (typeof color_fxn !== 'undefined') {
        CV.color_fxn = color_fxn;
    }
    d3.selectAll(".node").transition()
            .style("fill", function(d) { return CV.color_fxn(d); });
}

