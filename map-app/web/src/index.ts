import './index.css'
import { registerSW } from 'virtual:pwa-register'
import maplibregl from 'maplibre-gl'
import map_style from './style/map_style.ts'
import Marker from './marker'
import LayerSwitcher from '@russss/maplibregl-layer-switcher'
import URLHash from '@russss/maplibregl-layer-switcher/urlhash'
import DistanceMeasure from './distancemeasure'
import ContextMenu from './contextmenu'
import VillagesEditor from './villages'
import { roundPosition } from './util'
import InstallControl from './installcontrol'
import ExportControl from './export/export'
import { manifest } from 'virtual:render-svg'

if (import.meta.env.DEV) {
    map_style.sources.villages.data = 'http://localhost:2342/api/villages.geojson'
    map_style.sources.site_plan.url = 'http://localhost:8888/capabilities/buildmap'
    map_style.glyphs = 'http://localhost:8080/fonts/{fontstack}/{range}.pbf'
}

async function loadIcons(map: maplibregl.Map) {
    const ratio = Math.min(Math.round(window.devicePixelRatio), 2)
    const icons = manifest[ratio.toString()]

    const images = ['camping', 'no-access', 'water', 'tree']

    Promise.all(
        images
            .map((image) => async () => {
                const img = await map.loadImage(icons[image])
                map.addImage(image, img.data, { pixelRatio: ratio })
            })
            .map((f) => f())
    )
    /*
    const sdfs = ['parking']

    for (const sdf of sdfs) {
        const img = await map.loadImage(`/sdf/${sdf}.png`)
        map.addImage(sdf, img.data, { sdf: true })
    }
    */
}

class EventMap {
    layers: Record<string, string> = {
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
    map?: maplibregl.Map
    layer_switcher?: LayerSwitcher
    url_hash?: URLHash
    marker?: Marker

    init() {
        registerSW({ immediate: true })
        const layers_enabled = ['Background', 'Structures', 'Paths', 'Villages']
        this.layer_switcher = new LayerSwitcher(this.layers, layers_enabled)

        this.url_hash = new URLHash(this.layer_switcher)
        this.layer_switcher.urlhash = this.url_hash
        this.marker = new Marker(this.url_hash)

        this.layer_switcher.setInitialVisibility(map_style)
        this.map = new maplibregl.Map(
            this.url_hash.init({
                container: 'map',
                style: map_style,
                pitchWithRotate: false,
                dragRotate: false,
                preserveDrawingBuffer: true,
            })
        )
        loadIcons(this.map)

        this.map.touchZoomRotate.disableRotation()

        const url = new URL(window.location.href)
        const embed = url.searchParams.get('embed') == 'true'

        if (!embed) {
            this.map.addControl(new maplibregl.NavigationControl(), 'top-right')

            this.map.addControl(
                new maplibregl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true,
                    },
                    trackUserLocation: true,
                })
            )

            this.map.addControl(
                new maplibregl.ScaleControl({
                    maxWidth: 200,
                    unit: 'metric',
                })
            )

            this.map.addControl(new DistanceMeasure(), 'top-right')
            this.map.addControl(new InstallControl(), 'top-left')

            this.map.addControl(new VillagesEditor('villages', 'villages_symbol'), 'top-right')

            // Display edit control only on browsers which are likely to be desktop browsers
            if (window.matchMedia('(min-width: 600px)').matches) {
                this.map.addControl(new ExportControl(loadIcons), 'top-right')
            }
        } else {
            document.querySelector('header')!.style.display = 'none'
        }

        this.map.addControl(this.layer_switcher, 'top-right')
        this.url_hash.enable(this.map)

        this.map.addControl(this.marker, 'top-right')

        const contextMenu = new ContextMenu(this.map)
        contextMenu.addItem('Set marker', (_e, coords) => {
            this.marker!.setLocation(coords)
        })
        contextMenu.addItem(
            'Clear marker',
            () => {
                this.marker!.setLocation(null)
            },
            () => this.marker!.location != null
        )

        contextMenu.addItem('Copy coordinates', (_e, coords) => {
            const [lng, lat] = roundPosition([coords.lng, coords.lat], this.map!.getZoom())
            navigator.clipboard.writeText(lat + ', ' + lng)
        })
    }
}

const em = new EventMap()

if (document.readyState != 'loading') {
    em.init()
} else {
    document.addEventListener('DOMContentLoaded', em.init)
}

function savecanvas(){
    let data = em.map.getCanvas().toDataURL();
    localStorage.setItem('map', data)
   //document.getElementsByClassName('maplibregl-canvas')[0].toDataURL();
}

setInterval(savecanvas, 1000)