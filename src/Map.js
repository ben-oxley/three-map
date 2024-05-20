
import { FC, useRef, useState, useEffect, useMemo } from 'react'
import maplibregl from 'maplibre-gl';
import map_style from './map_style.json'
import LayerSwitcher from '@russss/maplibregl-layer-switcher'
import URLHash from '@russss/maplibregl-layer-switcher/urlhash'
//import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';

const layers = {
    Background: 'background_',
    Slope: 'slope',
    Hillshade: 'hillshade',
    'Aerial Imagery': 'ortho',
    Structures: 'structures_',
    Paths: 'paths_',
    'Buried Services': 'services_',
    Water: 'site_water_',
    DKs: 'dk_',
    'NOC-Physical': 'noc_',
    Power: 'power_',
    Lighting: 'lighting_',
    Villages: 'villages_',
}

const layers_enabled = ['Background', 'Structures', 'Paths', 'Villages']

function Map() {

    const mapContainer = useRef(null);
    const map = useRef(null);
    const [layer_switcher] = useState(new LayerSwitcher(layers, layers_enabled));
    const [url_hash] = useState(new URLHash(layer_switcher))


    useEffect(() => {
        if (map.current) return; // stops map from intializing more than once


        layer_switcher.urlhash = url_hash

        layer_switcher.setInitialVisibility(map_style)
        map.current = new maplibregl.Map(
            url_hash.init({
                container: mapContainer.current,
                style: map_style,
                pitchWithRotate: false,
                dragRotate: false,
            })
        )
        url_hash.enable(map.current)

    }, []);

    return (
        <div className="map-wrap">
            <div ref={mapContainer} className="map" />
        </div>
    );
}

export default Map;
