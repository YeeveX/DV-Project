window.addEventListener("choroplethChartLoaded", () => {
    const excludeSKCheckbox = document.getElementById("excludeSKCheck");
    const dataPath = 'data/chart/5/countries_indicators.csv';

    d3.csv(dataPath, d => { return {
        country: d["Country Name"],
        Y2020: d["2020 [YR2020]"],
        Y2021: d["2021 [YR2021]"],
        Y2022: d["2022 [YR2022]"],
        Series: d["Series Name"]
    }
    }).then(data => {
        const uniqueSeriesNames = Array.from(new Set(data.map(d => d.Series)));
        const dumbbellCategoriesSelect = document.getElementById("dumbbellCategoriesSelect");
        console.log(dumbbellCategoriesSelect);

        uniqueSeriesNames.forEach(seriesName => {
            const option = document.createElement("option");
            option.classList.add("bg-white", "text-black", "rounded-lg", "p-2", "mb-2");
            option.value = seriesName;
            option.text = seriesName;
            dumbbellCategoriesSelect.appendChild(option);
        });

        drawDumbbellChart(data, "#dumbbellChartContainer");
        window.dispatchEvent(new Event("dumbbellChartLoaded"));
    });


    function updateDumbbellChart(chartGroup, chartHeight, chartWidth, selectedSeries, data) {
        // Filter data for the desired series
        const filteredData = data.filter(d => d.Series === selectedSeries);

        if (excludeSKCheckbox.checked) {
            // Exclude South Korea
            const index = filteredData.findIndex(d => d.country === "Korea, Rep.");
            if (index !== -1) {
                filteredData.splice(index, 1);
            }
        }

        // Sort data by 2020 values
        filteredData.sort((a, b) => d3.descending(+a.Y2020, +b.Y2020));
        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => Math.max(+d.Y2020, +d.Y2021))])
            .range([0, chartWidth]);
        const yScale = d3.scaleBand()
            .domain(filteredData.map(d => d.country))
            .range([0, chartHeight]);

        // Axes
        const xAxis = d3.axisTop(xScale)
            .ticks(10)
            .tickFormat(d => d);
        const yAxis = d3.axisLeft(yScale);
        chartGroup.append("g")
            .attr("class", "x-axis")
            .call(xAxis);
        chartGroup.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Dumbbell lines
        chartGroup.selectAll(".dumbbell-line")
            .data(filteredData)
            .enter()
            .append("line")
            .attr("class", "dumbbell-line")
            .attr("x1", d => xScale(+d.Y2020))
            .attr("x2", d => xScale(+d.Y2021))
            .attr("y1", d => yScale(d.country) + yScale.bandwidth() / 2)
            .attr("y2", d => yScale(d.country) + yScale.bandwidth() / 2)
            .attr("stroke", d => +d.Y2021 > +d.Y2020 ? "green" : "red")
            .attr("stroke-width", 5);

        // Circles for 2020
        chartGroup.selectAll(".circle-2020")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "circle-2020")
            .attr("cx", d => xScale(+d.Y2020))
            .attr("cy", d => yScale(d.country) + yScale.bandwidth() / 2)
            .attr("r", 5)
            .attr("fill", "blue");
        // Circles for 2022
        chartGroup.selectAll(".circle-2021")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "circle-2021")
            .attr("cx", d => xScale(+d.Y2021))
            .attr("cy", d => yScale(d.country) + yScale.bandwidth() / 2)
            .attr("r", 5)
            .attr("fill", "orange");

            //add band behind myanmar
        const myanmarIndex = filteredData.findIndex(d => d.country === "Myanmar");
        if (myanmarIndex !== -1) {
            chartGroup.append("rect")
                .attr("x", -100)
                .attr("y", yScale(filteredData[myanmarIndex].country))
                .attr("width", chartWidth + 100)
                .attr("height", yScale.bandwidth())
                .attr("fill", "#ffff99")
                .lower();
        }
    }

    function drawDumbbellChart(data, containerId) {
        const container = d3.select(containerId);
        const svg = container.append("svg")
        .attr("viewBox", `0 0 800 400`);
        const width = 800;
        const height = 400;
        const margins = { top: 40, right: 40, bottom: 40, left: 100 };
        const chartWidth = width - margins.left - margins.right;;
        const chartHeight = height - margins.top - margins.bottom;
        const chartGroup = svg.append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`)
            .attr("class", "chart-group text-black");
        
        updateDumbbellChart(chartGroup, chartHeight, chartWidth, data[0].Series, data);

        const dumbbellCategoriesSelect = document.getElementById("dumbbellCategoriesSelect");
        dumbbellCategoriesSelect.addEventListener("change", function() {
            const selectedSeries = this.value;
            // Clear previous chart
            chartGroup.selectAll("*").remove();
            // Update chart with new data
            updateDumbbellChart(chartGroup, chartHeight, chartWidth, selectedSeries, data);
        });

        excludeSKCheckbox.addEventListener("change", function() {
            const selectedSeries = dumbbellCategoriesSelect.value;
            // Clear previous chart
            chartGroup.selectAll("*").remove();
            // Update chart with new data
            updateDumbbellChart(chartGroup, chartHeight, chartWidth, selectedSeries, data);
        });
    }
});