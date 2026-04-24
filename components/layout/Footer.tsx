export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
        <p>© {new Date().getFullYear()} cxweo · Mini Games Hub</p>
        <a
          href="https://github.com/cxweoth/cxweo-game-web"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
