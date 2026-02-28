"""Negative-Space API — Astronomical calculations and lunar phase engine"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import math
import uvicorn

app = FastAPI(title="Negative-Space", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def calculate_lunar_phase(date: datetime = None) -> dict:
    """Calculate lunar phase for given date (simplified algorithm)"""
    if date is None:
        date = datetime.utcnow()

    # Known new moon date
    new_moon = datetime(2000, 1, 6, 18, 14)
    lunar_cycle = 29.530588861  # Days

    days_since = (date - new_moon).total_seconds() / 86400
    phase = (days_since % lunar_cycle) / lunar_cycle

    phase_names = [
        "New Moon", "Waxing Crescent", "First Quarter",
        "Waxing Gibbous", "Full Moon", "Waning Gibbous",
        "Last Quarter", "Waning Crescent"
    ]
    phase_index = int(phase * 8) % 8
    illumination = abs(math.cos(math.pi * phase))

    return {
        "phase": phase_names[phase_index],
        "illumination": round(illumination, 2),
        "cycle_day": round(days_since % lunar_cycle, 1),
        "cycle_length": 29.53,
        "date": date.isoformat(),
    }

def calculate_solar_position(date: datetime = None) -> dict:
    """Calculate solar position (simplified)"""
    if date is None:
        date = datetime.utcnow()

    day_of_year = date.timetuple().tm_yday
    declination = 23.44 * math.sin(math.radians((day_of_year - 81) * 360 / 365))

    return {
        "declination": round(declination, 2),
        "day_of_year": day_of_year,
        "date": date.isoformat(),
    }

@app.get("/lunar-phase")
async def lunar_phase():
    """Get current lunar phase"""
    return calculate_lunar_phase()

@app.get("/lunar-phase/{date_str}")
async def lunar_phase_for_date(date_str: str):
    """Get lunar phase for specific date (YYYY-MM-DD)"""
    try:
        date = datetime.fromisoformat(date_str)
        return calculate_lunar_phase(date)
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}

@app.get("/solar-position")
async def solar_position():
    """Get current solar position"""
    return calculate_solar_position()

@app.get("/void-mining")
async def void_mining():
    """Void-space mining calculation (Negative-Space proprietary)"""
    lunar = calculate_lunar_phase()
    solar = calculate_solar_position()

    void_index = (lunar["illumination"] * solar["declination"]) % 100
    mining_efficiency = round((1 - lunar["illumination"]) * 100, 2)

    return {
        "void_index": round(void_index, 2),
        "mining_efficiency": mining_efficiency,
        "lunar_phase": lunar["phase"],
        "optimal_window": mining_efficiency > 75,
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "negative-space"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
