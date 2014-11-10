ol3-utfgrid
===========

UTF Grid support for OpenLayers 3

API
-----------------

1. constructor <code>new ol.utfGrid({"map":ol.Map,"url":"utfgrid_url_source"})</code>
2. getData methods <code>ol.utfGrid.getData(lonlat)</code>
3. customize default onMove methods <code>new ol.utfGrid({"url":"utfgrid_url_source"}) ; ol.utfGrid.onMove = function(evt){console.log(evt.coordinate)}; ol.utfGrid.addTo(ol.Map);</code>

<p>Please see index.html for complete usage example. See http://cara.amilna.com/ol3-utfgrid for demo<p>


