window.addEventListener("stackedChartLoaded", () => {
    const dataPath = 'data/chart/3/myanmar_deadly_events_summary.csv';
    d3.csv(dataPath, d => { return {
        type: d.Type,
        absolute: +d.Absolute,
        percentage: +d.Percentage
    }}).then(data => {
        drawWaffleChart(data, "#waffleChartContainer");

        window.dispatchEvent(new Event("waffleChartLoaded"));
    });

    function drawWaffleChart(data, containerId) {
        const container = d3.select(containerId);
        const svg = container.append("svg")
        .attr("viewBox", `0 0 400 400`);
        
        const tileSize = 40;
        const tilesPerRow = 10;

        const colors = d3.scaleOrdinal()
            .domain(data.map(d => d.type))
            .range(["#888888", "#ee3333"]);
        let tileData = [];

        let tileIndex = 0;
        data.forEach(d => {
            const numTiles = Math.round(d.percentage);
            for (let i = 0; i < numTiles; i++) {
                const row = Math.floor(tileIndex / tilesPerRow);
                const col = tileIndex % tilesPerRow;
                tileData.push({
                    x: col * tileSize,
                    y: row * tileSize,
                    type: d.type
                });
                tileIndex++;
            }
        });

        svg.selectAll("rect")
            .data(tileData)
            .enter()
            .append("rect")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            //add radius to make it look better
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("width", tileSize - 2) // 2px gap
            .attr("height", tileSize - 2) // 2px gap
            .attr("fill", d => colors(d.type))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);

        //add tootltips
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("padding", "6px")
            .style("background", "rgba(0,0,0,0.8)")
            .style("color", "#fff")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("opacity", 0);
        svg.selectAll("rect")
            .on("mouseover", (event, d) => {
                const datum = data.find(item => item.type === d.type);
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`${d.type}<br/>Absolute: ${datum.absolute}<br/>Percentage: ${Math.round(datum.percentage)}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(500).style("opacity", 0);
            });

    }

});