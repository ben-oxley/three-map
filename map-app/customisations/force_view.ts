export function forceView(map: any) {
    const target = {
        center: [-2.376958, 52.041385] as [number, number],
        zoom: 17.1,
        bearing: 25,
        pitch: 0
    };

    function checkAndSet() {
        // We use jumpTo for instant correction without animation
        map.jumpTo(target);
    }

    // Check continuously - 100ms is aggressive enough to prevent user interaction
    // but not kill the CPU.
    setInterval(checkAndSet, 100);
}
