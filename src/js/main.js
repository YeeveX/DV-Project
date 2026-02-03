async function drawMap(containerId, sizeToMatchId) {
    const path = "data/geo/state-regions.geojson";
    const tilesPath = "data/geo/tiles";
    const container = document.getElementById(containerId);
    const mapAside = document.getElementById("mapAside");

    // 1. Precise Tile to Lon/Lat Bounding Box
    function getTileBounds(x, y, z) {
        function tile2long(x, z) { return (x / Math.pow(2, z) * 360 - 180); }
        function tile2lat(y, z) {
            const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
            return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
        }
        // Returns [NorthWest Corner, SouthEast Corner]
        return [
            [tile2long(x, z), tile2lat(y, z)],      // NW [lon, lat]
            [tile2long(x + 1, z), tile2lat(y + 1, z)] // SE [lon, lat]
        ];
    }

    let svg = null;

    await d3.json(path).then(function(geoData) {
        const toMatch = document.getElementById(sizeToMatchId);
        // const asideStyles = getComputedStyle(mapAside);
        // container.style.width = Math.min(parseFloat(asideStyles.width), 400) + "px";
        // container.style.top = toMatch.offsetTop + "px";
        
        const width = 300;
        const height = 600;

        svg = d3.select(`#${containerId}`)
            .append("svg")
            .attr("viewBox", `0 0 200 600`)
            .style("width", "100%")
            .style("height", "100%");

        console.log("SVG container created:", svg);

        // 2. The Projection
        const projection = d3.geoMercator().fitSize([width, height], geoData);
        const pathGenerator = d3.geoPath().projection(projection);

        window.mainProjection = projection; // Make it globally accessible

        // Your tile list
        let tileList = [];
        for (let x = 48; x <= 49; x++) {
            for (let y = 33; y <= 37; y++) {
                tileList.push({ x: x, y: y, z: 6 });
            }
        }

        const tileGroup = svg.append("g").attr("class", "tiles");
        const mapGroup = svg.append("g").attr("class", "vectors");

        function render() {
            // Update Tiles
            const tiles = tileGroup.selectAll("image")
                .data(tileList, d => `${d.z}_${d.x}_${d.y}`);

            tiles.enter()
                .append("image")
                .merge(tiles)
                .attr("xlink:href", d => `${tilesPath}/${d.z}_${d.x}_${d.y}.jfif`)
                .each(function(d) {
                    const bounds = getTileBounds(d.x, d.y+1, d.z);
                    const nwLatLon = { lon: bounds[0][0], lat: -bounds[0][1] };
                    const seLatLon = { lon: bounds[1][0], lat: -bounds[1][1] };

                    const nw = projection([nwLatLon.lon, nwLatLon.lat]);
                    const se = projection([seLatLon.lon, seLatLon.lat]);

                    d3.select(this)
                        .attr("x", nw[0])
                        .attr("y", nw[1])
                        .attr("width", se[0] - nw[0])
                        .attr("height", Math.abs(se[1] - nw[1]));

                    // //clip tiles to the map area
                    // d3.select(this)
                    //     .attr("clip-path", "url(#mapClip)");
                });

            // Update GeoJSON
            const regions = mapGroup.selectAll("path").data(geoData.features);
            const pathregions = regions.enter().append("path")
                .merge(regions)
                .attr("region-name", d => d.properties.ST)
                .attr("d", pathGenerator)
                .attr("fill", "rgba(200, 200, 200, 0.2)")
                .attr("stroke", "rgba(255, 255, 255, 0.3)");

            //add highlight and region name in tooltip on hover
            pathregions.on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("fill", "rgba(255, 255, 0, 0.3)")
                    .attr("stroke", "rgba(255, 255, 0, 0.6)");
                const tooltip = d3.select("body").append("div")
                    .attr("class", "map-tooltip")
                    .style("position", "absolute")
                    .style("background", "rgba(0, 0, 0, 0.7)")
                    .style("color", "#fff")
                    .style("padding", "5px")
                    .style("border-radius", "5px")
                    .style("pointer-events", "none")
                    .html(d.properties.ST)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                d3.select(this)
                    .attr("fill", "rgba(200, 200, 200, 0.2)")
                    .attr("stroke", "rgba(255, 255, 255, 0.3)");
                d3.selectAll(".map-tooltip").remove();
            })
            .on("mousemove", function(event, d) {
                d3.selectAll(".tooltip")
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            });

            tiles.exit().remove();
            regions.exit().remove();
        }

        render();

        // window.addEventListener("resize", () => {
        //     const toMatch = document.getElementById(sizeToMatchId);
        //     const asideStyles = getComputedStyle(mapAside);

        //     const widthDiff = parseFloat(asideStyles.width) - container.clientWidth;

        //     container.style.width = Math.min(parseFloat(asideStyles.width), 400) + "px";
        //     container.style.left = (widthDiff > 0 ? widthDiff : 0) + "px";
        //     container.style.top = toMatch.offsetTop + "px";
        // });

    });
    return svg;
}

async function loadSections() {
    const sections = ['methodology', 'symbol', 'stacked', 'waffle', 'choropleth', 'dumbbell'];
    for (const section of sections) {
        const response = await fetch(`${section}.html`);
        let html = await response.text();
        html += `<hr class="my-8 w-[600px] mx-auto">`;
        document.getElementById("mainContent").innerHTML += html;

        // const jsResponse = await fetch(`src/js/${section}Chart.js`);
        // const jsCode = await jsResponse.text();
        // document.body.appendChild(document.createElement('script')).text = jsCode;

        // if (section === 'symbol') return;
        // eval(jsCode);
    }

    const loadedEvent = new Event("sectionsLoaded");
    window.dispatchEvent(loadedEvent);
}

document.addEventListener("DOMContentLoaded", () => {
    loadSections();
});

function setupArmiesColors(){
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

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10.concat(d3.schemeCategory10).slice(0, 19));

    colorScale.domain(armyParaIds);
    window.armedColorScale = colorScale;
}
// function updateMainArticle(pageName)
// {
//     fetch(`${pageName}.html`)
//         .then(response => response.text())
//         .then(html => {
//             console.log(`Loading page: ${pageName}`);
//             document.getElementById("mainContent").innerHTML = html;
//         });
//     fetch(`src/js/${pageName}Chart.js`)
//         .then(response => response.text())
//         .then(jsCode => {
//             eval(jsCode);
//             // console.log(`Loading JS for page: ${pageName}`);
//             // const script = document.getElementById("activeScript");
//             // script.textContent = jsCode;
//             // document.body.appendChild(script);
//             window.loadCurrentChart?.();
//         });

// }

// drawMainMap("mainMap");
// updateMainArticle("line");