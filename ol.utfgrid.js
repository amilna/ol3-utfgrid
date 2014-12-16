ol.utfGrid = function(opt_options) {  
	var options = this.isObj(opt_options) ? opt_options : {};
	this.data = {};	
	this.url = this.isObj(options.url) ? options.url : null;
	this.map = this.isObj(options.map) ? options.map : null;			
	
	if (this.map != null)
	{
		this.map.utfGrids = (this.isObj(this.map.utfGrids)?this.map.utfGrids:[]);
		this.map.utfGrids.push(this);
		if (this.isObj(this.map.utfGridMoveEndKey)) {		
			this.map.unByKey(this.map.utfGridMoveEndKey);
		}	
		this.map.utfGridMoveEndKey = this.map.on('moveend', this.fetch);
		
		if (this.isObj(this.map.utfGridPointerMoveKey)) {		
			this.map.unByKey(this.map.utfGridPointerMoveKey);
		}	
		
		this.map.utfGridPointerMoveKey = this.map.on('pointermove', this.onMove);		
	}	
}; 

ol.utfGrid.prototype.addTo = function(map)
{ 
	if (this.isObj(map))
	{
		this.map = map;
		map.utfGrids = (this.isObj(map.utfGrids)?map.utfGrids:[]);
		map.utfGrids.push(this);
		if (this.isObj(map.utfGridMoveEndKey))
		{		
			map.unByKey(map.utfGridMoveEndKey);
		}
		map.utfGridMoveEndKey = map.on('moveend', this.fetch);
		
		if (this.isObj(map.utfGridPointerMoveKey)) {		
			map.unByKey(map.utfGridPointerMoveKey);
		}	
		
		map.utfGridPointerMoveKey = map.on('pointermove', this.onMove);		
		return true;
	}	
	else
	{
		return false;
	}
};

ol.utfGrid.prototype.isObj = function(obj)
{
	return (typeof obj != "undefined"?true:false);
};	

ol.utfGrid.prototype.getUrl = function(url,success,err,params)
{
	params = (typeof params != "undefined"?params:[]);
	
	var xmlhttp;
	if (window.XMLHttpRequest)
	{// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}
	else
	{// code for IE6, IE5
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			if (typeof success != "undefined")
			{				
				success(xmlhttp.responseText,params,xmlhttp);
			}				
		}
		else
		{
			if (typeof err != "undefined")
			{
				err(xmlhttp.responseText,params,xmlhttp);
			}	
		}
	}
	xmlhttp.open("GET",url,true);
	xmlhttp.send();
};

ol.utfGrid.prototype.grid = function(grid)
{	
	return grid;
};

ol.utfGrid.prototype.fixLonlat = function(lonlat)
{ 	
	lonlat[0] = (lonlat[0]%180 != lonlat[0]%360?(lonlat[0]>180?(-1)*(180-lonlat[0]%180):180+lonlat[0]%180):lonlat[0]%180);
	lonlat[1] = (lonlat[1]%90 != lonlat[1]%180?90+(lonlat[1]>90?(-1)*(90-lonlat[1]%90):90+lonlat[1]%90):lonlat[1]%90);
	
	return lonlat;
};	

