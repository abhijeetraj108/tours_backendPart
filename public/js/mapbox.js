let locations = JSON.parse(document.getElementById('map').dataset.location)
console.log(locations);

mapboxgl.accessToken =
'pk.pk.eyJ1IjoiYmlsdHVhazEwOCIsImEiOiJjbHR5Nzl3OXQwY3B1MmpzMWdkdjJnOXptIn0.DJk-V2ccSOciBmcKow6hWA.ytpI7V7w7cyT1Kq5rT9Z1A';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jonasschmedtmann/cjvi9q8jd04mi1cpgmg7ev3dy',
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
  });