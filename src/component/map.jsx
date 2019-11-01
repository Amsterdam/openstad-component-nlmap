import React from 'react';
import ReactDOM from 'react-dom';
import OpenStadComponent from 'openstad-component/src/index.jsx';

'use strict';

export default class OpenStadComponentNLMap extends OpenStadComponent {

  constructor(props) {

    super(props);

		var self = this;

		// config
		let defaultConfig = {
			target: self.divId,
			style: 'standaard',
			marker: false,
			search: false,
			center: {
				latitude: 52.37104644463586,
				longitude: 4.900402911007405,
			},
			zoom: 14,
			zoomposition     : 'bottomleft',
			disableDefaultUI : true,
			polygon : null,
			autoZoomAndCenter: false,
			// onQueryResult: self.onQueryHandler
		};
		self.config = Object.assign(defaultConfig, self.config || {})

		// external css and script files
		self._loadedFiles = 0;
		self.files = [
			{ type: 'css', href: "https://unpkg.com/leaflet@1.0.3/dist/leaflet.css" },
			{ type: 'script', src: "https://unpkg.com/leaflet@1.0.3/dist/leaflet.js" },
		];
		switch(self.config.variant) {
			case "amaps":
				// self.files.push({ type: 'css', href: "https://map.data.amsterdam.nl/dist/css/ams-map.css"}); // in tegenstelling tot wat ze beloven overschrijft dit ook css buiten de map
				self.files.push({ type: 'script', src: "https://map.data.amsterdam.nl/dist/amaps.iife.js"});
				break;
			default:
				self.files.push({ type: 'css', href: "https://nlmaps.nl/dist/assets/css/nlmaps.css"});
				self.files.push({ type: 'script', src: "https://nlmaps.nl/dist/nlmaps.iife.js"});
		}
		self.files.push({ type: 'css', href: "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css"  });
		self.files.push({ type: 'script', src: "https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js" });

		self.markers = self.config.markers || [];
		
  }

	componentDidMount(prevProps, prevState) {
    this.loadNextFile();
	}

  loadNextFile() {
    var self = this;
    var file = self.files[self._loadedFiles];
    if (file) {
			let element;
			if (file.type === 'script') {
				element = document.createElement('script');
				element.src = file.src;
				element.async = true;
			}
			if (file.type === 'css') {
				element = document.createElement('link');
				element.href = file.href;
				element.rel = 'stylesheet';
			}
			if (element) {
				element.onload = function() {
          self.loadNextFile();
				}
				this.instance.appendChild(element);
			}
    }
		if (self._loadedFiles == self.files.length) {
			// loading script files is ready; create the map
			self.createMap();
			// dispatch an event
			var event = new Event('mapIsReady');
			self.mapIsReady = true;
			self.instance.dispatchEvent(event);
    }
		self._loadedFiles++;
  }

	createMap() {

		var self = this;

		// init map
		switch(self.config.variant) {
			case "amaps":
				self.map = amaps.createMap(self.config);
				break;
			default:
				self.map = nlmaps.createMap(self.config);
		}

		// clustering
		if (self.config.clustering && self.config.clustering.isActive && L.markerClusterGroup) {
			let iconCreateFunction = self.config.clustering.iconCreateFunction || self.createClusterIcon;
			if (iconCreateFunction && typeof iconCreateFunction == 'string') iconCreateFunction = eval(iconCreateFunction);
			self.markerClusterGroup = L.markerClusterGroup({iconCreateFunction, showCoverageOnHover: self.config.clustering.showCoverageOnHover, maxClusterRadius: self.config.clustering.maxClusterRadius || 80});
		  let onClusterClick = self.config.clustering.onClusterClick || self.onClusterClick;
			if (typeof onClusterClick == 'string') onClusterClick = eval(onClusterClick);
			self.markerClusterGroup.on('clusterclick', onClusterClick);
		  let onClusterAnimationEnd = self.config.clustering.onClusterAnimationEnd || self.onClusterAnimationEnd;
			if (typeof onClusterAnimationEnd == 'string') onClusterAnimationEnd = eval(onClusterAnimationEnd);
			self.markerClusterGroup.on('animationend', onClusterAnimationEnd);
			self.map.addLayer(self.markerClusterGroup);
		}
		
		// on map click
		if (self.config.onMapClick) {
			if (typeof self.config.onMapClick == 'string') self.config.onMapClick = eval(self.config.onMapClick);
		}
		self.map.on('click', self.config.onMapClick || self.onMapClick);

		// add polygon
		if (self.config.polygon) {
			self.createCutoutPolygon( self.config.polygon );
		}

		// add markers
		if (self.markers.length) {
			self.markers.forEach(function(marker) {
				self.addMarker( marker )
			})
		}

	  // set bounds and center
	  if (self.config.autoZoomAndCenter) {
		  var centerOn = ( self.config.autoZoomAndCenter == 'polygon' && self.config.polygon ) || ( self.markers && self.markers.length && self.markers );
		  if (self.editorMarker) {
			  if (self.editorMarker.position) {
				  centerOn = [self.editorMarker];
			  } else {
				  centerOn = self.config.polygon;
			  }
		  }
		  if (centerOn) {
			  self.setBoundsAndCenter( centerOn );
		  }
	  }

	}

	addMarkers(markerData) {
		var self = this;
    markerData.forEach((marker) => {
      self.addMarker(marker)
    });
  }

