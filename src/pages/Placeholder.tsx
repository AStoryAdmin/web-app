/** Stands in for a page until its screen is built; names the route so nothing is a blank. */
export default function Placeholder({ name }: { name: string }) {
  return (
    <main style={{ padding: 32, fontFamily: "Montserrat, system-ui", color: "#3B291D" }}>
      <h1 style={{ fontSize: 24, fontWeight: 500 }}>{name}</h1>
      <p>Not built yet.</p>
    </main>
  );
}
