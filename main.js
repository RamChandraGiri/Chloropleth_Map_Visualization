//D3 Scripting Part

//Get tooltip
const tooltip = document.getElementById('tooltip');

//Create a function that create our SVG element after awaiting fetching of both JSON data
async function createSVG() {
    const us = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json')
        .then(res => res.json())
        .catch(err => console.log(err))
    // Object containing information of Topology

    const education = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json')
        .then(res => res.json())
        .catch(err => console.log(err))
    // Array of objects containing education data
    //Format: [{fips: (state id), state: 'abbr.', area_name: 'Full name', bachelorsOrHigher: Num}, ...] 

    //Common element of both JSON file is 'id' and 'fips'.

    //Define Path
    const path = d3.geoPath();

    //Define width and height of SVG and create under #container
    const width = 975;
    const height = 610;
    const svg = d3.select('#container').append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background-color', 'white');

    //Minimum and maximum bachelor degree percentage with step for threshold
    const minEdu = d3.min(education, d => d.bachelorsOrHigher);
    const maxEdu = d3.max(education, d => d.bachelorsOrHigher);
    const step = (maxEdu - minEdu) / 8;


    var x = d3.scaleLinear()
        .domain([minEdu, maxEdu])
        .rangeRound([600, 860]);

    const color = d3.scaleThreshold()
        .domain(d3.range(minEdu, maxEdu, step))
        .range(d3.schemeBlues[9]);

    //Legend part
    var g = svg.append('g')
        .attr('class', 'key')
        .attr('id', 'legend')
        .attr('transform', 'translate(0,40)');

    g.selectAll('rect')
        .data(color.range().map(function (d) {
            d = color.invertExtent(d);
            if (d[0] == null) d[0] = x.domain()[0];
            if (d[1] == null) d[1] = x.domain()[1];
            return d;
        }))        
        .enter().append('rect')
        .attr('height', 8)
        .attr('x', d => x(d[0]))
        .attr('width', d => x(d[1]) - x(d[0]))
        .attr('fill', d => color(d[0]));
        // Understanding of invertExtent: https://github.com/d3/d3-scale/blob/master/README.md#threshold_invertExtent
        // and https://stackoverflow.com/questions/48161257/understanding-invertextent-in-a-threshold-scale

    g.append('text')
        .attr('class', 'caption')
        .attr('x', x.range()[0])
        .attr('y', -6)
        .attr('fill', '#000')
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold')
        .text("Percentage of Bachelor's Degree");

    g.call(d3.axisBottom(x)
            .tickSize(13)
            .tickFormat(x => Math.round(x) + '%')
            .tickValues(color.domain()))
        .select('.domain')
        .remove();    
    
    //Main SVG part        
    svg.append('g')
        .attr('class', 'counties')
        .selectAll('path')
        .data(topojson.feature(us, us.objects.counties).features)
        .enter()
        .append('path')
        .attr('class', 'county')
        .attr('fill', d => color(education.find(e => e.fips === d.id).bachelorsOrHigher))
        .attr('d', path)
        .attr('data-fips', d => d.id)
        .attr('data-education', d => education.find(e => e.fips === d.id).bachelorsOrHigher)
        .on('mouseover', (d, i) => {
            const { coordinates } = d.geometry;
            const [x, y] = coordinates[0][0];
      
            const edu = education.find(e => e.fips === d.id);
      
            tooltip.classList.add('show');
            tooltip.style.left = x - 50 + 'px';
            tooltip.style.top = y - 50 + 'px';
            tooltip.setAttribute('data-education', edu.bachelorsOrHigher);
      
            tooltip.innerHTML = `
              <p>${edu.area_name} - ${edu.state}</p>
              <p>${edu.bachelorsOrHigher}%</p>
            `;
        }).on('mouseout', () => {
          tooltip.classList.remove('show');
        });
}

//Run function
createSVG();

//Reference: Choropleth(https://observablehq.com/@d3/choropleth) by Mike Bostock
//Choropleth V5(https://bl.ocks.org/adamjanes/6cf85a4fd79e122695ebde7d41fe327f) by Adam Janes
//Florin Pop youtube video
