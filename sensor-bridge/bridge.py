#!/usr/bin/env python3
"""
WebSocket bridge: reads MacBook Apple Silicon accelerometer + gyroscope
via macimu and streams pitch/roll/yaw orientation to the browser.

Usage:
    sudo python3 sensor-bridge/bridge.py

The browser game connects to ws://127.0.0.1:8765 and receives JSON:
    { "pitch": float, "roll": float, "yaw": float, "ts": float }

Requires sudo because IOKit HID device access needs elevated privileges.
"""

import argparse
import asyncio
import json
import signal
import sys
import time

try:
    from macimu import IMU
except ImportError:
    print("macimu not installed. Run:")
    print("  pip3 install macimu")
    sys.exit(1)

import websockets


clients: set = set()


async def register(websocket):
    clients.add(websocket)
    remote = websocket.remote_address
    print(f"[+] Client connected: {remote[0]}:{remote[1]} ({len(clients)} total)")
    try:
        await websocket.wait_closed()
    finally:
        clients.discard(websocket)
        print(f"[-] Client disconnected ({len(clients)} remaining)")


async def broadcast(message: str):
    if not clients:
        return
    await asyncio.gather(
        *(c.send(message) for c in list(clients)),
        return_exceptions=True,
    )


async def sensor_loop(publish_hz: int):
    interval = 1.0 / publish_hz

    with IMU(orientation=True, sample_rate=100) as imu:
        print(f"[*] IMU started — streaming at {publish_hz}Hz")

        while True:
            o = imu.orientation()
            if o is not None:
                payload = json.dumps({
                    "pitch": round(o.pitch, 3),
                    "roll": round(o.roll, 3),
                    "yaw": round(o.yaw, 3),
                    "ts": round(time.time(), 4),
                })
                await broadcast(payload)

            await asyncio.sleep(interval)


async def main(host: str, port: int, publish_hz: int):
    if not IMU.available():
        print("ERROR: No Apple SPU accelerometer found on this machine.")
        print("This requires an Apple Silicon MacBook (M2/M3/M4/M5).")
        sys.exit(1)

    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)

    async with websockets.serve(register, host, port):
        print(f"[*] Bridge listening on ws://{host}:{port}")
        print("[*] Start the game in your browser — it will auto-connect.")
        print("[*] Press Ctrl+C to stop.\n")

        sensor_task = asyncio.create_task(sensor_loop(publish_hz))

        await stop.wait()
        sensor_task.cancel()
        try:
            await sensor_task
        except asyncio.CancelledError:
            pass

    print("\n[*] Bridge stopped.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HEIST sensor bridge")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--hz", type=int, default=60, help="Publish rate in Hz")
    args = parser.parse_args()

    asyncio.run(main(args.host, args.port, args.hz))
