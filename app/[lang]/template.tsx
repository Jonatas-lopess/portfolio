// A template (unlike a layout) is re-mounted on every navigation, so the entry
// animation replays for each page. Keeps the page's flex-1 sizing intact.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col animate-page-in">{children}</div>
}
