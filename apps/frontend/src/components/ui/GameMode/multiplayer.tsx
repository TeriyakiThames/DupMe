import GameModeCard from "./GameMode/GameModeCard";

const Multiplayer = () => (
  <div className="flex flex-col items-center min-h-screen p-10">
    <div className="flex flex-col sm:flex-row gap-10">
      <GameModeCard
        title="Multiplayer"
        description="play against real people and test out your skill"
        icon="👥"
        href="/multiplayer"
        bgColor="bg-black"
        textColor="text-white"
      />
    </div>
  </div>
);
console.log(Multiplayer);   

export default Multiplayer;
