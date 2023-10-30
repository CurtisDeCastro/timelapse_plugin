// Assuming data is in the following format:
// const data = [
//     { year: 2000, state: 'CA', count: 100 },
//     { year: 2000, state: 'TX', count: 80 },
//     // ... more data
// ];

function generateData() {
    const states = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
                    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
                    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
                    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
                    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
    const data = [];
    const baseYear = 2000;

    states.forEach(state => {
        let baseCount = Math.floor(Math.random() * 1000) + 100;  // Random base count between 100 and 1100

        for (let year = 0; year < 20; year++) {
            const increment = Math.floor(Math.random() * 50) + 1;  // Random increment between 1 and 50
            baseCount += increment;
            data.push({ year: baseYear + year, state: state, count: baseCount });
        }
    });

    return data;
}

function log(message) {
    console.log(message);
}

function captureFrame() {
    gif.addFrame(canvas, { delay: 200 });
    log('Frame captured');
}

const data = generateData();
const years = [...new Set(data.map(d => d.year))];

years.forEach((year, index) => {
    const yearData = data.filter(d => d.year === year);
    draw(yearData);
    captureFrame();

    if (index === years.length - 1) {
        gif.on('finished', function(blob) {
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url);

            if (newWindow) {
                log('GIF rendered and pop-up opened successfully');
            } else {
                log('Pop-up blocked. You can access the GIF at the following URL: ' + url);
            }
        });
        log('Rendering GIF...');
        gif.render();
    }
});

log('Script executed');

const margin = { top: 20, right: 30, bottom: 30, left: 40 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#visualization")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.1);

const y = d3.scaleLinear()
    .rangeRound([height, 0]);

const color = d3.scaleOrdinal()
    .range(d3.schemeCategory10);

const gif = new GIF({
    workers: 2,
    quality: 10,
    width: width,
    height: height
});

years.forEach(year => {
    const yearData = data.filter(d => d.year === year);
    x.domain(yearData.map(d => d.state));
    y.domain([0, d3.max(yearData, d => d.count)]);
    color.domain(yearData.map(d => d.state));

    svg.selectAll(".bar")
        .data(yearData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.state))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", d => color(d.state));

    const svgNode = document.getElementById('visualization');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgNode);
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    img.onload = function() {
        gif.addFrame(img, {delay: 200});
        if (year === years[years.length - 1]) {
            gif.on('finished', blob => {
                window.open(URL.createObjectURL(blob));
            });
            gif.render();
        }
    };

    svg.selectAll(".bar").remove();  // Clear the previous bars
});
