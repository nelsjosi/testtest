var map = L.map('map').setView([42.3314, -83.0458], 10);

L.tileLayer('https://api.mapbox.com/styles/v1/nelsjosi/clq1pq8wh00m401re3kqifpn5/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmVsc2pvc2kiLCJhIjoiY2xvdXJpcTlyMGlnbDJqbzZnYzBpaDJwdyJ9.TFehieFMapa9HP0UJgkETg', {
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


// Function to get color based on ethnicity
var getColor = function (feature) {
    if (!feature.properties.B03002_001) {
        return 'rgb(169,169,169)'; // Gray for no data
    }

    var blackPercentage = (feature.properties.AA / feature.properties.B03002_001) * 100;
    var whitePercentage = (feature.properties.White / feature.properties.B03002_001) * 100;
    var hispanicPercentage = (feature.properties.Hispanic / feature.properties.B03002_001) * 100;

    if (blackPercentage > whitePercentage && blackPercentage > hispanicPercentage) {
        return 'rgb(255,215,0)'; // Gold for majority black
    } else if (hispanicPercentage > whitePercentage && hispanicPercentage > blackPercentage) {
        return 'rgb(255,99,71)'; // Tomato red for majority hispanic
    } else if (whitePercentage > blackPercentage && whitePercentage > hispanicPercentage) {
        return 'rgb(50,205,50)'; // Lime green for majority white
    } else {
        return 'rgb(169,169,169)'; // Gray for no majority ethnicity
    }
};

// Adjusted colors for color blindness
var gold = 'rgb(255,215,0)';
var tomatoRed = 'rgb(255,99,71)';
var limeGreen = 'rgb(50,205,50)';

var getColorForColorBlind = function (feature) {
    if (!feature.properties.B03002_001) {
        return 'rgb(169,169,169)'; // Gray for no data
    }

    var blackPercentage = (feature.properties.AA / feature.properties.B03002_001) * 100;
    var whitePercentage = (feature.properties.White / feature.properties.B03002_001) * 100;
    var hispanicPercentage = (feature.properties.Hispanic / feature.properties.B03002_001) * 100;

    if (blackPercentage > whitePercentage && blackPercentage > hispanicPercentage) {
        return gold;
    } else if (hispanicPercentage > whitePercentage && hispanicPercentage > blackPercentage) {
        return tomatoRed;
    } else if (whitePercentage > blackPercentage && whitePercentage > hispanicPercentage) {
        return limeGreen;
    } else {
        return 'rgb(169,169,169)'; // Gray for no majority ethnicity
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
                                iconUrl: 'https://www.clipartbest.com/cliparts/aiq/6bE/aiq6bEE9T.png',
                                iconSize: [16, 16],
                                iconAnchor: [16, 16],
                                popupAnchor: [0, -16]
                            })
                        }).bindPopup(`<b>${feature.properties.SiteSpecificName}</b><br>${feature.properties.Address}, ${feature.properties.City}, ${feature.properties.County}`);
                    }
                },
                onEachFeature: function (feature, layer) {
                    if (isFacility) {
                        // Display only the waste facility data
                        layer.bindPopup(`<b>${feature.properties.SiteSpecificName}</b><br>${feature.properties.Address}, ${feature.properties.City}, ${feature.properties.County}`);
                    } else {
                        // Display only the top 3 ethnicities
                        var topEthnicities = getTopEthnicities(feature.properties);
                        var popupContent = `<b>${feature.properties.RaceEthnic}</b><br>`;
                        topEthnicities.forEach(ethnicity => {
                            popupContent += `<b>${ethnicity.label}:</b> ${ethnicity.value}<br>`;
                        });

                        // Change "Go to Form" button text and link
                        popupContent += `<br><button onclick="openForm('${feature.id}')"><a href="https://www.surveymonkey.com/r/W5ZGBBJ" target="_blank">Go to Community Impact Survey Form</a></button>`;

                        layer.bindPopup(popupContent);
                    }

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
        ethnicities = ['No Data', 'Majority Black', 'Majority White', 'Majority Hispanic or Latino'],
        colors = ['#AAAAAA', '#FFD700', '#00FF00', '#FF6347'];

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

                // Set the zoom level and pan to the searched location
                map.setView(latlng, 14);

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

// Function to get the top 3 ethnicities
function getTopEthnicities(properties) {
    var ethnicityData = [
        { label: 'White', value: properties.White },
        { label: 'Black', value: properties.AA },
        { label: 'Hispanic', value: properties.Hispanic }
        // Add more ethnicities as needed
    ];

    // Sort by value in descending order
    ethnicityData.sort((a, b) => b.value - a.value);

    // Return the top 3 ethnicities
    return ethnicityData.slice(0, 3);
}
