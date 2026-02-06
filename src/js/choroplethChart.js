window.addEventListener("waffleChartLoaded", () => {
    const choroplethFatalitiesSvg = drawMap("choroplethFatalitiesMap", "choroplethArticle");
    const choroplethEventsSvg = drawMap("choroplethEventsMap", "choroplethArticle");

    const dataPath = 'data/chart/4/myanmar_post_coup_events_fatalities_by_admin1.csv';

    console.log("Choropleth Chart JS loaded");
    
    function fatalitiesMap(d) { return { admin: d.admin1, value: d.fatalities }; }
    function eventsMap(d) { return { admin: d.admin1, value: d.events }; }

    d3.csv(dataPath, d => { return {
        admin1: d.ADMIN1,
        fatalities: +d.FATALITIES,
        events: +d.EVENTS,
    }}).then(async data => {
        await drawChoroplethOnMap(choroplethFatalitiesSvg, data, fatalitiesMap, "Fatalities");
        await drawChoroplethOnMap(choroplethEventsSvg, data, eventsMap, "Events");

        window.dispatchEvent(new Event("choroplethChartLoaded"));
    });

    const showFatalitiesMapBtn = document.getElementById("showFatalitiesMapBtn");
    const showEventsMapBtn = document.getElementById("showEventsMapBtn");

    const choroplethFatalitiesMap = document.getElementById("choroplethFatalitiesMap");
    const choroplethEventsMap = document.getElementById("choroplethEventsMap");

    // Initially show fatalities map and hide events map
    choroplethFatalitiesMap.style.display = "block";
    choroplethEventsMap.style.display = "none";
    
    showFatalitiesMapBtn.addEventListener("click", () => {
        choroplethFatalitiesMap.style.display = "block";
        choroplethEventsMap.style.display = "none";

        showFatalitiesMapBtn.classList.add("bg-blue-500");
        showFatalitiesMapBtn.classList.remove("bg-gray-500");
        showFatalitiesMapBtn.classList.remove("hover:bg-gray-400");

        showEventsMapBtn.classList.remove("bg-blue-500");
        showEventsMapBtn.classList.add("bg-gray-500");
        showEventsMapBtn.classList.add("hover:bg-gray-400");

        showFatalitiesMapBtn.disabled = true;
        showEventsMapBtn.disabled = false;
    });

    showEventsMapBtn.addEventListener("click", () => {
        choroplethFatalitiesMap.style.display = "none";
        choroplethEventsMap.style.display = "block";
        
        showEventsMapBtn.classList.add("bg-blue-500");
        showEventsMapBtn.classList.remove("bg-gray-500");
        showEventsMapBtn.classList.remove("hover:bg-gray-400");


        showFatalitiesMapBtn.classList.remove("bg-blue-500");
        showFatalitiesMapBtn.classList.add("bg-gray-500");
        showFatalitiesMapBtn.classList.add("hover:bg-gray-400");
        

        showEventsMapBtn.disabled = true;
        showFatalitiesMapBtn.disabled = false;
    });
    
    async function drawChoroplethOnMap(svgPromise, data, dataMap, legendTitle) {    
        // console.log(svgPromise);
        const svg = await svgPromise;

        const maxValue = d3.max(data, d => dataMap(d).value);
        const colorScale = d3.scaleSequential()
            .domain([0, maxValue])
            .interpolator(legendTitle === "Fatalities" ? d3.interpolateReds : d3.interpolatePurples);
        // Map admin names to values
        const dataByAdmin = new Map();
        data.forEach(d => {
            dataByAdmin.set(dataMap(d).admin, dataMap(d).value);
        });

        // Color the regions based on fatalities
        //each path has a region-name attribute corresponding to admin1
        svg.selectAll("path")
            .attr("fill", d => {
                const admin1 = d.properties.ST;
                const value = dataByAdmin.get(admin1) || 0;
                return colorScale(value);
            })
            .attr("stroke", "#333")
            .attr("opacity", 0.8);
        
        //add legend
        const legendWidth = 20;
        const legendHeight = 200;
        const legendSvg = svg.append("g")
            .attr("transform", `translate(${svg.attr("width") - legendWidth - 10}, 360)`);
        const legendScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([legendHeight, 0]);
        const legendAxis = d3.axisRight(legendScale) //add start, end and 5 intermediate ticks
            .tickValues([0, 5000, 10000, 15000, 20000, maxValue])
            .tickFormat(d3.format(".0f"));

        
        const legendGradientId = "legend-gradient-" + legendTitle.replace(/\s+/g, '');

        const defs = legendSvg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", legendGradientId)
            .attr("x1", "0%")
            .attr("x2", "0%")
            .attr("y1", "100%")
            .attr("y2", "0%");
        linearGradient.selectAll("stop")
            .data(d3.range(0, 1.01, 0.01))
            .enter()
            .append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => colorScale(d * maxValue));
        legendSvg.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", `url(#${legendGradientId})`)
            .attr("stroke", "#999")
            .attr("stroke-width", 0.5);
            //add axis to legend
        legendSvg.append("g")
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(legendAxis);
        legendSvg.append("text")
            .attr("x", 0)
            .attr("y", -15)
            .attr("font-size", "12px")
            .attr("fill", "white")
            .text(legendTitle);

        //add tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("pointer-events", "none")
            .style("opacity", 0);
        svg.selectAll("path")
            .on("mouseover", (event, d) => {
                const admin1 = d.properties.ST;
                const value = dataByAdmin.get(admin1) || 0;
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html(`<strong>${admin1}</strong><br/>${legendTitle}: ${value}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style("background-color", "black");

                //make border thicker
                d3.select(event.currentTarget)
                    .attr("stroke-width", 2)
                    .attr("stroke", "#000");
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", (event) => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                d3.select(event.currentTarget)
                    .attr("stroke-width", 1)
                    .attr("stroke", "#333");
            });
        
        //add most important cities
        const cities = [
            { name: "Naypyidaw", coords: [96.0844, 19.7633], pop: 924608, textOffset: [-27, 16], isCapital: true },
            { name: "Mandalay", coords: [96.0830, 21.9757], pop: 1250000, textOffset: [-24, 16] },
            { name: "Yangon", coords: [96.1580, 16.8409], pop: 5400000, textOffset: [-18, 16] },
            { name: "Mawlamyine", coords: [97.6350, 16.4900], pop: 300000, textOffset: [-30, 16] },
            { name: "Taunggyi", coords: [97.0372, 20.7894], pop: 150000, textOffset: [-27, 16] },
            { name: "Bago", coords: [96.4647, 17.3363], pop: 250000, textOffset: [-12, -8] },
            { name: "Sagaing", coords: [95.7010, 22.1366], pop: 100000, textOffset: [-20, -10] },
        ];

        svg.selectAll("circle.city")
            .data(cities)
            .enter()
            .append("circle")
            .attr("class", "city")
            .attr("cx", d => window.mainProjection(d.coords)[0])
            .attr("cy", d => window.mainProjection(d.coords)[1])
            .attr("r", d => Math.log2(d.pop) / 5)
            .attr("fill", d => d.isCapital ? "red" : "blue")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);
        
        //city labels
        svg.selectAll("text.city-label")
            .data(cities)
            .enter()
            .append("text")
            .attr("class", "city-label")
            .attr("x", d => window.mainProjection(d.coords)[0] + d.textOffset[0])
            .attr("y", d => window.mainProjection(d.coords)[1] + d.textOffset[1])
            .text(d => d.name)
            .attr("font-size", "12px")
            .attr("fill", "#000")
            .attr("paint-order", "stroke")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round");

        console.log("Choropleth map drawn");
    }
});