	addMarker(markerData) {

		var self = this;

		let icon = markerData.icon;
		if (!icon) {
			let iconCreateFunction = self.config.iconCreateFunction;
			if (iconCreateFunction && typeof iconCreateFunction == 'string') {
				iconCreateFunction = eval(iconCreateFunction);
				icon = iconCreateFunction();
			}
		}

		var marker;
		if (icon) {
			marker = L.marker([markerData.lat, markerData.lng], { icon });
		} else {
			marker = L.marker([markerData.lat, markerData.lng]);
		}

    marker.visible = true;
		marker.data = markerData.data;
		marker.doNotCluster = markerData.doNotCluster;

		if (markerData.href) {
			markerData.onClick = function() {
				document.location.href = markerData.href;
			}
		}
		let onClick = (markerData.onClick != null && markerData.onClick) || self.config.onMarkerClick || self.onMarkerClick;
		if (onClick) {
			if (typeof onClick == 'string') onClick = eval(onClick);
			marker.on('click', onClick);
		}

		if (self.markerClusterGroup && !markerData.doNotCluster) {
			self.markerClusterGroup.addLayer(marker);
		} else {
			self.map.addLayer(marker);
		}

		self.markers.push(marker);

		return marker;

	}

	removeMarker(marker) {
		this.map.removeLayer(marker);
  }

	updateMarker(marker, newData) {
    if (newData.location) {
      var newLatLng = new L.LatLng(newData.location.lat, newData.location.lng);
      marker.setLatLng(newLatLng); 
    }
  }

	createClusterIcon(cluster) {
		var count = cluster.getChildCount();
		return L.divIcon({ html: count, className: '', iconSize: L.point(20, 20), iconAnchor: [20, 10] });
	}

	createCutoutPolygon(polygon) {

		var self = this;

		// polygon must defined from the south west corner to work with the outer box
		var bounds = L.polygon(polygon).getBounds();
		var center = bounds.getCenter();

		var smallest = 0; var index = 0;

		polygon.forEach(function( point, i ) {
			var y = Math.sin(point.lng-center.lng) * Math.cos(point.lat);
			var x = Math.cos(center.lat)*Math.sin(point.lat) - Math.sin(center.lat)*Math.cos(point.lat)*Math.cos(point.lng-center.lng);
			var bearing = Math.atan2(y, x) * 180 / Math.PI;
			if (45 - bearing < smallest) {
				smallest = 45 - bearing;
				index = i;
			}
		});

		var a = polygon.slice(0, index - 1);
		var b = polygon.slice(index, polygon.length - 1);
		polygon = b.concat(a);

		// outer box
		// TODO: should be calculated dynamically from the center point
		var delta1 = 0.01;
		var delta2 = 5;
		var outerBox = [
			{lat: -90 + delta2, lng:  -180 + delta1 },
			{lat: -90 + delta2, lng:     0          },
			{lat: -90 + delta2, lng:   180 - delta1 },
			{lat:   0,          lng:   180 - delta1 },
			{lat:  90 - delta2, lng:   180 - delta1 },
			{lat:  90 - delta2, lng:     0          },
			{lat:  90 - delta2, lng:  -180 + delta1 },
			{lat:  90 - delta2, lng:  -180 + delta1 },
			{lat:   0,          lng:  -180 + delta1 },
		];

		// polygon style
		let polygonStyle = Object.assign({
			"color": "#d00",
			"fillColor": "#000",
			"fillOpacity": 0.15
		}, self.config.polygonStyle);

		let result = L.polygon([outerBox, polygon], polygonStyle);
    self.map.addLayer(result);

    return result;

	}

  removePolygon(polygon) {
	  var self = this;
    if (polygon) {
      self.map.removeLayer(polygon);
    }
  }

  setBoundsAndCenter( points ) {

	  var self = this;
	  points = points || [];

	  var poly = [];
	  points.forEach(function(point) {
		  if (point._latlng) {
			  point = point._latlng;
		  }
		  if (point.position) {
			  point = point.position.coordinates ? { lat: point.position.coordinates[0], lng: point.position.coordinates[1] }  : point.position;
		  }
		  poly.push(point);
	  })

	  points.forEach(function(point) {
		  poly.push(point);
	  })

	  var bounds = L.latLngBounds(poly);
	  self.map.fitBounds(bounds);

	  var zoom = parseInt(self.map.getZoom())

  }

  showMarker(marker) {
	  var self = this;
    marker.visible = true;
	  if (self.markerClusterGroup && !marker.doNotCluster) {
		  self.markerClusterGroup.addLayer(marker);
	  } else {
		  marker.addTo(self.map)
	  }
  }

  hideMarker(marker) {
	  var self = this;
    marker.visible = false;
	  if (self.markerClusterGroup && !marker.doNotCluster) {
		  self.markerClusterGroup.removeLayer(marker);
	  } else {
		  marker.remove(self.map)
	  }
  }

  setFilter(filterFuntion) {
	  var self = this;
	  self.filterFunction = filterFuntion;
	  self.applyFilter();
  }

  applyFilter() {
	  var self = this;
	  if (self.filterFunction) {
		  self.markers.forEach(function(marker) {
			  if ( self.filterFunction(marker) ) {
				  self.showMarker(marker);
			  } else {
				  self.hideMarker(marker);
			  }
		  });
	  } else {
		  self.markers.forEach(function(marker) {
			  self.showMarker(marker);
		  });
	  }
  }

	onMapClick() {
    // placeholder
  }

	onMarkerClick() {
    // placeholder
  }

	onClusterClick() {
    // placeholder
  }

	onClusterAnimationEnd() {
    // placeholder
  }

	render() {

    return (
			<div id={this.divId} className={this.props.className || 'openstad-component-nlmap'} ref={el => (this.instance = el)}>
				<div id={this.divId + '-map'}></div>
			</div>
    );

  }

}
