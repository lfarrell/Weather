d3.csv('us_temp_all.csv', function(data) {
    data.forEach(function(d) {
        d.value = +d.value;
        d.anomaly = +d.anomaly;
    });

    var margins = { top: 20, right: 20, left: 50, bottom: 75 },
        parse_date = d3.time.format("%m").parse,
        sorted = _.sortByOrder(data, ['state','year', 'month'], ['asc', 'asc', 'asc']),
        selected_state = 'US';

    var width = window.innerWidth - 100 - margins.right - margins.left;
    var height = 700 - margins.top - margins.bottom;

    var svg = d3.select("#avg_temps");

    svg.attr("width", width + margins.left + margins.right)
        .attr("height", height + margins.top + margins.bottom);

    var filtered =  sorted.filter(function(d) {
        return d.state == 'US';
    });

    var line_count = lineCount(filtered);

    var xScale = d3.time.scale()
        .domain(d3.extent(filtered, function(d) { return parse_date(d.month); }))
        .range([0, width]);

            /*var xScale = d3.scale.ordinal()
             .domain(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
             .range([0, width]);*/

    var yScale = d3.scale.linear()
         .domain([d3.max(filtered, function(d) { return d.value; }), 0])
         .range([0, height]);

    var xAxis = d3.svg.axis()
         .scale(xScale)
         .orient("bottom")
         .ticks(d3.time.months, 1)
         .tickFormat(d3.time.format('%b'));

    var yAxis = d3.svg.axis()
         .scale(yScale)
         .orient("left");

    var anomaly = d3.svg.line()
         .x(function(d) { return xScale(parse_date(d.month)); })
         .y(function(d) { return yScale(d.value); });

    svg.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate("+ margins.left + "," + (height + margins.top) + ")")
         .call(xAxis);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margins.bottom)
        .style("text-anchor", "middle")
        .text("Month");

    svg.append("g")
         .attr("class", "y axis")
         .attr("transform", "translate(" + margins.left + "," + margins.top + ")")
         .call(yAxis);

    svg.append("text")
         .attr("transform", "rotate(-90)")
         .attr("x", -height/2)
         .attr("y", 6)
         .attr("dy", ".71em")
         .style("text-anchor", "end")
         .text("Temperature");

    for(var i=0; i<line_count.length; i++) {
        svg.append("g")
            .append("path")
            .attr("d", anomaly(filtered))
            .attr("class", "temp_lines")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    d3.select('#state').on('change', function() {
        var selected_state_name = this.options[this.selectedIndex].innerHTML;
        var state = d3.select(this);
        var state_val = state.property("value");
        var new_filtered = sorted.filter(function(d) {
            return d.state == state_val;
        });
        var updated_line_count = lineCount(new_filtered);

        xScale.domain(d3.extent(new_filtered, function(d) { return parse_date(d.month); }));
        yScale.domain([d3.max(new_filtered, function(d) { return d.value; }), 0]);

        d3.select("g.x").transition().duration(1000).ease("sin-in-out").call(xAxis);
        d3.select("g.y").transition().duration(1000).ease("sin-in-out").call(yAxis);


        d3.select("#selected_state").text(selected_state_name);
        state.property("value", "");
    });

    d3.selectAll('.row').classed('hide', false);
    d3.select('#note').classed('hide', true);
});

function lineCount(values) {
    return Math.round(values.length / 12);
}