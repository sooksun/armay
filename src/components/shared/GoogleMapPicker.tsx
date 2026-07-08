"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- reason: Google Maps JS API is loaded at runtime; @types/google.maps is not a project dependency */

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

// module-level caches so the key fetch + script load happen at most once per page
let cachedKey: string | null = null;
let keyFetched = false;
let mapsPromise: Promise<void> | null = null;

async function getMapsKey(): Promise<string | null> {
  if (keyFetched) return cachedKey;
  try {
    const res = await fetch("/api/config");
    const json = await res.json();
    cachedKey = json?.data?.mapsKey ?? null;
  } catch {
    cachedKey = null;
  }
  keyFetched = true;
  return cachedKey;
}

function loadMaps(key: string): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    (window as any).__armayMapsInit = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&language=th&region=TH&callback=__armayMapsInit`;
    s.async = true;
    s.onerror = () => reject(new Error("maps script failed"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

// the Places autocomplete dropdown mounts on <body>; lift it above the modal (z-index 60)
function ensurePacStyle() {
  if (document.getElementById("armay-pac-style")) return;
  const st = document.createElement("style");
  st.id = "armay-pac-style";
  st.textContent = ".pac-container{z-index:100000 !important}";
  document.head.appendChild(st);
}

const BANGKOK = { lat: 13.7563, lng: 100.5018 };

export function GoogleMapPicker({
  lat,
  lng,
  onPick,
}: {
  lat: string;
  lng: string;
  onPick: (lat: string, lng: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "nokey" | "error">("loading");
  const mapEl = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement>(null);

  // keep the latest callback / coords without re-initialising the map
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const coordRef = useRef({ lat, lng });
  coordRef.current = { lat, lng };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus("loading");

    (async () => {
      const key = await getMapsKey();
      if (cancelled) return;
      if (!key) {
        setStatus("nokey");
        return;
      }
      try {
        ensurePacStyle();
        await loadMaps(key);
        if (cancelled || !mapEl.current) return;
        const g = (window as any).google;

        const plat = parseFloat(coordRef.current.lat);
        const plng = parseFloat(coordRef.current.lng);
        const hasCoord = Number.isFinite(plat) && Number.isFinite(plng) && (plat !== 0 || plng !== 0);
        const center = hasCoord ? { lat: plat, lng: plng } : BANGKOK;

        const map = new g.maps.Map(mapEl.current, {
          center,
          zoom: hasCoord ? 16 : 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const marker = new g.maps.Marker({ position: center, map, draggable: true });
        const commit = (la: number, lo: number) => pickRef.current(la.toFixed(7), lo.toFixed(7));

        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          commit(p.lat(), p.lng());
        });
        map.addListener("click", (e: any) => {
          marker.setPosition(e.latLng);
          commit(e.latLng.lat(), e.latLng.lng());
        });

        if (inputEl.current) {
          const ac = new g.maps.places.Autocomplete(inputEl.current, { fields: ["geometry"] });
          ac.bindTo("bounds", map);
          ac.addListener("place_changed", () => {
            const loc = ac.getPlace()?.geometry?.location;
            if (!loc) return;
            map.panTo(loc);
            map.setZoom(16);
            marker.setPosition(loc);
            commit(loc.lat(), loc.lng());
          });
        }
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // reason: re-run only when the panel toggles open; live lat/lng read via refs so typing doesn't rebuild the map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hasCoord = !!parseFloat(lat) && !!parseFloat(lng);
  const mapsHref = hasCoord ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null;

  const chip: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 14px",
    borderRadius: 11,
    border: "1px solid rgba(56,189,248,0.4)",
    background: "rgba(56,189,248,0.08)",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
        <button type="button" onClick={() => setOpen((v) => !v)} style={chip}>
          <span style={{ color: "#38BDF8", display: "flex" }}>
            <Icon name="search" size={15} />
          </span>
          {open ? "ซ่อนแผนที่" : "เลือกตำแหน่งบนแผนที่"}
        </button>
        {mapsHref && (
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" style={{ ...chip, fontWeight: 500 }}>
            เปิดใน Google Maps ↗
          </a>
        )}
      </div>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            ref={inputEl}
            placeholder="ค้นหาสถานที่ / ที่อยู่ แล้วเลือกจากรายการ…"
            style={{
              width: "100%",
              padding: "11px 13px",
              borderRadius: 12,
              border: "1px solid rgba(var(--surface-rgb),0.14)",
              background: "rgba(var(--surface-rgb),0.05)",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div
            ref={mapEl}
            style={{
              width: "100%",
              height: 280,
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(var(--surface-rgb),0.14)",
              background: "rgba(var(--surface-rgb),0.05)",
            }}
          />
          <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.55)" }}>
            {status === "loading" && "กำลังโหลดแผนที่…"}
            {status === "ready" && "คลิกบนแผนที่ ลากหมุด หรือค้นหา แล้วพิกัดจะถูกเติมให้อัตโนมัติ"}
            {status === "nokey" && "ยังไม่ได้ตั้งค่า GOOGLE_MAPS_API_KEY บนเซิร์ฟเวอร์ — ใส่คีย์ใน .env.production แล้ว recreate web"}
            {status === "error" && "โหลดแผนที่ไม่สำเร็จ — ตรวจสอบว่า API key เปิด Maps JavaScript API + Places API แล้ว"}
          </div>
        </div>
      )}
    </div>
  );
}
