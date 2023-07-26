import * as geojsonhint from '@mapbox/geojsonhint/geojsonhint'
import {select} from 'd3-selection';
import {EditorView, keymap} from "@codemirror/view"
import {jsonParseLinter} from '@codemirror/lang-json'

// export default class GeojsonHelpers{

    
    /**
     * Normalize a GeoJSON feature into a FeatureCollection.
     *
     * @param {object} gj geojson data
     * @returns {object} normalized geojson data
     */
  export function   normalize(gj) {

        var types = {
            Point: 'geometry',
            MultiPoint: 'geometry',
            LineString: 'geometry',
            MultiLineString: 'geometry',
            Polygon: 'geometry',
            MultiPolygon: 'geometry',
            GeometryCollection: 'geometry',
            Feature: 'feature',
            FeatureCollection: 'featurecollection'
        };

        if (!gj || !gj.type) return null;
        var type = types[gj.type];
        if (!type) return null;
    
        if (type === 'geometry') {
            return {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: {},
                    geometry: gj
                }]
            };
        } else if (type === 'feature') {
            return {
                type: 'FeatureCollection',
                features: [gj]
            };

        } else if (type === 'featurecollection') {
            return gj;
        }

}


export function validate(value,editor){
    const err = geojsonhint.hint(value,{});
    editor.clearGutter('error');  
    const rejectableErrors = err.filter(
      (d) => !Object.prototype.hasOwnProperty.call(d, 'level')
    );

    if (err instanceof Error) {
      handleError(err.message);

    } else if (rejectableErrors.length) {
      handleErrors(err);

    } else {
      // err should only include warnings at this point
      // accept the geojson as valid but show the warnings
      handleErrors(err);
      const gj = JSON.parse(editor.getValue());

      try {

        editor.setValue(JSON.stringify(normalize(gj),null,2))

      } catch (e) {
        console.log(e)
      }
    }
    function handleError(msg) {
      const match = msg.match(/line (\d+)/);
      if (match && match[1]) {
        editor.clearGutter('error');
       editor.setGutterMarker(
          parseInt(match[1], 10) - 1,
          'error',
          makeMarker(msg)
        );
      }
    }

    function handleErrors(errors) {
    editor.clearGutter('error');
      errors.forEach((e) => {
       editor.setGutterMarker(e.line, 'error', makeMarker(e.message, e.level));
      });
    }

    function makeMarker(msg, level?) {
      let className = 'error-marker';
      if (level === 'message') {
        className += ' warning';
      }

      return select(document.createElement('div'))
        .attr('class', className)
        .attr('message', msg)
        .node();
    }
  }