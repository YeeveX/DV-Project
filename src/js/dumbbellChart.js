window.addEventListener("choroplethChartLoaded", () => {
    const excludeSKCheckbox = document.getElementById("excludeSKCheck");
    const dataPath = 'data/chart/5/countries_indicators.csv';

    const categoryDescriptions = {
        "NY.GDP.MKTP.CD": "The total market value of all final goods and services produced within the country in a given year.",
        "SP.POP.TOTL": "The total number of people residing in the country.",
        "NY.GDP.PCAP.CD": "The average economic output per person, calculated by dividing the country's GDP by its total population.",
        "NV.AGR.TOTL.CD": "The total value of all agricultural products and services produced within the country in a given year.",
        "GE.PER.RNK": "A composite measure of the quality of public services, the civil service, and the credibility of the government's commitment to its policies. A rank of 90 means it performs better than 90% of other countries.",
        "NV.IND.TOTL.CD": "The total value of all industrial products and services produced within the country in a given year.",
        "TX.VAL.MRCH.CD.WT": "The total value of all goods and services exported by the country to other countries in a given year.",
        "TM.VAL.MRCH.CD.WT": "The total value of all goods and services imported by the country from other countries in a given year.",
        "MS.MIL.XPND.GD.ZS": "The percentage of the country's GDP that is spent on the military and defense.",
    };
    const categoryParagraph = document.getElementById("dumbbellCategoryDescription");

    d3.csv(dataPath, d => { return {
        country: d["Country Name"],
        Y2020: d["2020 [YR2020]"],
        Y2021: d["2021 [YR2021]"],
        Y2022: d["2022 [YR2022]"],
        Series: d["Series Name"],
        SeriesCode: d["Series Code"],
    }
    }).then(data => {
        const uniqueSeries = Array.from(new Set(data.map(d => JSON.stringify({ Series: d.Series, SeriesCode: d.SeriesCode }))), s => JSON.parse(s));
        const dumbbellCategoriesSelect = document.getElementById("dumbbellCategoriesSelect");
        
        uniqueSeries.forEach(series => {
            const option = document.createElement("option");
            option.classList.add("bg-white", "text-black", "rounded-lg", "p-2", "mb-2");
            option.value = series.SeriesCode;
            option.text = series.Series;
            dumbbellCategoriesSelect.appendChild(option);
        });

        drawDumbbellChart(data, "#dumbbellChartContainer");
        window.dispatchEvent(new Event("dumbbellChartLoaded"));
    });


    function updateDumbbellChart(chartGroup, chartHeight, chartWidth, selectedSeries, data) {
        // Filter data for the desired series
        const filteredData = data.filter(d => d.SeriesCode === selectedSeries);

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
        function formatTick(d) {
            if (d >= 1e9) return (d / 1e9).toFixed(0) + "B";
            if (d >= 1e6) return (d / 1e6).toFixed(0) + "M";
            if (d >= 1e3) return (d / 1e3).toFixed(2) + "K";
            return d.toFixed(2);
        }

        const xAxis = d3.axisTop(xScale)
            .ticks(10)
            .tickFormat(d => formatTick(d));
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
            .attr("fill", "blue")
            .attr("opacity", d => isNaN(+d.Y2020) ? 0 : 1); // Hide circles if value is NaN

        // Circles for 2021
        chartGroup.selectAll(".circle-2021")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "circle-2021")
            .attr("cx", d => xScale(+d.Y2021))
            .attr("cy", d => yScale(d.country) + yScale.bandwidth() / 2)
            .attr("r", 5)
            .attr("fill", "orange")
            .attr("opacity", d => isNaN(+d.Y2021) ? 0 : 1);

        //add N/A labels for missing data
        chartGroup.selectAll(".na-label")
            .data(filteredData)
            .enter()
            .append("text")
            .attr("class", "na-label")
            .attr("x", d => {
                if (isNaN(+d.Y2020)) return 5; // Position for N/A label for 2020
                if (isNaN(+d.Y2021)) return xScale(+d.Y2021) + 5; // Position for N/A label for 2021
                return -1000; // Position off-screen if data is present
            })
            .attr("y", d => yScale(d.country) + yScale.bandwidth() / 2 + 5)
            .text("N/A")
            .attr("fill", "darkgray")
            .attr("font-size", "14px");
        
        //add vertical dotted lines at ticks
        chartGroup.selectAll(".x-tick-line")
            .data(xScale.ticks(10))
            .enter()
            .append("line")
            .attr("class", "x-tick-line")
            .attr("x1", d => xScale(d))
            .attr("x2", d => xScale(d))
            .attr("y1", 0)
            .attr("y2", chartHeight)
            .attr("stroke", "#cccccc")
            .attr("stroke-dasharray", "2,2")
            .lower();

        //add band behind myanmar
        const myanmarIndex = filteredData.findIndex(d => d.country === "Myanmar");
        if (myanmarIndex !== -1) {
            chartGroup.append("rect")
                .attr("x", -80)
                .attr("y", yScale(filteredData[myanmarIndex].country))
                .attr("width", chartWidth + 80)
                .attr("height", yScale.bandwidth())
                .attr("fill", "#ffff99")
                .lower();
            
                //add gray bands for every other row
            chartGroup.selectAll(".gray-band")

                .data(filteredData)
                .enter()
                .append("rect")
                .filter((d, i) => i % 2 === 1 && d.country !== "Myanmar")
                .attr("class", "gray-band")
                .attr("x", -80)
                .attr("y", d => yScale(d.country))
                .attr("width", chartWidth + 80)
                .attr("height", yScale.bandwidth())
                .attr("fill", "#f0f0f0")
                .lower();

            //add tooltips
            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("background", "#000")
                .style("color", "#fff")
                .style("padding", "5px 10px")
                .style("border-radius", "4px")
                .style("pointer-events", "none")
                .style("opacity", 0);

            //select all circles and lines for tooltip interaction
            chartGroup.selectAll("circle, .dumbbell-line")
                .on("mouseover", function(event, d) {
                    //write both year values in tooltip
                    const year2020 = +d.Y2020;
                    const year2021 = +d.Y2021;
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    tooltip.html(`<strong>${d.country}</strong><br/>2020: ${formatTick(year2020)}<br/>2021: ${formatTick(year2021)}`)
                        .style("left", (event.pageX) + "px")
                        .style("top", (event.pageY-5) + "px")
                        .attr("class", "translate-x-[-50%] translate-y-[-100%]");

                    //other circle
                    chartGroup.selectAll("circle")
                        .filter(circleData => circleData.country === d.country)
                        .attr("r", 8);

                    chartGroup.selectAll(".dumbbell-line")
                        .filter(lineData => lineData.country === d.country)
                        .attr("stroke-width", 8);


                })
                .on("mousemove", function(event) {
                    tooltip.style("left", (event.pageX) + "px")
                        .style("top", (event.pageY-5) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                    chartGroup.selectAll("circle")
                        .attr("r", 5);
                    chartGroup.selectAll(".dumbbell-line")
                        .attr("stroke-width", 5);
                });
            
            categoryParagraph.innerHTML = categoryDescriptions[selectedSeries] || "";
        }
    }

    function drawDumbbellChart(data, containerId) {
        const container = d3.select(containerId);
        const svg = container.append("svg")
        .attr("viewBox", `0 0 800 400`);
        const width = 800;
        const height = 400;
        const margins = { top: 60, right: 20, bottom: 10, left: 100 };
        const chartWidth = width - margins.left - margins.right;;
        const chartHeight = height - margins.top - margins.bottom;
        const chartGroup = svg.append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`)
            .attr("class", "chart-group text-black");
        
        updateDumbbellChart(chartGroup, chartHeight, chartWidth, data[0].SeriesCode, data);

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

        //add generic legend
        const circlesData = [
            { label: "2020", color: "blue" },
            { label: "2021", color: "orange" },
        ];
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${margins.left}, ${margins.top - 40})`);
        legend.selectAll("circle")
            .data(circlesData)
            .enter()
            .append("circle")
            .attr("cx", (d, i) => i * 70)
            .attr("cy", 0)
            .attr("r", 8)
            .attr("fill", d => d.color)
    
        legend.selectAll("text")
            .data(circlesData)
            .enter()
            .append("text")
            .attr("x", (d, i) => i * 70 + 12)
            .attr("y", 4)
            .text(d => d.label)
            .attr("font-size", "12px")
            .attr("fill", "#333");

        const lineLegendData = [
            { label: "Increase from 2020 to 2021", color: "green" },
            { label: "Decrease from 2020 to 2021", color: "red" },
        ];

        const lineLegend = svg.append("g")
            .attr("class", "line-legend")
            .attr("transform", `translate(${margins.left + 200}, ${margins.top - 40})`);
        lineLegend.selectAll("line")
            .data(lineLegendData)
            .enter()
            .append("line")
            .attr("x1", (d, i) => i * 200)
            .attr("y1", 5)
            .attr("x2", (d, i) => i * 200 + 180)
            .attr("y2", 5)
            .attr("stroke", d => d.color)
            .attr("stroke-width", 5);
        lineLegend.selectAll("text")
            .data(lineLegendData)
            .enter()
            .append("text")
            .attr("x", (d, i) => i * 200 + 18)
            .attr("y", 0)
            .text(d => d.label)
            .attr("font-size", "12px")
            .attr("fill", "#333");
    }
});