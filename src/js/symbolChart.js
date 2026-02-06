window.addEventListener("sectionsLoaded", () => {
console.log("Loading Symbol Chart");

const symbolSvg = drawMap("symbolMap", "symbolArticle");
// console.log(symbolSvg);

const armyParaIds = ["KIO",
    "KNU",
    "ULA",
    "PSLF",
    "CNF",
    "KNPP",
    "ARSA",
    "SSPP",
    "MNDAA",
    "RCSS"];

const dataPath = 'data/chart/1/coords_mmr.csv';
d3.csv(dataPath).then(async data => {
    //get first 500 rows
    // data = data.slice(0, 5000);
    await drawSymbolOnMap(symbolSvg, data);
    window.dispatchEvent(new Event("symbolChartLoaded"));
});

console.log("Symbol Chart JS loaded");


async function drawSymbolOnMap(svgPromise, data) {    
    // console.log(svgPromise);
    const svg = await svgPromise;
    // console.log(svg);

    //for each category of side_b use a color, there are 19 unique values
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10.concat(d3.schemeCategory10).slice(0, 19));



    const groups = Array.from(new Set(data.map(d => d.side_b)));
    colorScale.domain(new Set(data.map(d => d.side_b)));

    window.armedColorScale = function (side) {
        switch (side) {
            case 'Civilians':
                return "orange";
            case 'NUG':
                return "purple";
            default:
                return colorScale(side);
        }
    }

    // const circlesGroup = svg.append("g")
    // .attr("class", "circles-group");

    //group data by side_b
    const dataBySide = d3.group(data, d => d.side_b);

    // 3. Plot symbols

    const sideGroup = svg.append("g")
        .attr("class", "side-groups")
        .selectAll("g")
        .data(dataBySide)
        .enter()
        .append("g")
        .attr("class", d => `side-group-${d[0]}`);

    const circles = sideGroup.selectAll("circle")
        .data(d => d[1])
        .enter()
        .append("circle")
        .attr("class", "battle-circle")

    // const circles = circlesGroup.selectAll("circle")
    //     .data(data)
    //     .enter()
    //     .append("circle")
        .attr("cx", d => {
            const coords = window.mainProjection([parseFloat(d.longitude), parseFloat(d.latitude)]);
            return coords ? coords[0] : 0;
        })
        .attr("cy", d => {
            const coords = window.mainProjection([parseFloat(d.longitude), parseFloat(d.latitude)]);
            return coords ? coords[1] : 0;
        })
        .attr("r", 4)
        .attr("fill", d => colorScale(d.side_b))
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .attr("opacity", 1);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .attr("z-index", 1000);

    const legendData = "1 dot = 1 battle";
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(20, 430)`);
    const dot = legend.selectAll("circle")
        .data([legendData])
        .enter()
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 4)
        .attr("fill", "white")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);
    const legendText = legend.selectAll("text")
        .data([legendData])
        .enter()
        .append("text")
        .attr("x", 10)
        .attr("y", 4)
        .text(d => d)
        .attr("font-size", "12px")
        .attr("fill", "white")
        //border

    //on mouse over show tooltip with side_b and make other circles more transparent
    sideGroup.selectAll("circle").on("mouseover", function(event, d) {
        const parent = d3.select(this.parentNode);
        parent.raise();

        // console.log("Mouse over on:", d);
        tooltip.transition()
            .style("opacity", .9);
        tooltip.html(`Against: ${d.side_b}`)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px")
            .attr("side_b", d.side_b);
        d3.selectAll(".battle-circle")
            .transition()
            .duration(50)
            .attr("r", d => tooltip.attr("side_b") === d.side_b ? 5 : 2);
    })
    .on("mousemove", function(event, d) {
        tooltip.style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
        tooltip.transition()
            .duration(0)
            .style("opacity", 0);
        d3.selectAll(".battle-circle")
            .transition()
            .duration(100)
            .attr("r", 4);
    });

    for (const group of groups) {
        // console.log(`Group: ${group}, Color: ${colorScale(group)}`);
        if (armyParaIds.includes(group)) {
            const color = colorScale(group);
            const span = document.getElementById(group);
            span.style.color = color;
            // console.log("Found paragraph for group:", span);
            span.addEventListener("mouseover", (e) => {
                //dispatch mouseover event to first circle of that group
                const firstCircle = svg.select(`.side-group-${group} circle`).node();
                if (firstCircle) {
                    const event = new MouseEvent("mouseover", {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    firstCircle.dispatchEvent(event);
                }

                // //  console.log("Mouse over paragraph for group:", group);
                // d3.selectAll("circle")
                //     .transition()
                //     .duration(100)
                //     .attr("r", d => d.side_b === group ? 5 : 2);
                    
            });
            span.addEventListener("mouseout", () => {
                d3.selectAll(".battle-circle")
                    .transition()
                    .duration(100)
                    .attr("r", 4)
                    .attr("z-index", 3)
                    .attr("opacity", 1);
            });
        }
    }

    // window.addEventListener("projectionUpdated", () => {
    //     console.log("Updating symbol positions due to projection change");
        
    //     // RE-SELECT the circles from the DOM
    //     d3.select("#symbolMap svg").selectAll("circle")
    //         .attr("cx", d => {
    //             const coords = window.mainProjection([parseFloat(d.longitude), parseFloat(d.latitude)]);
    //             return coords ? coords[0] : 0;
    //         })
    //         .attr("cy", d => {
    //             const coords = window.mainProjection([parseFloat(d.longitude), parseFloat(d.latitude)]);
    //             return coords ? coords[1] : 0;
    //         });
    // });

    // circles.exit().remove();
}
});