var map = L.map('map').setView([42.3314, -83.0458], 10);

L.tileLayer('https://api.mapbox.com/styles/v1/nelsjosi/clpwvdxqf008n01mr803hd38m/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmVsc2pvc2kiLCJhIjoiY2xvdXJpcTlyMGlnbDJqbzZnYzBpaDJwdyJ9.TFehieFMapa9HP0UJgkETg', {
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Function to get color based on ethnicity
var getColor = function (feature) {
    if (!feature.properties.B03002_001) {
        return '#808080'; // Gray for no data
    }

    var blackPercentage = (feature.properties.AA / feature.properties.B03002_001) * 100;
    var whitePercentage = (feature.properties.White / feature.properties.B03002_001) * 100;
    var hispanicPercentage = (feature.properties.Hispanic / feature.properties.B03002_001) * 100;

    if (blackPercentage > whitePercentage && blackPercentage > hispanicPercentage) {
        return '#FA8072'; // Salmon pink for majority black
    } else if (hispanicPercentage > whitePercentage && hispanicPercentage > blackPercentage) {
        return '#800080'; // Royal purple for majority hispanic
    } else if (whitePercentage > blackPercentage && whitePercentage > hispanicPercentage) {
        return '#32127A'; // Dark purple for majority white
    } else {
        return '#808080'; // Gray for no majority ethnicity
    }
};

var selectedLayer = null;

// Function to add GeoJSON layer
function addGeoJsonLayer(url, colorProperty, isFacility) {
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            var geojsonLayer = L.geoJson(data, {
                style: function (feature) {
                    return {
                        fillColor: isFacility ? 'red' : getColor(feature),
                        weight: 2,
                        opacity: 1,
                        color: isFacility ? 'red' : 'gray',
                        dashArray: isFacility ? '' : '3',
                        fillOpacity: 0.7
                    };
                },
                pointToLayer: function (feature, latlng) {
                    if (isFacility) {
                        return L.marker(latlng, {
                            icon: L.icon({
                                iconUrl: 'https://cdn.pixabay.com/photo/2014/04/03/10/33/factory-310848_1280.png',
                                iconSize: [16, 16],
                                iconAnchor: [16, 16],
                                popupAnchor: [0, -16]
                            })
                        }).bindPopup(`<b>${feature.properties.SiteSpecificName}</b><br>${feature.properties.Address}, ${feature.properties.City}, ${feature.properties.County}`);
                    }
                },
                onEachFeature: function (feature, layer) {
                    if (!isFacility) {
                        var popupContent = `<b>${feature.properties.RaceEthnic}</b><br>`;
                        for (var key in feature.properties) {
                            popupContent += `<b>${key}:</b> ${feature.properties[key]}<br>`;
                        }
                        layer.bindPopup(popupContent);
                        layer.on({
                            click: function (e) {
                                if (selectedLayer) {
                                    resetHighlight(selectedLayer);
                                }
                                highlightFeature(e);
                                selectedLayer = e.target;
                            }
                        });
                    }
                }
            }).addTo(map);
        });
}

// Add GeoJSON layer for Race/Ethnicity data
addGeoJsonLayer('https://raw.githubusercontent.com/nelsjosi/oh-my/main/Race_Ethnicity_Block_Group_2015.geojson', 'B03002_001', false)
    .then(() => console.log('Race_Ethnicity_Block_Group_2015.geojson loaded successfully'))
    .catch(error => console.error('Error loading Race_Ethnicity_Block_Group_2015.geojson:', error));

// Add GeoJSON layer for hazardous waste facilities
addGeoJsonLayer('https://raw.githubusercontent.com/nelsjosi/oh-my/main/Michigan_Hazardous_Waste_Treatment%252C_Storage%252C_and_Disposal_Facilities.geojson', 'FacilityScore', true)
    .then(() => console.log('Michigan_Hazardous_Waste_Treatment%2C_Storage%2C_and_Disposal_Facilities.geojson loaded successfully'))
    .catch(error => console.error('Error loading Michigan_Hazardous_Waste_Treatment%2C_Storage%2C_and_Disposal_Facilities.geojson:', error));

// Add GeoJSON layer for Treatment, Storage, Disposal Facilities
addGeoJsonLayer('https://raw.githubusercontent.com/nelsjosi/oh-my/main/Treatment_Storage_Disposal_Facilities_-_Part_111.geojson', 'PermitWorkLoad', true)
    .then(() => console.log('Treatment_Storage_Disposal_Facilities_-_Part_111.geojson loaded successfully'))
    .catch(error => console.error('Error loading Treatment_Storage_Disposal_Facilities_-_Part_111.geojson:', error));

// Add Legend
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        ethnicities = ['No Data', 'Majority Black', 'Majority White', 'Majority Hispanic'],
        colors = ['#808080', '#FA8072', '#32127A', '#800080'];

    for (var i = 0; i < ethnicities.length; i++) {
        div.innerHTML +=
            '<i style="background:' + colors[i] + '"></i> ' +
            ethnicities[i] + '<br>';
    }

    return div;
};

legend.addTo(map);

// Add Search Control to the map
var searchControl = L.control({ position: 'bottomleft' });

searchControl.onAdd = function (map) {
    var container = L.DomUtil.create('div', 'search-container');
    container.innerHTML = '<input type="text" id="search-input" placeholder="Enter address">' +
                          '<button onclick="searchLocation()">Search</button>';
    return container;
};

searchControl.addTo(map);

// Search functionality
function searchLocation() {
    var searchInput = document.getElementById('search-input').value;
    var searchUrl = 'https://nominatim.openstreetmap.org/search?format=json&q=' + searchInput;

    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                var latlng = [data[0].lat, data[0].lon];
                map.panTo(latlng);
                if (selectedLayer) {
                    resetHighlight(selectedLayer);
                }
                selectedLayer = L.marker(latlng).addTo(map);
            } else {
                alert('Location not found');
            }
        })
        .catch(error => console.error('Error searching location:', error));
}

// Function to reset highlight
function resetHighlight(layer) {
    layer.setStyle({
        weight: 2,
        opacity: 1,
        color: 'gray',
        dashArray: '3',
        fillOpacity: 0.7
    });
}

// Function to highlight feature
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}
