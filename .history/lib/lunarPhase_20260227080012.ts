export async function getCurrentLunarPhase() {
  try {
    const res = await fetch('http://localhost:8000/negative-space/lunar-phase');
    const data = await res.json();
    return data.phase;
  } catch {
    return "Waxing Gibbous";
  }
}
