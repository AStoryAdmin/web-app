/**
 * The whole signed-in app, loaded on demand by main.tsx for every path except the light ones (LiteApp).
 */
import "./styles/pages/archive-reading.css";
import "./styles/pages/book-account.css";
import "./styles/pages/signed-out.css";
import "./styles/pages/writer.css";
import "./styles/pages/family-people.css";
import App from "./App";
import { startMotionWatchdog } from "./lib/motionWatchdog";

startMotionWatchdog();

export default App;