ol.utfGrid.prototype.fetch = function(evt)
{ 	
	var map = evt.map;	
	var extent = map.getView().calculateExtent(map.getSize());
	var center = map.getView().getCenter();
	var ddbox = ol.proj.transform(extent,
	  'EPSG:3857', 'EPSG:4326');
	  
	var ddctr = ol.proj.transform(center,
	  'EPSG:3857', 'EPSG:4326');  
	  
	var zoom = map.getView().getZoom(); 
	
	var utfGrids = map.utfGrids;
	var tile = [];
		
	for (var g=0;g<utfGrids.length;g++)
	{				
		var ug = utfGrids[g];		
		
		min = ug.fixLonlat([ddbox[0],ddbox[1]]);
		max = ug.fixLonlat([ddbox[2],ddbox[3]]);
		ctr = ug.fixLonlat(ddctr);				
		
		if (ctr[0] < min[0] || ctr[0] > max[0])
		{
			min = [-180,min[1]];
			max = [180,max[1]];
		}
		
		var g0 = ug.lonlat2tile([min[0],min[1]],zoom);
		var g1 = ug.lonlat2tile([(max[0]<min[0]?180:max[0]),(max[1]<min[1]?-85.0551:max[1])],zoom);
		var g2 = ug.lonlat2tile([(max[0]<min[0]?-180:max[0]),(max[1]<min[1]?85.0551:max[1])],zoom);
		var g3 = ug.lonlat2tile([max[0],max[1]],zoom);				
		
		if (!ug.isObj(ug.data[zoom]))
		{
			ug.data[zoom] = [];
		}				
		
		var grid = ug.grid;
		var tiles = [];
		
		for(var x = g0[0];x<=g1[0];x++)
		{									
			if (!ug.isObj(ug.data[zoom][x]))
			{
				ug.data[zoom][x] = [];
			}			
			for(var y = g0[1];y>=g1[1];y--)
			{											
				if (!ug.isObj(ug.data[zoom][x][y]))
				{															
					ug.data[zoom][x][y] = {};
					var tile = [zoom,x,y];
					if (tiles.indexOf(tile) < 0)
					{
						tiles.push(tile);						
					}
				}
			}	
		}		
		for(var x = g2[0];x<=g3[0];x++)
		{						
			if (!ug.isObj(ug.data[zoom][x]))
			{
				ug.data[zoom][x] = [];
			}			
			for(var y = Math.max(0,g2[1]);y>=g3[1];y--)
			{											
				if (!ug.isObj(ug.data[zoom][x][y]))
				{															
					ug.data[zoom][x][y] = {};
					var tile = [zoom,x,y];
					if (tiles.indexOf(tile) < 0)
					{
						tiles.push(tile);											
					}
				}
			}	
		}
		//console.log(tiles,min,max,ctr,g0,g1,g2,g3);		
		for(var t = 0;t<tiles.length;t++)
		{
			var tile = tiles[t];			
			ug.getUrl(ug.url.replace("{z}",tile[0]).replace("{x}",tile[1]).replace("{y}",tile[2]),
				function(jsonp,params,request){					
					var dug = params[0];
					var tile = params[1];
					dug.data[tile[0]][tile[1]][tile[2]] = eval(jsonp);							
					//console.log(tile,dug.data[tile[0]][tile[1]][tile[2]]);
				},
				function(jsonp,tile){					
				},
				[ug,tile]
			);		
		}												
	}
	
};

ol.utfGrid.prototype.lon2xtile = function(lon,zoom)
{ 
	return (lon+180)/360*Math.pow(2,zoom);
};

ol.utfGrid.prototype.lat2ytile = function(lat,zoom)
{ 
	return (1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom);
};

ol.utfGrid.prototype.pix64 = function(n)
{ 
	return Math.floor((n-Math.floor(n))/1*64);
};

ol.utfGrid.prototype.lonlat2tile = function(lonlat,zoom)
{	
	var x = this.lon2xtile(lonlat[0],zoom);
	var xp = this.pix64(x);	
	var y = this.lat2ytile(lonlat[1],zoom);
	var yp = this.pix64(y);	
	return [Math.floor(x),Math.floor(y),xp,yp]; 
};

ol.utfGrid.prototype.getData = function(lonlat,ug) {	
	ug = (typeof ug != "undefined"?ug:this);
	var zoom = this.map.getView().getZoom();
	
	var g = ug.lonlat2tile(lonlat,zoom);				
	
	var d = null;
	if (ug.isObj(ug.data[zoom]))
	{
		if (ug.isObj(ug.data[zoom][g[0]]))
		{			
			var json = ug.data[zoom][g[0]][g[1]];   
			
			if (json != null && ug.isObj(json.grid))
			{		
				code = json.grid[g[3]].substr(g[2],1).charCodeAt(0);
				if (code >= 93) { code--};
				if (code >= 35) { code--};
				code -= 32;
				
				var d = json.data[json.keys[code]];		
			}
		}
	}		
	return d;	
};

ol.utfGrid.prototype.onMove = function(evt) {
	var lonlat = ol.proj.transform(evt.coordinate,
	  'EPSG:3857', 'EPSG:4326');				
	
	var data = [];
	var utfGrids = evt.map.utfGrids;
	
	for (var g=0;g<utfGrids.length;g++)
	{
		var ug = utfGrids[g];
		lonlat = ug.fixLonlat(lonlat);
		d = ug.getData(lonlat);
		data.push(d);					
	}			
	console.log(lonlat,data[0]);	
};	
