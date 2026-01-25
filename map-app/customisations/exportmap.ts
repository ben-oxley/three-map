

// Define the interface for the window object to include electronAPI
declare global {
    interface Window {
        electronAPI?: {
            sendMapUpdate: (buffer: ArrayBuffer) => void;
        };
    }
}

export function exportMap(map: maplibregl.Map) {
    function savecanvas() {
        if (window.electronAPI) {
            // Electron Mode: Convert canvas to Blob -> ArrayBuffer -> IPC
            map.getCanvas().toBlob((blob: Blob | null) => {
                if (blob) {
                    blob.arrayBuffer().then((buffer: ArrayBuffer) => {
                        window.electronAPI!.sendMapUpdate(buffer);
                    });
                }
            }, 'image/png');
        } else {
            // Browser Legacy Mode: LocalStorage
            let data = map.getCanvas().toDataURL();
            localStorage.setItem('map', data);
        }
    }

    // Update every 1000ms (1 FPS) for performance
    setInterval(savecanvas, 1000)
}

