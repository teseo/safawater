import { sharedMessage } from "@shared";

export default function App() {
  return (
    <main className="page">
      <h1>Water Dashboard</h1>
      <p className="muted">{sharedMessage}</p>
    </main>
  );
}
