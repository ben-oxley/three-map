import asyncio
import json
import threading
import websockets
from dataclasses import dataclass, asdict
from typing import List, Optional
import leap

@dataclass
class Vector3:
    x: float
    y: float
    z: float

@dataclass
class Hand:
    id: int
    type: str
    palm_position: Vector3
    # Add other fields as needed, e.g. pinch_strength, grab_strength if available in python bindings

@dataclass
class Frame:
    id: int
    timestamp: int
    hands: List[Hand]

class LeapWebsocketListener(leap.Listener):
    def __init__(self, loop):
        super().__init__()
        self.loop = loop
        self.clients = set()

    def on_connection_event(self, event):
        print("Connected to Leap Service")

    def on_device_event(self, event):
        try:
            with event.device.open():
                info = event.device.get_info()
            print(f"Found device {info.serial}")
        except leap.LeapCannotOpenDeviceError:
            print(f"Could not open device")

    def on_tracking_event(self, event):
        # Convert event to dataclass
        hands_data = []
        for hand in event.hands:
            hand_type = "left" if str(hand.type) == "HandType.Left" else "right"
            position = Vector3(
                x=hand.palm.position.x,
                y=hand.palm.position.y,
                z=hand.palm.position.z
            )
            hands_data.append(Hand(
                id=hand.id,
                type=hand_type,
                palm_position=position
            ))
        
        frame_data = Frame(
            id=event.tracking_frame_id,
            timestamp=event.timestamp,
            hands=hands_data
        )

        # Broadcast
        if self.clients:
            json_data = json.dumps(asdict(frame_data))
            # Schedule the broadcast on the main event loop
            self.loop.call_soon_threadsafe(
                asyncio.create_task, 
                self.broadcast(json_data)
            )

    async def broadcast(self, message):
        if not self.clients:
            return
        # Create a list to avoid "Set changed size during iteration" 
        # though websockets usually handles this, it's safer to be robust
        disconnected = set()
        for client in self.clients:
            try:
                await client.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
            except Exception as e:
                print(f"Error sending to client: {e}")
                disconnected.add(client)
        
        self.clients -= disconnected

async def websocket_handler(websocket, path, listener):
    print("Client connected")
    listener.clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        listener.clients.remove(websocket)
        print("Client disconnected")

def start_leap_listener(listener):
    connection = leap.Connection()
    connection.add_listener(listener)
    
    with connection.open():
        connection.set_tracking_mode(leap.TrackingMode.Desktop)
        # Keep this thread alive to allow the listener to receive events
        # The connection context manager handles the connection lifecycle
        # But we need to block here otherwise the thread exits and connection closes?
        # Actually connection.open() just opens it. 
        # We need a loop to keep the process running if this was the main thread.
        # But here 'run_until_complete' in main handles the lifecycle.
        # Wait... the listener methods are called on a background thread created by the bindings?
        # Examining previous example: it has a while loop.
        
        # We need to keep the connection open.
        # Since we are running this in a separate thread (or just initiating it), 
        # let's look at how we structure this with asyncio.
        
        # Actually, best approach is:
        # Main thread runs asyncio loop.
        # Leap connection needs to remain open.
        # The python bindings generic usage seems to be context manager style.
        # existing example:
        # with connection.open():
        #     while running: time.sleep(1)
        
        # So we definitely need to keep this block active.
        import time
        while True:
            time.sleep(1)

async def main():
    loop = asyncio.get_running_loop()
    listener = LeapWebsocketListener(loop)

    # Start Leap Motion in a separate thread because it needs a blocking loop or long-lived context
    leap_thread = threading.Thread(
        target=start_leap_listener, 
        args=(listener,), 
        daemon=True
    )
    leap_thread.start()

    print("Starting WebSocket server on localhost:8765")
    # In newer websockets, the handler receives just the websocket connection object
    async with websockets.serve(lambda ws: websocket_handler(ws, "/", listener), "localhost", 8765):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Stopping server...")
