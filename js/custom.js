d3.csv('../us_temp_all.csv', function(data) {
    data.forEach(function(d) {
        d.value = +d.value;
        d.anomaly = +d.anomaly;
        d.decade = d.year.substr(0, 3) + '0';
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

    var filtered =  sorted.filter(function(d) {
        return d.state == 'US';
    });

    var decade_array = d3.nest()
        .key(function(d) { return d.year; })
        .entries(filtered);

    var line_count = lineCount(decade_array);

    decade_array = avg_anomalies(decade_array);

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

    var svg = axises("#avg_temps", xScale, yScale);

    for(var i=0; i<line_count; i++) {
        svg.append("g")
            .append("path")
            .attr("d", anomaly(decade_array[i].values))
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

                var nov = (decade_array[line_value].values[10].anomaly !== undefined) ?
                    decade_array[line_value].values[10].anomaly : "N/A";
                var dec = (decade_array[line_value].values[11].anomaly) !== undefined ?
                    decade_array[line_value].values[11].anomaly : "N/A";

                div.html(
                        "<h5 class='center'>" + decade_array[line_value].values[0].year +"</h5>" +
                        "<p class='center'>Temp Anomalies in Degrees<br/> Fahrenheit</p>" +
                        "<p class='center'>Avg. Temp Anomaly: " + decade_array[line_value].anomaly_avg + "</p>" +
                        "<ul class='columns'>" +
                            "<li>Jan: " +  decade_array[line_value].values[0].anomaly +"</li>" +
                            "<li>Feb: " +  decade_array[line_value].values[1].anomaly +"</li>" +
                            "<li>Mar: " +  decade_array[line_value].values[2].anomaly +"</li>" +
                            "<li>Apr: " +  decade_array[line_value].values[3].anomaly +"</li>" +
                            "<li>May: " +  decade_array[line_value].values[4].anomaly +"</li>" +
                            "<li>Jun: " +  decade_array[line_value].values[5].anomaly +"</li>" +
                            "<li>Jul: " +  decade_array[line_value].values[6].anomaly +"</li>" +
                            "<li>Aug: " +  decade_array[line_value].values[7].anomaly +"</li>" +
                            "<li>Sep: " +  decade_array[line_value].values[8].anomaly +"</li>" +
                            "<li>Oct: " +  decade_array[line_value].values[9].anomaly +"</li>" +
                            "<li>Nov: " + nov +"</li>" +
                            "<li>Dec: " +  dec +"</li>" +
                        "</ul>")
                    .style("top", (d3.event.pageY-108)+"px")
                    .style("left", (d3.event.pageX-28)+"px");


            })
            .on("mouseout", function(d) {
                var self = d3.select(this);
                var line_value = line_id(self.attr('id'));

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

    // Group by decade
    var decade_numbers = decadeNumbers();
    // Nest values like d3.nest()
    var decade_array = decadeArray();

    // Figure out Y scale
    var merged = y_scale_anomalies();
    yScale.domain(d3.extent(merged, function(d) { return +d }).reverse());

    var svg_decades = axises("#avg_temps_decade");

    for(var t=0; t<decade_array.length; t++) {
        svg_decades.append("g")
            .append("path")
            .attr("d", anomaly(decade_array[t].values))
            .attr("class", "decade_lines")
            .attr("id", "decade_" + t)
            .attr("transform", "translate(" + margins.left + "," + margins.top + ")")
            .style('stroke', function(d) {
                if(decade_array[t].anomaly_avg >= 0.5) {
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

                div.html(
                        "<h5 class='center'>" + decade_array[line_value].key +"'s</h5>" +
                            "<p class='center'>Temp Anomalies in Degrees<br/> Fahrenheit</p>" +
                            "<p class='center'>Avg. Temp Anomaly: " + decade_array[line_value].anomaly_avg + "</p>" +
                            "<ul class='columns'>" +
                            "<li>Jan: " +  decade_array[line_value].values[0].anomaly +"</li>" +
                            "<li>Feb: " +  decade_array[line_value].values[1].anomaly +"</li>" +
                            "<li>Mar: " +  decade_array[line_value].values[2].anomaly +"</li>" +
                            "<li>Apr: " +  decade_array[line_value].values[3].anomaly +"</li>" +
                            "<li>May: " +  decade_array[line_value].values[4].anomaly +"</li>" +
                            "<li>Jun: " +  decade_array[line_value].values[5].anomaly +"</li>" +
                            "<li>Jul: " +  decade_array[line_value].values[6].anomaly +"</li>" +
                            "<li>Aug: " +  decade_array[line_value].values[7].anomaly +"</li>" +
                            "<li>Sep: " +  decade_array[line_value].values[8].anomaly +"</li>" +
                            "<li>Oct: " +  decade_array[line_value].values[9].anomaly +"</li>" +
                            "<li>Nov: " + decade_array[line_value].values[10].anomaly +"</li>" +
                            "<li>Dec: " +  decade_array[line_value].values[11].anomaly +"</li>" +
                            "</ul>")
                    .style("top", (d3.event.pageY-108)+"px")
                    .style("left", (d3.event.pageX-28)+"px");


            })
            .on("mouseout", function(d) {
                var self = d3.select(this);
                var line_value = line_id(self.attr('id'));

                self.style('stroke', function(d) {
                    if(decade_array[line_value].anomaly_avg >= 0.5) {
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

    // Update everything
    d3.select('#state').on('change', function() {
        var selected_state_name = this.options[this.selectedIndex].innerHTML;
        var state = d3.select(this);
        var state_val = state.property("value");
        
        // Year values
        var new_filtered = sorted.filter(function(d) {
            return d.state == state_val;
        });

        decade_array = d3.nest()
            .key(function(d) { return d.year; })
            .entries(new_filtered);

        decade_array = avg_anomalies(decade_array);
        yScale.domain(d3.extent(new_filtered, function(d) { return d.anomaly; }).reverse());

        d3.select("#avg_temps g.y").transition().duration(1000).ease("sin-in-out").call(yAxis);

        for(var i=0; i<line_count; i++) {
            d3.select("#year_" + i).transition()
                .duration(1400)
                .ease("sin-in-out")
                .attr("d", anomaly(decade_array[i].values));
        }

        // Group by decade
        decade_numbers = decadeNumbers();
        // Nest values like d3.nest()
        decade_array = decadeArray();

        // Figure out Y scale
        merged = y_scale_anomalies();
        yScale.domain(d3.extent(merged, function(d) { return +d }).reverse());
        d3.select("#avg_temps_decade g.y").transition().duration(1000).ease("sin-in-out").call(yAxis);

        for(var n=0; n<decade_array.length; n++) {
            d3.select("#decade_" + n).transition()
                .duration(1400)
                .ease("sin-in-out")
                .attr("d", anomaly(decade_array[n].values));
        }

        d3.selectAll(".selected_state").text(selected_state_name);
        state.property("value", "");
    });

    function axises(selector) {
        var svg = d3.select(selector);

        svg.attr("width", width + margins.left + margins.right)
            .attr("height", height + margins.top + margins.bottom);

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

        return svg;
    }

    function decade_listings() {
        var decade_numbers = {
            1890: { counts: 5, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            1900: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            1910: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            1920: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            1930: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            1940: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            1950: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            1960: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            1970: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            1980: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            1990: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            2000: { counts: 10, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} },
            2010: { counts: 5, month_totals: {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0} }
        };

        return decade_numbers;
    }

    function decadeNumbers() {
        var decades = d3.nest()
            .key(function(d) { return d.decade; })
            .entries(decade_array);

        var decade_numbers = decade_listings();

        decades.forEach(function(d) {
            d.values.forEach(function(e) {
                e.values.forEach(function(g) {
                    decade_numbers[e.decade].month_totals[g.month] += g.anomaly;
                });
            });
        });

        for (var prop in decade_numbers) {
            for(var months in decade_numbers[prop]) {
                for(var month_values in decade_numbers[prop][months]) {
                    decade_numbers[prop][months][month_values] =
                        (decade_numbers[prop][months][month_values] / decade_numbers[prop].counts).toFixed(1)
                }
            }
        }

        return decade_numbers;
    }

    function decadeArray() {
        var decade_array = [];
        for(var dec in decade_numbers) {
            var anoms = [];
            for(var vals in decade_numbers[dec].month_totals) {
                anoms.push({month: vals, anomaly: decade_numbers[dec].month_totals[vals] });
            }

            var averages_list = _.pluck(anoms, 'anomaly');
            var sum = _.reduce(averages_list, function(memo, num){ return +memo + +num; });
            var averages = (sum/ averages_list.length).toFixed(1);
            decade_array.push({ key: dec, anomaly_avg: averages, values: _.sortByOrder(anoms, ['month'], ['asc']) });
        }

        return decade_array;
    }

    function y_scale_anomalies() {
        var anomaly_values = [];
        for(var m=0; m<decade_array.length; m++) {
            anomaly_values.push(_.pluck(decade_array[m].values, 'anomaly'));
        }

        return [].concat.apply([], anomaly_values);
    }

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

function avg_anomalies(decade_array) {
    decade_array.forEach(function(d) {
        var anomaly_list = _.pluck(d.values, 'anomaly');
        var anomaly_total =  _.reduce(anomaly_list, function(memo, num){ return memo + num; }, 0);

        d.anomaly_avg = (anomaly_total / (d.values.length)).toFixed(1);
        d.decade = d.key.substr(0, 3) + '0';
    });

    return decade_array;
}