/**
 * A Story on the web. The routes are the PRD's (docs/PRD.md §5): four places
 * and one Add button for the signed-in person, a handful of signed-out pages,
 * and two pages anyone can open from a link. Screens arrive as they are
 * built; a Placeholder names the rest so no route is ever blank.
 */
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthProvider from "./state/AuthProvider";
import AccountProvider from "./state/AccountProvider";
import RequireAuth from "./state/RequireAuth";
import Placeholder from "./pages/Placeholder";

const page = (name: string) => <Placeholder name={name} />;

const router = createBrowserRouter([
  // Signed out.
  { path: "/welcome", element: page("Welcome") },
  { path: "/sign-in", element: page("Sign in") },
  { path: "/create-account", element: page("Create account") },
  { path: "/verify", element: page("Verify code") },
  { path: "/forgot-password", element: page("Forgot password") },
  { path: "/reset-password", element: page("New password") },
  { path: "/join/:code", element: page("Join a family") },
  // Anyone with a link.
  { path: "/c/:slug", element: page("Contribute") },
  { path: "/p/:slug", element: page("A story") },
  // Signed in.
  {
    element: <RequireAuth />,
    children: [
      { path: "/", element: page("Home") },
      { path: "/start", element: page("Whose story is this?") },
      { path: "/archive", element: page("Archive") },
      { path: "/archive/:id", element: page("Memory") },
      { path: "/write", element: page("Write a memory") },
      { path: "/talk", element: page("Talk") },
      { path: "/family", element: page("Family") },
      { path: "/family/:personId", element: page("Person") },
      { path: "/book", element: page("Book") },
      { path: "/plans", element: page("Plans") },
      { path: "/account", element: page("Account") },
    ],
  },
  { path: "*", element: page("This page isn’t here") },
]);

export default function App() {
  return (
    <AuthProvider>
      <AccountProvider>
        <RouterProvider router={router} />
      </AccountProvider>
    </AuthProvider>
  );
}
