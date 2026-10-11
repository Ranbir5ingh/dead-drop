export interface DevicePoint {
  lat: number;
  lng: number;
}

export function readDeviceLocation(): Promise<DevicePoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("This browser cannot read a location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  });
}

export function locationDenied(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code: number }).code === 1);
}

export function locationMessage(error: unknown): string {
  if (locationDenied(error)) {
    return "Location is off for this site. Allow it to see hunts near you. The request is not stored.";
  }
  if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 3) {
    return "The phone took too long to find itself. Try once more, outdoors if you can.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "This device did not share a location, so the nearby board stayed closed.";
}
