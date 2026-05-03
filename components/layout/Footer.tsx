export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4">
        <p>© {new Date().getFullYear()} cxweo · Mini Games Hub</p>
      </div>
    </footer>
  );
}
