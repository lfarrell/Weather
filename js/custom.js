d3.csv('../us_temp_all.csv', function(data) {
    data.forEach(function(d) {
        d.value = +d.value;
        d.anomaly = +d.anomaly;
    });

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var margins = { top: 20, right: 25, left: 50, bottom: 75 },
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

    var filtered_groups = d3.nest()
        .key(function(d) { return d.year; })
        .entries(filtered);

    var line_count = lineCount(filtered_groups);

    filtered_groups = avg_anomalies(filtered_groups);

    var xScale = d3.time.scale()
        .domain(d3.extent(filtered, function(d) { return parse_date(d.month); }))
        .range([0, width]);

    var yScale = d3.scale.linear()
         .domain(d3.extent(filtered, function(d) { return d.anomaly; }).reverse())
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
         .y(function(d) { return yScale(d.anomaly); });

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
         .text("Temperature Anomaly");

    for(var i=0; i<line_count; i++) {
        svg.append("g")
            .append("path")
            .attr("d", anomaly(filtered_groups[i].values))
            .attr("class", "temp_lines")
            .attr("id", "year_" + i)
            .attr("transform", "translate(" + margins.left + "," + margins.top + ")")
            .style('stroke', function(d) {
                if(i >= (line_count - 11)) {
                    return 'red';
                }
            })
            .on("mouseover", function(d) {
                var self = d3.select(this);
                var line_value = line_id(self.attr('id'));

                self.style('stroke', 'slategray')
                    .style('stroke-width', 3);

                div.transition()
                    .duration(200)
                    .style("opacity", .9);

                var nov = (filtered_groups[line_value].values[10].anomaly !== undefined) ?
                    filtered_groups[line_value].values[10].anomaly : "N/A";
                var dec = (filtered_groups[line_value].values[11].anomaly) !== undefined ?
                    filtered_groups[line_value].values[11].anomaly : "N/A";

                div.html(
                        "<h5 class='center'>" + filtered_groups[line_value].values[0].year +"</h5>" +
                        "<p class='center'>Temp Anomalies in Degrees<br/> Fahrenheit</p>" +
                        "<p class='center'>Avg. Temp Anomaly: " + filtered_groups[line_value].anomaly_avg + "</p>" +
                        "<ul class='columns'>" +
                            "<li>Jan: " +  filtered_groups[line_value].values[0].anomaly +"</li>" +
                            "<li>Feb: " +  filtered_groups[line_value].values[1].anomaly +"</li>" +
                            "<li>Mar: " +  filtered_groups[line_value].values[2].anomaly +"</li>" +
                            "<li>Apr: " +  filtered_groups[line_value].values[3].anomaly +"</li>" +
                            "<li>May: " +  filtered_groups[line_value].values[4].anomaly +"</li>" +
                            "<li>Jun: " +  filtered_groups[line_value].values[5].anomaly +"</li>" +
                            "<li>Jul: " +  filtered_groups[line_value].values[6].anomaly +"</li>" +
                            "<li>Aug: " +  filtered_groups[line_value].values[7].anomaly +"</li>" +
                            "<li>Sep: " +  filtered_groups[line_value].values[8].anomaly +"</li>" +
                            "<li>Oct: " +  filtered_groups[line_value].values[9].anomaly +"</li>" +
                            "<li>Nov: " + nov +"</li>" +
                            "<li>Dec: " +  dec +"</li>" +
                        "</ul>")
                    .style("top", (d3.event.pageY-58)+"px")
                    .style("left", (d3.event.pageX-28)+"px");


            })
            .on("mouseout", function(d) {
                var self = d3.select(this);
                var line_value = line_id(self.attr('id'));
                console.log(self.attr('id'))

                self.style('stroke', function(d) {
                    if(line_value >= (line_count - 11)) {
                        return 'red';
                    } else {
                        return 'lightgray';
                    }
                }).style('stroke-width', 1.5);

                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }

    d3.select('#state').on('change', function() {
        var selected_state_name = this.options[this.selectedIndex].innerHTML;
        var state = d3.select(this);
        var state_val = state.property("value");
        var new_filtered = sorted.filter(function(d) {
            return d.state == state_val;
        });

        filtered_groups = d3.nest()
            .key(function(d) { return d.year; })
            .entries(new_filtered);

        filtered_groups = avg_anomalies(filtered_groups);

        xScale.domain(d3.extent(new_filtered, function(d) { return parse_date(d.month); }));
        yScale.domain(d3.extent(new_filtered, function(d) { return d.anomaly; }).reverse());

        d3.select("g.x").transition().duration(1000).ease("sin-in-out").call(xAxis);
        d3.select("g.y").transition().duration(1000).ease("sin-in-out").call(yAxis);

        for(var i=0; i<line_count; i++) {
            d3.select("#year_" + i).transition()
                .duration(1400)
                .ease("sin-in-out")
                .attr("d", anomaly(filtered_groups[i].values));
        }

        d3.select("#selected_state").text(selected_state_name);
        state.property("value", "");
    });

 /*   d3.select("#recent").on('click', function(d) {
        for(var i=0; i<line_count; i++) {
            d3.select("#year_" + i).transition().duration(800)
                .style('stroke', function(d) {
                if(i >= (line_count - 11)) {
                    return 'red';
                } else {
                    return 'lightgray';
                }
            });
        }
    });

    d3.select("#hot").on('click', function(d) {
        var top = _.pluck()
        for(var i=0; i<line_count; i++) {
            d3.select("#year_" + i).transition().duration(800)
                .style('stroke', function(d) {
                    if(i >= (line_count - 11)) {
                        return 'orange';
                    } else {
                        return 'lightgray';
                    }
                });
        }
    }); */

    d3.selectAll('.row').classed('hide', false);
    d3.select('#note').classed('hide', true);
});

function lineCount(values) {
    return Math.round(values.length);
}

function line_id(id) {
    return id.split('_')[1];
}

function avg_anomalies(filtered_groups) {
    filtered_groups.forEach(function(d) {
        var anomaly_list =_.pluck(d.values, 'anomaly');
        var anomaly_total =  _.reduce(anomaly_list, function(memo, num){ return memo + num; }, 0);

        d.anomaly_avg = (anomaly_total / (d.values.length)).toFixed(1);
    });

    return filtered_groups;
}