import LayerSwitcher from '@russss/maplibregl-layer-switcher';

const bounds = [
    [-2.38134046,52.03944606], // Southwest coordinates
    [-2.37267150743,52.04333094837] // Northeast coordinates
];
const map = (window.map = new maplibregl.Map({
  container: 'map',
  //maxBounds: bounds,
  zoom: 17.12,
  center: [-2.377036, 52.04143],
  hash: true,
  style: './styles.json',
  maxZoom: 22,
  attributionControl: false
}));

const layers_enabled = ['Background', 'Structures', 'Paths', 'Villages']
const layer_switcher = new LayerSwitcher(this.layers, layers_enabled)

layer_switcher.setInitialVisibility(map_style)

map.addControl(this.layer_switcher, 'top-right')
url_hash.enable(this.map)

// map.addControl(
//   new maplibregl.NavigationControl({
//     visualizePitch: true,
//     showZoom: true,
//     showCompass: true
//   })
// );

// map.addControl(
//   new maplibregl.TerrainControl({
//     source: 'terrainSource',
//     exaggeration: 1
//   })
// );

map.rotateTo(25);