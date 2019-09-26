function getLeaflet() {
    var map = L.map('map').setView([33.749038, -84.388466], 17);

	/*
        var OpenStreetMap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
			minZoom: 11,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
        }).addTo(map);
	*/

		var sw1000 = L.latLng(33.63298531, -84.51696580),
			ne1000 = L.latLng(33.93379544, -84.21603335),
			bounds1000 = L.latLngBounds(sw1000, ne1000);

		var sw200 = L.latLng(33.73327062, -84.41714544),
			ne200 = L.latLng(33.78337253, -84.31633406),
			bounds200 = L.latLngBounds(sw200, ne200);

		map.options.maxBounds = L.latLngBounds(new L.latLng(33.53, -84.61), new L.latLng(34.03, -84.11));

        base1000= L.tileLayer('http://tilemaps.s3-website-us-east-1.amazonaws.com/ATL28_200-1000mosaic/{z}/{x}/{y}.png', {
			bounds: bounds1000,
			minZoom: 11,
			maxNativeZoom: 16,
			maxZoom: 20
        }).addTo(map);

        base = L.tileLayer('http://tilemaps.s3-website-us-east-1.amazonaws.com/ATL1928_200mosaic3/{z}/{x}/{y}.png', {
			bounds: bounds200,
            minZoom: 14,
			maxNativeZoom: 19,
			maxZoom: 20
        }).addTo(map); 

        var myStyle = {
        "color": "#000000",
        "weight": 5,
        "opacity": 1
        };
        var manhole = L.icon({
            iconUrl: './assets/manhole.png',

            iconSize:     [20, 20], // size of the icon
            iconAnchor:   [10, 10], // point of the icon which will correspond to marker's location
        });
        
        
        var manholes = L.layerGroup([]);
		var markerClusters = L.markerClusterGroup();
        
		var manholedata = $.getJSON('http://atlanta.urbanspatialhistory.org/js/features.json', function(manholedata) {
			//console.log(JSON.stringify(manholedata));
			for (var i = 0; i < manholedata.features.length; i++) {
				var popupContent = '<b>Utility Hole</b>'; 
				if (manholedata.features[i].properties.name_st != "") {
					popupContent += '<br />Located on ' + manholedata.features[i].properties.name_st;
				} if (manholedata.features[i].properties.man_elev != "") {
					popupContent += `<br />Elevation: ${manholedata.features[i].properties.man_elev}ft`;
				}
				var m = L.marker(new L.latLng(manholedata.features[i].geometry.coordinates[1], manholedata.features[i].geometry.coordinates[0]), {icon: manhole}).bindTooltip(popupContent, {offset: new L.Point(-15, 0), direction: 'left'});
				m.on('mouseover', function() {
					this.openTooltip();
				});
				m.on('mouseout', function() {
					this.closeTooltip();
				});
				//console.log(manholedata.features[i].id);
				markerClusters.addLayer(m);
			}

			markerClusters.addTo(manholes);
		});
        
        var boundary = L.layerGroup([]);
        
        fetch("https://geoserver.ecds.emory.edu/ATLMaps/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ATLMaps:Atlanta%20City%20Limits&outputFormat=application%2Fjson")
		//fetch("https://geoserver.ecds.emory.edu/OpenWorldAtlanta/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=OpenWorldAtlanta:Atlanta1928_RoadSystem&outputFormat=application%2Fjson")
		.then(function(response) {
            return response.json();
        })
        .then(function(myJson) {
            geojsonLayer = new L.GeoJSON(myJson, 
                {color: 'black',
                opacity: 1,
                weight: 2,
                fillOpacity: 0,
                onEachFeature: function (feature, layer) {
					layer.on({
						click: function populate() {
						}
					});
				}})
            .addTo(boundary);
        });
        
        
        //boundary.addTo(map);
        
        
        var roads = L.layerGroup([]);
        
        //fetch("https://geoserver.ecds.emory.edu/OpenWorldAtlanta/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=OpenWorldAtlanta:Atlanta1928_RoadSystem&outputFormat=application%2Fjson")
		fetch("https://geoserver.ecds.emory.edu/OpenWorldAtlanta/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=OpenWorldAtlanta:Atlanta1928_RoadSystem&BBOX=-84.41714544,33.73327062,-84.31633406,33.78337253&outputFormat=application%2Fjson")
		.then(function(response) {
            return response.json();
        }).then(function(myJson) {
            geojsonLayer = new L.GeoJSON(myJson, 
                {color: 'black',
				interactive: false,
				smoothFactor: 3.0,
                opacity: 0,
                weight: 3,
                fillOpacity: 0,
                onEachFeature: function(feature, layer) {
					layer.setText(feature.properties.ROAD_NAME, {repeat: false});
                    layer.on({
                        click: function populate() {
							var roadData = "Road Name";

							if (feature.properties.ROAD_NAME != "") {
								if (feature.properties.FRADDR > 0 && feature.properties.TOADDR > 0) {
									var smaller = (feature.properties.FRADDR > feature.properties.TOADDR)? feature.properties.TOADDR : feature.properties.FRADDR;
									var larger = (smaller == feature.properties.FRADDR)? feature.properties.TOADDR : feature.properties.FRADDR;

									roadData += `: <b>${smaller}-${larger} ${feature.properties.ROAD_NAME}</b>`;
								} else 
									roadData += `: <b>${feature.properties.ROAD_NAME}</b>`;
							} else 
								roadData += ": <b>unknown</b>";

							if (feature.properties.Shape_Leng > 0) 
								roadData += `<br />Road Length: <b>${feature.properties.Shape_Leng}ft</b>`;

							document.getElementById('popinfo').innerHTML = roadData;
                        }
                    });}
                })
            .addTo(roads);
        });
        
        var layergroups = {
            "Utility Holes": manholes,
            "City Bounds": boundary,
            "Roads": roads
        };
        
        var control = L.control.layers(null, layergroups, { position: 'topright', collapsed: false, sortLayers: true });
        control.addTo(map);

		$(".leaflet-control-layers-overlays").prepend("<label>Available layers</label>");

		map.on("zoomend", function() {
			var zoom = map.getZoom();
			console.log(zoom);
		});

	L.control.scale().addTo(map);
         
    return map;
}
