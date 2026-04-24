import Link from 'next/link';
import { GAMES } from '@/lib/games-registry';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-16">
      <header className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Mini Games Hub
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          一個純前端的小遊戲合集。每天增加一款，桌機與手機都能玩。
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => {
          const content = (
            <Card
              className={cn(
                'h-full transition-all',
                game.implemented
                  ? 'hover:-translate-y-0.5 hover:shadow-md'
                  : 'opacity-70 grayscale',
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span aria-hidden className="text-4xl">
                    {game.emoji}
                  </span>
                  {game.implemented ? null : (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      Coming Soon
                    </span>
                  )}
                </div>
                <CardTitle>{game.name}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              {game.tags && game.tags.length > 0 ? (
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {game.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              ) : null}
            </Card>
          );

          return (
            <li key={game.slug}>
              {game.implemented ? (
                <Link
                  href={`/games/${game.slug}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 rounded-xl"
                >
                  {content}
                </Link>
              ) : (
                <div aria-disabled className="cursor-not-allowed">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
