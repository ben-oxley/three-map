"""Prints the palm position of each hand, every frame. When a device is 
connected we set the tracking mode to desktop and then generate logs for 
every tracking frame received. The events of creating a connection to the 
server and a device being plugged in also generate logs. 
"""

import leap
import time


class MyListener(leap.Listener):
    def on_connection_event(self, event):
        print("Connected")

    def on_device_event(self, event):
        try:
            with event.device.open():
                info = event.device.get_info()
        except leap.LeapCannotOpenDeviceError:
            info = event.device.get_info()

        print(f"Found device {info.serial}")

    def on_tracking_event(self, event):
        message = f"Frame{event.tracking_frame_id}-{len(event.hands)}hands."
        for hand in event.hands:
            hand_type = "left" if str(hand.type) == "HandType.Left" else "right"
            message += f"ID:{hand.id}-{hand_type}-({hand.palm.position.x:.2f},{hand.palm.position.y:.2f},{hand.palm.position.z:.2f})."
        
        print(f"\r{message}\033[K", end="", flush=True)


def main():
    my_listener = MyListener()

    connection = leap.Connection()
    connection.add_listener(my_listener)

    running = True

    with connection.open():
        connection.set_tracking_mode(leap.TrackingMode.Desktop)
        while running:
            time.sleep(1)


if __name__ == "__main__":
    main()
