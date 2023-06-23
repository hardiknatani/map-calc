import { union } from "@turf/turf";
export class TileUtils{

    private d2r = Math.PI / 180
    private r2d = 180 / Math.PI;


     tileToQuadkey(tile) {
        var index = '';
        for (var z = tile[2]; z > 0; z--) {
            var b = 0;
            var mask = 1 << (z - 1);
            if ((tile[0] & mask) !== 0) b++;
            if ((tile[1] & mask) !== 0) b += 2;
            index += b.toString();
        }
        return index;
    }
    private pointToTileFraction(lon, lat, z) {
        var sin = Math.sin(lat * this.d2r),
            z2 = Math.pow(2, z),
            x = z2 * (lon / 360 + 0.5),
            y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);
    
        // Wrap Tile X
        x = x % z2;
        if (x < 0) x = x + z2;
        return [x, y, z];
    }

    pointToTile(lon, lat, z) {
        var tile = this.pointToTileFraction(lon, lat, z);
        tile[0] = Math.floor(tile[0]);
        tile[1] = Math.floor(tile[1]);
        return tile;
    }


     getTiles(geom, limits) {
        var i, tile,
            coords = geom.coordinates,
            maxZoom = limits.max_zoom,
            tileHash = {},
            tiles = [];
    
        if (geom.type === 'Point') {
            return [this.pointToTile(coords[0], coords[1], maxZoom)];
    
        }
         else if (geom.type === 'MultiPoint') {
            for (i = 0; i < coords.length; i++) {
                tile = this.pointToTile(coords[i][0], coords[i][1], maxZoom);
                tileHash[this.toID(tile[0], tile[1], tile[2])] = true;
            }
        } 
        // else if (geom.type === 'LineString') {
        //     this.lineCover(tileHash, coords, maxZoom);
    
        // }
        //  else if (geom.type === 'MultiLineString') {
        //     for (i = 0; i < coords.length; i++) {
        //         this.lineCover(tileHash, coords[i], maxZoom);
        //     }
        // } 
        else if (geom.type === 'Polygon') {
            this.polygonCover(tileHash, tiles, coords, maxZoom);
    
        } else if (geom.type === 'MultiPolygon') {
            for (i = 0; i < coords.length; i++) {
                this.polygonCover(tileHash, tiles, coords[i], maxZoom);
            }
        } else {
            throw new Error('Geometry type not implemented');
        }
    
        if (limits.min_zoom !== maxZoom) {
            // sync tile hash and tile array so that both contain the same tiles
            var len = tiles.length;
            this.appendHashTiles(tileHash, tiles);
            for (i = 0; i < len; i++) {
                var t = tiles[i];
                tileHash[this.toID(t[0], t[1], t[2])] = true;
            }
            return this.mergeTiles(tileHash, tiles, limits);
        }
    
        this.appendHashTiles(tileHash, tiles);
        return tiles;
    }

 generateBufferCircle(latitude, longitude, radiusInMeters) {
  const earthRadius = 6371000; // Radius of the Earth in meters

  // Convert the radius from meters to radians
  const radiusInRadians = radiusInMeters / earthRadius;

  // Convert latitude and longitude to radians
  const latInRadians = latitude * (Math.PI / 180);
  const lonInRadians = longitude * (Math.PI / 180);

  const bufferPoints:any = [];

  // Generate points along the circumference of the circle
  for (let i = 0; i <= 360; i++) {
    const angleInRadians = i * (Math.PI / 180);

    const lat = Math.asin(
      Math.sin(latInRadians) * Math.cos(radiusInRadians) +
        Math.cos(latInRadians) * Math.sin(radiusInRadians) * Math.cos(angleInRadians)
    );

    const lon =
      lonInRadians +
      Math.atan2(
        Math.sin(angleInRadians) * Math.sin(radiusInRadians) * Math.cos(latInRadians),
        Math.cos(radiusInRadians) - Math.sin(latInRadians) * Math.sin(lat)
      );

    // Convert the lat and lon back to degrees
    const latInDegrees = lat * (180 / Math.PI);
    const lonInDegrees = lon * (180 / Math.PI);

    bufferPoints.push([lonInDegrees, latInDegrees]);
  }

  // Create GeoJSON object
  const geoJson = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [bufferPoints],
    },
    properties: {},
  };

  return geoJson;
}
     calculateBoundingBox(geometry) {
        // Initialize variables with extreme values
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
      
        // Helper function to update the bounding box coordinates
        function updateBoundingBoxCoordinates(x, y) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      
        // Recursive function to iterate over geometry coordinates
        function processCoordinates(coordinates) {
          if (Array.isArray(coordinates)) {
            if (Array.isArray(coordinates[0])) {
              for (let i = 0; i < coordinates.length; i++) {
                processCoordinates(coordinates[i]);
              }
            } else if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
              updateBoundingBoxCoordinates(coordinates[0], coordinates[1]);
            }
          }
        }
      
        // Process different geometry types
        switch (geometry.type) {
          case 'Point':
            updateBoundingBoxCoordinates(geometry.coordinates[0], geometry.coordinates[1]);
            break;
          case 'MultiPoint':
          case 'LineString':
          case 'Polygon':
            processCoordinates(geometry.coordinates);
            break;
          case 'MultiLineString':
          case 'MultiPolygon':
            for (let i = 0; i < geometry.coordinates.length; i++) {
              processCoordinates(geometry.coordinates[i]);
            }
            break;
          case 'GeometryCollection':
            for (let i = 0; i < geometry.geometries.length; i++) {
              this.calculateBoundingBox(geometry.geometries[i]);
            }
            break;
          default:
            throw new Error('Unsupported geometry type: ' + geometry.type);
        }
        // Return the calculated bounding box
        return [minX, minY, maxX, maxY];
      }

     private mergeTiles(tileHash, tiles, limits) {
        var mergedTiles:any = [];
    
        for (var z = limits.max_zoom; z > limits.min_zoom; z--) {
    
            var parentTileHash = {};
            var parentTiles:any = [];
    
            for (var i = 0; i < tiles.length; i++) {
                var t = tiles[i];
    
                if (t[0] % 2 === 0 && t[1] % 2 === 0) {
                    var id2 = this.toID(t[0] + 1, t[1], z),
                        id3 = this.toID(t[0], t[1] + 1, z),
                        id4 = this.toID(t[0] + 1, t[1] + 1, z);
    
                    if (tileHash[id2] && tileHash[id3] && tileHash[id4]) {
                        tileHash[this.toID(t[0], t[1], t[2])] = false;
                        tileHash[id2] = false;
                        tileHash[id3] = false;
                        tileHash[id4] = false;
    
                        var parentTile = [t[0] / 2, t[1] / 2, z - 1];
    
                        if (z - 1 === limits.min_zoom) mergedTiles.push(parentTile);
                        else {
                            parentTileHash[this.toID(t[0] / 2, t[1] / 2, z - 1)] = true;
                            parentTiles.push(parentTile);
                        }
                    }
                }
            }
    
            for (i = 0; i < tiles.length; i++) {
                t = tiles[i];
                if (tileHash[this.toID(t[0], t[1], t[2])]) mergedTiles.push(t);
            }
    
            tileHash = parentTileHash;
            tiles = parentTiles;
        }
    
        return mergedTiles;
    }

    private  polygonCover(tileHash, tileArray, geom, zoom) {
        var intersections = [];
    
        for (var i = 0; i < geom.length; i++) {
            var ring = [];
            this.lineCover(tileHash, geom[i], zoom, ring);
    
            for (var j = 0, len = ring.length, k = len - 1; j < len; k = j++) {
                var m = (j + 1) % len;
                var y = ring[j][1];
    
                // add interesction if it's not local extremum or duplicate
                if ((y > ring[k][1] || y > ring[m][1]) && // not local minimum
                    (y < ring[k][1] || y < ring[m][1]) && // not local maximum
                    y !== ring[m][1]) intersections.push(ring[j]);
            }
        }
    
        intersections.sort(this.compareTiles); // sort by y, then x
    
        for (i = 0; i < intersections.length; i += 2) {
            // fill tiles between pairs of intersections
            y = intersections[i][1];
            for (var x = intersections[i][0] + 1; x < intersections[i + 1][0]; x++) {
                var id = this.toID(x, y, zoom);
                if (!tileHash[id]) {
                    tileArray.push([x, y, zoom]);
                }
            }
        }
    }
    
    private  compareTiles(a, b) {
        return (a[1] - b[1]) || (a[0] - b[0]);
    }
    
    private  lineCover(tileHash, coords, maxZoom, ring) {
        var prevX, prevY;
        var y;
    
        for (var i = 0; i < coords.length - 1; i++) {
            var start = this.pointToTileFraction(coords[i][0], coords[i][1], maxZoom),
                stop = this.pointToTileFraction(coords[i + 1][0], coords[i + 1][1], maxZoom),
                x0 = start[0],
                y0 = start[1],
                x1 = stop[0],
                y1 = stop[1],
                dx = x1 - x0,
                dy = y1 - y0;
    
            if (dy === 0 && dx === 0) continue;
    
            var sx = dx > 0 ? 1 : -1,
                sy = dy > 0 ? 1 : -1,
                x = Math.floor(x0),
                y:any = Math.floor(y0),
                tMaxX = dx === 0 ? Infinity : Math.abs(((dx > 0 ? 1 : 0) + x - x0) / dx),
                tMaxY = dy === 0 ? Infinity : Math.abs(((dy > 0 ? 1 : 0) + y - y0) / dy),
                tdx = Math.abs(sx / dx),
                tdy = Math.abs(sy / dy);
    
            if (x !== prevX || y !== prevY) {
                tileHash[this.toID(x, y, maxZoom)] = true;
                if (ring && y !== prevY) ring.push([x, y]);
                prevX = x;
                prevY = y;
            }
    
            while (tMaxX < 1 || tMaxY < 1) {
                if (tMaxX < tMaxY) {
                    tMaxX += tdx;
                    x += sx;
                } else {
                    tMaxY += tdy;
                    y += sy;
                }
                tileHash[this.toID(x, y, maxZoom)] = true;
                if (ring && y !== prevY) ring.push([x, y]);
                prevX = x;
                prevY = y;
            }
        }
    
        if (ring && y === ring[0][1]) ring.pop();
    }
    
    private  appendHashTiles(hash, tiles) {
        var keys = Object.keys(hash);
        for (var i = 0; i < keys.length; i++) {
            tiles.push(this.fromID(+keys[i]));
        }
    }
    
    private toID(x, y, z) {
        var dim = 2 * (1 << z);
        return ((dim * y + x) * 32) + z;
    }
    
    private fromID(id) {
        var z = id % 32,
            dim = 2 * (1 << z),
            xy = ((id - z) / 32),
            x = xy % dim,
            y = ((xy - x) / dim) % dim;
        return [x, y, z];
    }

     tileToBBOX(tile) {
        var e = this.tile2lon(tile[0] + 1, tile[2]);
        var w = this.tile2lon(tile[0], tile[2]);
        var s = this.tile2lat(tile[1] + 1, tile[2]);
        var n = this.tile2lat(tile[1], tile[2]);
        return [w, s, e, n];
    } 
      
      
     tileToGeoJSON(tile) {
        var bbox = this.tileToBBOX(tile);
        var poly = {
            type: 'Polygon',
            coordinates: [[
                [bbox[0], bbox[3]],
                [bbox[0], bbox[1]],
                [bbox[2], bbox[1]],
                [bbox[2], bbox[3]],
                [bbox[0], bbox[3]]
            ]]
        };
        return poly;
    }

     tile2lon(x, z) {
        return x / Math.pow(2, z) * 360 - 180;
    }
    
     tile2lat(y, z) {
        var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
        return this.r2d * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    }
     mergeGeoJSONFeatures(features) {
        // Check if the input array is empty or has only one feature
        if (!features || features.length === 0) {
          return null;
        } else if (features.length === 1) {
            console.log(features)
          return features[0];
        }
      
        // Merge the features iteratively
        let mergedFeature = features[0];
        for (let i = 1; i < features.length; i++) {
            console.log(i)
          mergedFeature = union(mergedFeature, features[i]);
        }
      
        return mergedFeature;
      }
      
      
}