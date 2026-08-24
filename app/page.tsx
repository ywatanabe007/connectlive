// Root "/" is handled entirely by proxy.ts redirects.
// This component never actually renders but Next.js requires a default export.
export default function Home() {
  return null;
}
