// components/GameHeader.tsx

interface GameHeaderProps {
  title: string;
  subtitle: string;
}

export function GameHeader({ title, subtitle }: GameHeaderProps) {
  return (
    <div className="text-center mb-10">
      <h1 className="text-5xl font-extrabold italic mb-2">
        {title}
      </h1>
      <p className="text-lg text-gray-700">
        {subtitle}
      </p>
    </div>
  );
}
