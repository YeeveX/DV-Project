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

    toggleCumulativeStacked.addEventListener("change", (event) => {
        if (event.target.checked) {
            document.getElementById("cumulativeStackedChartContainer").style.display = "block";
            document.getElementById("stackedChartContainer").style.display = "none";
        } else {
            document.getElementById("cumulativeStackedChartContainer").style.display = "none";
            document.getElementById("stackedChartContainer").style.display = "block";
        }
    });

    function drawStackedBarChart(data, containerId, cumulative=true) {
        const container = d3.select(containerId);
        const svg = container.append("svg")
        .attr("viewBox", `0 0 1000 400`);

        const height = 400;
        const width = 1000;

        const margins = { top: 20, right: 30, bottom: 40, left: 60 };

        const xScale = d3.scaleBand()
            .domain(data.map(d => d.year).sort(d3.ascending))
            .range([margins.left, width - margins.right])
            .padding(0.1);

        const colorScale = window.armedColorScale;
            
        const stackedData = d3.stack()
            .keys(Array.from(new Set(data.map(d => d.side))))
            .value((d, key) => {
                const record = d.find(item => item.side === key);
                return record ? (cumulative ? record.cumulative_deaths : record.total_deaths) : 0;
            })(d3.group(data, d => d.year).values());

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(stackedData, d => d3.max(d, d => d[1]))]).nice()
            .range([height - margins.bottom, margins.top]);


        // console.log(stackedData);

        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(${margins.left},0)`)
            .call(d3.axisLeft(yScale)
                .tickSize(-width + margins.left + margins.right)
                .tickFormat("")
            )
            .selectAll("line")
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "2,2");


        const stacks = svg.append("g")
            .selectAll("g")
            .data(stackedData)
            .enter().append("g")
            .attr("fill", d => colorScale(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => xScale(d.data[0].year))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width", xScale.bandwidth());

        //add total deaths labels on top of each stack
        const deathsPerYear = d3.rollup(data, v => d3.sum(v, d => cumulative ? d.cumulative_deaths : d.total_deaths), d => d.year);
        svg.append("g")
            .selectAll("text")
            .data(Array.from(deathsPerYear))
            .enter().append("text")
            .attr("x", d => xScale(d[0]) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d[1]) - 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "black")
            .text(d => d[1]);

            
        //add only years to x axis
        const xAxis = g => g
            .attr("transform", `translate(0,${height - margins.bottom})`)
            .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d, i) => !(i % 2))))
            .selectAll("text")
            .attr("color", "black")
            .attr("transform", "rotate(-45)")
            .attr("font-size", "14px")
            .style("text-anchor", "end");

        const yAxis = g => g
            .attr("transform", `translate(${margins.left},0)`)
            .attr("color", "black")
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .attr("font-size", "14px");
        svg.append("g").call(xAxis);


        svg.append("g").call(yAxis);

        //legend
        const legend = svg.append("g")
            .attr("transform", `translate(${70},${margins.top})`);

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

        console.log("Stacked Chart JS loaded");
    }
});