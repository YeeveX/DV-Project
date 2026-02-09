window.addEventListener("symbolChartLoaded", () => {
    console.log("Loading Stacked Chart");
    const dataPath = 'data/chart/2/timeseries_mmr.csv';
    d3.csv(dataPath, d => { return {
        year: +d.year,
        total_deaths: +d.total_deaths,
        cumulative_deaths: +d.cumulative_deaths,
        side: d.side_b
    }}).then(data => {
        drawStackedBarChart(data, "#stackedChartContainer", false);
        drawStackedBarChart(data, "#cumulativeStackedChartContainer", true);

        window.dispatchEvent(new Event("stackedChartLoaded"));
    });

    const showYearByYearBtn = document.getElementById("showYearByYearBtn");
    const showCumulativeBtn = document.getElementById("showCumulativeBtn");

    const yearByYearStacked = document.getElementById("stackedChartContainer");
    const cumulativeStacked = document.getElementById("cumulativeStackedChartContainer");


    // toggleCumulativeStacked.addEventListener("change", (event) => {
    //     if (event.target.checked) {
    //         .style.display = "block";
    //         document.getElementById("stackedChartContainer").style.display = "none";
    //     } else {
    //         document.getElementById("cumulativeStackedChartContainer").style.display = "none";
    //         document.getElementById("stackedChartContainer").style.display = "block";
    //     }
    // });

    showYearByYearBtn.addEventListener("click", () => {
        yearByYearStacked.style.display = "block";
        cumulativeStacked.style.display = "none";

        showYearByYearBtn.classList.add("bg-blue-500");
        showYearByYearBtn.classList.remove("bg-gray-500");
        showYearByYearBtn.classList.remove("hover:bg-gray-400");

        showCumulativeBtn.classList.remove("bg-blue-500");
        showCumulativeBtn.classList.add("bg-gray-500");
        showCumulativeBtn.classList.add("hover:bg-gray-400");

        showYearByYearBtn.disabled = true;
        showCumulativeBtn.disabled = false;
    });

    showCumulativeBtn.addEventListener("click", () => {
        yearByYearStacked.style.display = "none";
        cumulativeStacked.style.display = "block";
        
        showCumulativeBtn.classList.add("bg-blue-500");
        showCumulativeBtn.classList.remove("bg-gray-500");
        showCumulativeBtn.classList.remove("hover:bg-gray-400");


        showYearByYearBtn.classList.remove("bg-blue-500");
        showYearByYearBtn.classList.add("bg-gray-500");
        showYearByYearBtn.classList.add("hover:bg-gray-400");
        

        showCumulativeBtn.disabled = true;
        showYearByYearBtn.disabled = false;
    });

    function drawStackedBarChart(data, containerId, cumulative = true) {
    const container = d3.select(containerId);
    container.selectAll("svg").remove();

    const height = 400;
    const width = 1000;
    const margins = { top: 40, right: 30, bottom: 60, left: 70 };

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    const years = [...new Set(data.map(d => d.year))].sort(d3.ascending);
    const sides = [...new Set(data.map(d => d.side))];
    const metric = cumulative ? "cumulative_deaths" : "total_deaths";

    const pivotedData = years.map(year => {
        const row = { year: year };
        sides.forEach(side => {
            const entry = data.find(d => d.year === year && d.side === side);
            row[side] = entry ? entry[metric] : 0;
        });
        return row;
    });

    const stackGenerator = d3.stack().keys(sides);
    const stackedSeries = stackGenerator(pivotedData);

    const dataByYear = years.map((year, i) => {
        const yearSegments = stackedSeries.map(series => {
            const segment = series[i];
            segment.side = series.key; 
            return segment;
        });
        yearSegments.year = year; 
        return yearSegments;
    });

    const xScale = d3.scaleBand()
        .domain(years)
        .range([margins.left, width - margins.right])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(pivotedData, d => d3.sum(sides, s => d[s]))]).nice()
        .range([height - margins.bottom, margins.top]);

    const colorScale = window.armedColorScale || d3.scaleOrdinal(d3.schemeCategory10).domain(sides);

    svg.append("g")
        .attr("transform", `translate(${margins.left},0)`)
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-width + margins.left + margins.right)
            .tickFormat("")
        )
        .selectAll("line")
        .attr("stroke", "#aaaaaa")
        .attr("stroke-dasharray", "2,2");

    const yearGroups = svg.append("g")
        .selectAll("g.year-stack")
        .data(dataByYear)
        .join("g")
        .attr("class", "year-stack")
        .attr("x", d => xScale(d.year))
        .attr("transform", d => `translate(${xScale(d.year)},0)`);

    yearGroups.selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("fill", d => colorScale(d.side))
        .attr("x", 0)
        .attr("y", d => yScale(d[1]))
        .attr("height", d => yScale(d[0]) - yScale(d[1]))
        .attr("width", xScale.bandwidth());

    const xAxis = d3.axisBottom(xScale)
        .tickValues(years.filter((d, i) => !(i % 2))); // Show every 2nd year for space

    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("transform", `translate(0,${height - margins.bottom})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("fill", "black");

    svg.append("g")
        .attr("transform", `translate(${margins.left},0)`)
        .call(yAxis)
        .selectAll("text")
        .attr("font-size", "12px")
        .attr("fill", "black");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margins.left / 4)
        .attr("x", -(height / 2))
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text(cumulative ? "Cumulative Deaths" : "Total Deaths");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(cumulative ? "Cumulative Deaths Over Time" : "Yearly Deaths Over Time");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("Year");

    const legend = svg.append("g")
        .attr("transform", `translate(${90},${23})`);
    const legendItems = Array.from(new Set(data.map(d => d.side)));

    legend.selectAll("rect")
        .data(legendItems)
        .enter()
        .append("rect")
        .attr("y", (d, i) => i % 2 == 0 ? 0 : 20)
        .attr("x", (d, i) => Math.floor(i / 2) * 80)
        .attr("width", 20)
        .attr("height", 15)
        .attr("fill", d => colorScale(d));

    legend.selectAll("text")
        .data(legendItems)
        .enter()
        .append("text")
        .attr("y", (d, i) => i % 2 == 0 ? 12 : 32)
        .attr("x", (d, i) => Math.floor(i / 2) * 80 + 25)
        .attr("fill", "black")
        .attr("font-size", "12px")
        .text(d => d);

    yearGroups.append("text")
        .attr("x", xScale.bandwidth() / 2)
        .attr("y", d => yScale(d3.sum(sides, s => {
            const segment = d.find(seg => seg.side === s);
            return segment ? segment[1] - segment[0] : 0;
        })) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "black")
        .text(d => d3.sum(sides, s => {
            const segment = d.find(seg => seg.side === s);
            return segment ? segment[1] - segment[0] : 0;
        }));
    
    if (!cumulative)
    {
        function addAnnotation(year, offset, text)
        {
            const annotationData = dataByYear.find(d => d.year === year);
            if (annotationData) {
                const annotationX = xScale(year) + xScale.bandwidth() / 2;
                const annotationY = yScale(d3.sum(sides, s => {
                    const segment = annotationData.find(seg => seg.side === s);
                    return segment ? segment[1] - segment[0] : 0;
                })) - 10;
            
                svg.append("line")
                    .attr("x1", annotationX)
                    .attr("y1", annotationY - 10)
                    .attr("x2", annotationX + offset.x)
                    .attr("y2", annotationY + offset.y)
                    .attr("stroke", "#333333");

                svg.append("text")
                    .attr("x", annotationX + offset.x - 5)
                    .attr("y", annotationY + offset.y - 5)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("fill", "#333333")
                    .text(text);
            }
        }

        addAnnotation(2017, {x: -100, y: -50}, "Rohingya genocide");
        addAnnotation(2021, {x: -40, y: -80}, "Military coup");
    }

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#f9f9f9")
        .style("padding", "5px")
        .style("border", "1px solid #d3d3d3")
        .style("color", "#333")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    //highlight entire stack on hover
    yearGroups.on("mouseover", function(event, d) {
        //make all other stacks more transparent
        d3.selectAll(".year-stack").selectAll("rect")
            .transition()
            .duration(50)
            .attr("opacity", 0.3);
        //highlight current stack
        d3.select(this).selectAll("rect")
            .transition()
            .duration(0)
            .attr("opacity", 1);
        //show tooltip breakdown by side
        
        const breakdown = sides.map(s => {
            const segment = d.find(seg => seg.side === s);
            const value = segment ? segment[1] - segment[0] : 0;
            return `<strong style="color: ${colorScale(s)}">${s}:</strong> ${value}`;
        });

        //2 cols table
        let tabular = '<table style="width: 220px;">';
        breakdown.forEach((row, i) => {
            if (i % 2 === 0) {
                tabular += '<tr>';
            }
            tabular += `<td style="padding: 0px 5px;">${row}</td>`;
            if (i % 2 === 1) {
                tabular += '</tr>';
            }
        });
        tabular += '</table>';

        function getOffset(el) {
            const rect = el.getBoundingClientRect();
            return {
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY
            };
        }
        const offset = getOffset(svg.node());
        let xPos = offset.left + xScale(d.year) * 1.1;
        if (d.year > years[Math.floor(years.length / 2)]) {
            xPos -= (220 + xScale.bandwidth());
        }
        else{
            xPos += xScale.bandwidth() + 10;
        }
        const yPos = offset.top + 160;

        console.log(offset.left, xScale(d.year));

        tooltip.html(`<strong>Year: ${d.year}</strong><br/>${tabular}`)
            .style("left", (xPos) + "px")
            .style("top", (yPos) + "px")
            .transition()
            .duration(200)
            .style("opacity", 0.9);
    })
    .on("mouseout", function(event, d) {
        d3.selectAll(".year-stack").selectAll("rect")
            .transition()
            .duration(100)
            .attr("opacity", 1);
        tooltip.transition()
            .duration(100)
            .style("opacity", 0);
    });

    console.log("Grouped-by-year chart with axes rendered.");
}
});