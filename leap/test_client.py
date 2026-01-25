import asyncio
import websockets
import json

async def test_client():
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        print("Connected to server")
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            on_tracking_event(data)
            

def on_tracking_event(event):
    message = f"Frame{event['id']}-{len(event['hands'])}hands."
    for hand in event['hands']:
        hand_type = "left" if str(hand['type']) == "HandType.Left" else "right"
        message += f"ID:{hand['id']}-{hand_type}-({hand['palm_position']['x']:.2f},{hand['palm_position']['y']:.2f},{hand['palm_position']['z']:.2f})."
    
    print(f"\r{message}\033[K", end="", flush=True)

if __name__ == "__main__":
    try:
        asyncio.run(test_client())
    except KeyboardInterrupt:
        print("Test client stopped")
