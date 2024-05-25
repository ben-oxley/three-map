

export function exportMap(map: maplibregl.Map) {
    function savecanvas(){
        let data = map.getCanvas().toDataURL();
        localStorage.setItem('map', data)
       //document.getElementsByClassName('maplibregl-canvas')[0].toDataURL();
    }
    
    setInterval(savecanvas, 1000)
}
